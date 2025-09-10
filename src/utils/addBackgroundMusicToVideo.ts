import path from "path";
import ffmpeg from "fluent-ffmpeg";

export type AddBackgroundMusicToVideo = {
  title: string;
};

export default async function addBackgroundMusicToVideo({
  title,
}: AddBackgroundMusicToVideo) {
  const videoDir = path.join(__dirname, "..", "..", "outputs", title);
  const inputVideo = path.join(videoDir, "joined_video.mp4");
  const inputMusic = path.join(videoDir, "background_music.mp3");
  const outputVideo = path.join(videoDir, "joined_video_with_music.mp4");

  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputVideo)
      .input(inputMusic)
      .complexFilter([
        {
          filter: "volume",
          options: 0.5,
          inputs: "1:a",
          outputs: "bgm",
        },
        {
          filter: "amix",
          options: { inputs: 2, dropout_transition: 0 },
          inputs: ["0:a", "bgm"],
          outputs: "mixed",
        },
      ])
      .outputOptions(["-map 0:v", "-map [mixed]", "-c:v copy", "-c:a aac"])
      .save(outputVideo)
      .on("end", () => {
        console.log("Background music added successfully!");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error adding background music:", err);
        reject(err);
      });
  });
}
