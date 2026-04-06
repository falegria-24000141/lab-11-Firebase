import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const GEMINI_MODELS = {
  TEXT: 'gemini-2.0-flash',
} as const;

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ 
    model: GEMINI_MODELS.TEXT,
    // Forzamos al modelo a responder en formato JSON estructurado
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
    }
  });
};