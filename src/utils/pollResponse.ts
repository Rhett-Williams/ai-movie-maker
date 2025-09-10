import axios from "axios";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { BASE_URL } from "../consts";

export type PollResponseProps = {
  operationId: string;
  index: number;
  title: string;
  pollInterval?: number; // Optional polling interval in milliseconds (default: 5000)
  maxRetries?: number; // Optional max retries (default: unlimited)
};

export async function pollResponse({
  operationId,
  index,
  title,
  pollInterval = 5000,
  maxRetries = -1,
}: PollResponseProps): Promise<boolean> {
  // Build the request body
  const requestBody = {
    operationName: operationId,
  };

  // Get access token from gcloud
  const token = execSync("gcloud auth print-access-token").toString().trim();

  let retryCount = 0;

  while (maxRetries === -1 || retryCount < maxRetries) {
    try {
      const response = await axios.post(
        `${BASE_URL}:fetchPredictOperation`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check if video data is available
      const videos = response.data.response?.videos;
      if (videos && videos.length > 0 && videos[0].bytesBase64Encoded) {
        const base64Video = videos[0].bytesBase64Encoded;

        // Decode base64 to buffer
        const videoBuffer = Buffer.from(base64Video, "base64");

        // Ensure outputs folder exists
        const outputDir = path.join(__dirname, "..", "..", "outputs", title);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        // Save as MP4 file in /outputs
        const outputPath = path.join(outputDir, `video_${index}.mp4`);
        fs.writeFileSync(outputPath, videoBuffer);

        return true;
      } else if (response.data?.error?.message) {
        throw Error(response.data.error.message);
      }
    } catch (error: any) {
      console.error(
        "Error fetching the operation result:",
        error.response?.data || error.message
      );
      break;
    }

    retryCount++;

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // If we reach here, we've exceeded max retries
  console.error(
    `Max retries (${maxRetries}) exceeded for operation: ${operationId}`
  );
  return false;
}
