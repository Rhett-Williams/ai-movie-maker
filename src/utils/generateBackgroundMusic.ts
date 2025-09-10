import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

export type GenerateBackgroundMusic = {
  title: string;
  theme: string;
};

export default async function generateBackgroundMusic({
  title,
  theme,
}: GenerateBackgroundMusic) {
  const videoDir = path.join(__dirname, "..", "..", "outputs", title);
  const videoPath = path.join(videoDir, "joined_video.mp4");
  const outputAudioPath = path.join(videoDir, "background_music.mp3");

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found at ${videoPath}`);
  }

  // 1. Get video duration
  const getVideoDuration = () =>
    new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);
        if (!metadata.format?.duration)
          return reject(new Error("Could not get duration"));
        resolve(metadata.format.duration);
      });
    });

  const durationInSeconds = await getVideoDuration();

  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          music_length_ms: Math.round(durationInSeconds * 1000),
          prompt: `${theme}, instrumental only`,
        }),
      }
    );

    const mp3Buffer = Buffer.from(await response.arrayBuffer());

    // Save buffer to file
    fs.writeFileSync(outputAudioPath, mp3Buffer);
  } catch (error) {
    console.error(error);
  }

  return outputAudioPath;
}
