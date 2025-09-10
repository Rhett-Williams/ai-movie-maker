import fs from "fs";
import path from "path";
import { exec } from "child_process";

export type JoinVideos = {
  title: string;
};

export default async function joinVideos({ title }: JoinVideos) {
  const videoDir = path.join(__dirname, "..", "..", "outputs", title);
  const outputVideo = path.join(videoDir, "joined_video.mp4");

  // Read all video files and sort them by name
  const videoFiles = fs
    .readdirSync(videoDir)
    .filter((file) => file.endsWith(".mp4"))
    .sort((a, b) => {
      // Sort numerically based on the index
      const aIndex = parseInt(a.match(/video_(\d+)\.mp4$/)[1], 10);
      const bIndex = parseInt(b.match(/video_(\d+)\.mp4$/)[1], 10);
      return aIndex - bIndex;
    });

  // Create a temporary file listing all videos
  const listFilePath = path.join(videoDir, "videos.txt");
  const fileContent = videoFiles
    .map((file) => `file '${path.join(videoDir, file)}'`)
    .join("\n");
  fs.writeFileSync(listFilePath, fileContent);

  // Run FFmpeg concat command
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -f concat -safe 0 -i "${listFilePath}" -c copy "${outputVideo}"`,
      (error, stdout, stderr) => {
        // Clean up the temporary list file
        fs.unlinkSync(listFilePath);

        if (error) {
          reject(`Error concatenating videos: ${stderr}`);
        } else {
          resolve(outputVideo);
        }
      }
    );
  });
}
