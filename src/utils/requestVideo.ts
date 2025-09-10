import axios from "axios";
import { execSync } from "child_process";
import { pollResponse } from "./pollResponse";
import { BASE_URL } from "../consts";

export type RequestVideoProps = {
  prompt: string;
  index: number;
  title: string;
};

export default async function requestVideo({
  prompt,
  index,
  title,
}: RequestVideoProps) {
  // Build the request body
  const requestBody = {
    endpoint: `projects/${process.env.PROJECT_ID}/locations/${process.env.LOCATION_ID}/publishers/google/models/${process.env.MODEL_ID}`,
    instances: [
      {
        prompt,
      },
    ],
    parameters: {
      aspectRatio: "16:9",
      sampleCount: 1,
      durationSeconds: "8",
      personGeneration: "allow_all",
      addWatermark: true,
      includeRaiReason: true,
      generateAudio: true,
      resolution: "720p",
    },
  };

  // Get access token from gcloud
  const token = execSync("gcloud auth print-access-token").toString().trim();

  try {
    const response = await axios.post(
      `${BASE_URL}:predictLongRunning`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const operationId = response.data.name;
    console.log("operationalID: ", operationId);
    await pollResponse({ operationId, index, title });
    console.log("resolved: ", operationId);
    return { operationId, success: true };
  } catch (error: any) {
    console.error(
      "Error calling the API:",
      error.response?.data || error.message
    );
    throw error;
  }
}
