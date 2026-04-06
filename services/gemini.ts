import { GoogleGenAI, Modality } from "@google/genai";
import { Habit, JournalEntry } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMusic = async (prompt: string): Promise<string> => {
  const client = getClient();
  if (!client) {
    throw new Error("API Key invalid or missing");
  }

  try {
    const response = await client.models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: prompt,
    });

    let audioBase64 = "";
    let mimeType = "audio/wav";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }

    if (!audioBase64) {
      throw new Error("No audio generated");
    }

    // Decode base64 audio into a playable Blob URL
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error generating music:", error);
    throw new Error("Failed to generate music");
  }
};

export const getAiInsights = async (
  habits: Habit[],
  journalEntries: JournalEntry[]
): Promise<string> => {
  const client = getClient();
  if (!client) {
    throw new Error("API Key invalid or missing");
  }

  // Format data for prompt
  const habitList = habits.map(h => h.name).join(", ") || "No habits tracked yet.";
  
  // Get last 5 entries to avoid token limits and focus on recent context
  const recentJournals = journalEntries
    .slice(0, 5)
    .map(j => `Date: ${j.date}, Mood: ${j.mood}, Content: ${j.content}`)
    .join("\n") || "No journal entries yet.";

  const prompt = `
    Analyze this user's habit data:
    Habits: ${habitList}
    
    Recent Journal Entries:
    ${recentJournals}

    Give 3 short, punchy bullet points of advice and 1 motivating sentence. 
    Use emojis. Keep it under 100 words.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "Keep pushing forward! You're doing great.";
  } catch (error) {
    console.error("Error generating insights:", error);
    throw new Error("Failed to generate insights");
  }
};