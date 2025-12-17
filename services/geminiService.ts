import { GoogleGenAI, Type } from "@google/genai";
import { ActivityResult } from "../types";

// Initialize Gemini Client
// IMPORTANT: API Key is injected from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Computer Vision Human Activity Recognition system. 
Analyze the provided image frame from a webcam stream.
Identify the primary human activity taking place.
Be specific but concise (e.g., "Drinking Water", "Talking on Phone", "Typing", "Waving", "Yoga Pose", "Standing Still").
If no person is visible or the image is unclear, return "No Activity" or "Unknown".
Provide a confidence score between 0 and 1.
Provide a very short 1-sentence description of visual evidence.
`;

export const analyzeActivity = async (base64Image: string): Promise<ActivityResult> => {
  try {
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Identify the human activity in this frame.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activity: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            description: { type: Type.STRING },
          },
          required: ["activity", "confidence", "description"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const data = JSON.parse(text);
    
    return {
      activity: data.activity || "Unknown",
      confidence: data.confidence || 0,
      description: data.description || "No description provided",
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      activity: "Error",
      confidence: 0,
      description: "Failed to analyze frame.",
      timestamp: new Date().toLocaleTimeString(),
    };
  }
};
