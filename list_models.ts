import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const response = await ai.models.list();
    console.log("AVAILABLE MODELS:");
    for await (const model of response) {
      console.log(`- ${model.name}`);
      console.log(`  Supported Generation Methods: ${(model as any).supportedGenerationMethods?.join(', ') || 'None'}`);
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
