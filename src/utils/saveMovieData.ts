import path from "path";
import fs from "fs";
import type { Movie } from "./generateTranscript";

export type SaveMovieData = {
  movie: Movie;
};

export default async function saveMovieData({ movie }: SaveMovieData) {
  const outputDir = path.join(__dirname, "..", "..", "outputs", movie.title);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save movie data into a JSON file
  const filePath = path.join(outputDir, "movie.json");
  fs.writeFileSync(filePath, JSON.stringify(movie, null, 2), "utf-8");
  return;
}
