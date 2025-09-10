import addBackgroundMusicToVideo from "./utils/addBackgroundMusicToVideo";
import generateBackgroundMusic from "./utils/generateBackgroundMusic";
import generateTranscript from "./utils/generateTranscript";
import joinVideos from "./utils/joinVideos";
import requestVideo from "./utils/requestVideo";
import saveMovieData from "./utils/saveMovieData";
import minimist from "minimist";

type GenerateMovieProps = {
  prompt: string;
  duration?: number; // in minutes
};

export default async function generateMovie({ prompt }: GenerateMovieProps) {
  try {
    const movie = await generateTranscript({ prompt, duration: 1 });

    await saveMovieData({ movie });

    await Promise.all(
      movie.transcript.map(async (scene, index) => {
        await requestVideo({ prompt: scene.prompt, index, title: movie.title });
      })
    );

    await joinVideos({ title: movie.title });

    await generateBackgroundMusic({
      title: movie.title,
      theme: movie.backgroundMusic,
    });

    addBackgroundMusicToVideo({ title: movie.title });
  } catch (error: any) {
    console.log(
      "Error creating movie: ",
      error?.data?.error?.message ?? error?.message ?? error
    );
  }
}

// --- CLI Entrypoint ---
const args = minimist(process.argv.slice(2));
const prompt = args.prompt || args.p;

if (!prompt) {
  console.error("❌ Please provide a prompt using --prompt or -p");
  process.exit(1);
}

generateMovie({ prompt });
