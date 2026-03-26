import { GoogleGenAI } from "@google/genai";
import { Habit, JournalEntry } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
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
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text || "Keep pushing forward! You're doing great.";
  } catch (error) {
    console.error("Error generating insights:", error);
    throw new Error("Failed to generate insights");
  }
};