import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GenerateTranscriptProps = {
  prompt: string;
  /** in minutes */
  duration: number;
};

export type Scene = {
  prompt: string;
  duration: number;
};

export type Characters = {
  name: string;
  description: string;
};

export type Movie = {
  title: string;
  transcript: Scene[];
  backgroundMusic: string;
  artStyle: string;
  characters: Characters[];
};

/**
 * Generate a sequence of movie scenes.
 * @param {string} prompt - The input movie idea.
 * @param {number} duration - The movie length in minutes.
 * @returns {Promise<Scene[]>} - An array of scene objects.
 */
export default async function generateTranscript({
  prompt,
  duration,
}: GenerateTranscriptProps): Promise<Movie> {
  const response = await client.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
  You are a screenplay assistant. Follow these rules precisely:
  
  1. Generate a short movie broken into standalone 8-second scenes. Each scene must be self-contained and describe the visuals, actions, and any dialogue.
  2. Avoid any provocative, offensive, or explicit content.
  3. Always return **strictly valid JSON** in this exact format:
  
  {
    "title": string,               // A creative, catchy movie title
    "backgroundMusic": string,     // Description of the background music; can include style or mood progression
    "artStyle": string,            // Visual style description (e.g., "cartoon", "Christopher Nolan", "retro")
    "characters": [
      {
        "name": string,            // Character name
        "description": string      // Short visual description focused on appearance only
      }
    ],
    "transcript": [
      {
        "prompt": string,          // Full description of a single 8-second scene, including any sound affects or dialog
        "duration": number         // Always 8
      }
    ]
  }
  
  4. Ensure all strings are concise but vivid, especially for visual and character descriptions.
  5. Maintain coherence across scenes but keep each scene independently understandable.
  `,
      },
      {
        role: "user",
        content: `
      Create a sequence of movie scenes for the idea: "${prompt}".  
      The movie should be ${duration} minutes long.  
      `,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "script_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            backgroundMusic: {
              type: "string",
            },
            artStyle: {
              type: "string",
            },
            characters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
                required: ["name", "description"],
                additionalProperties: false,
              },
            },
            transcript: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prompt: { type: "string" },
                  duration: { type: "number" },
                },
                required: ["prompt", "duration"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "title",
            "transcript",
            "backgroundMusic",
            "artStyle",
            "characters",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  // ✅ Correct: Access the already-parsed response
  if (response.choices[0]?.message.parsed) {
    return createStandaloneScenes({
      movieData: response.choices[0].message.parsed,
    });
  }

  // Handle parsing failure
  throw new Error("Failed to generate valid transcript");
}

function createStandaloneScenes({ movieData }: { movieData: Movie }): Movie {
  const { title, artStyle, backgroundMusic, characters, transcript } =
    movieData;

  // Build a lookup for quick consistent character re-descriptions
  const characterMap = {};
  characters.forEach((char) => {
    characterMap[char.name] = char.description;
  });

  // Generate standalone scenes
  const standaloneScenes = transcript.map((scene, index) => {
    // Reintroduce characters explicitly if mentioned in the prompt
    let description = scene.prompt;

    Object.keys(characterMap).forEach((name) => {
      const regex = new RegExp(`\\b${name}(?:'s)?\\b`, "g");
      if (regex.test(description)) {
        description = description.replace(
          regex,
          `${name} (${characterMap[name]})`
        );
      }
    });

    // Wrap scene with style + music info
    return {
      duration: scene.duration,
      prompt: `${description} 
Visual style: ${artStyle}.`,
    };
  });

  return {
    title,
    artStyle,
    backgroundMusic,
    characters,
    transcript: standaloneScenes,
  };
}
