import { GoogleGenAI, Type } from "@google/genai";
import { MonthlyStats } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getProgressInsight = async (
  stats: MonthlyStats,
  currentDate: Date
): Promise<{ message: string; tone: string }> => {
  const client = getClient();
  if (!client) {
    return { 
      message: "API Key missing. Please configure your environment.", 
      tone: "warning" 
    };
  }

  const prompt = `
    You are a personal habit coach. Analyze this user's progress for ${currentDate.toLocaleString('default', { month: 'long' })}.
    
    Data:
    - Completion Rate: ${stats.completionRate.toFixed(1)}%
    - Best Habit: ${stats.habitPerformance.sort((a, b) => b.rate - a.rate)[0]?.name || 'None'}
    - Worst Habit: ${stats.habitPerformance.sort((a, b) => a.rate - b.rate)[0]?.name || 'None'}
    - Trend: The user has completed ${stats.totalCompleted} tasks out of ${stats.totalPossible} opportunities so far.

    If the rate is below 50%, give a strict but helpful warning about their downward progress.
    If between 50-80%, be encouraging.
    If above 80%, be celebratory.
    Keep the message short (under 50 words) and impactful.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            tone: { type: Type.STRING, enum: ["warning", "encouraging", "celebratory"] }
          },
          required: ["message", "tone"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      message: "Keep pushing! Consistency is key.",
      tone: "encouraging"
    };
  }
};

export const getEndOfMonthReview = async (
  stats: MonthlyStats,
  monthName: string
): Promise<string> => {
  const client = getClient();
  if (!client) return "Unable to generate review due to missing API configuration.";

  const missedHabits = stats.habitPerformance
    .filter(h => h.rate < 60)
    .map(h => h.name)
    .join(", ");

  const prompt = `
    Write a concise end-of-month review for ${monthName}.
    The user achieved a ${stats.completionRate.toFixed(1)}% completion rate.
    Habits they struggled with: ${missedHabits || "None!"}.
    Provide 3 specific bullet points on how to improve next month.
    Format as valid Markdown.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "No review generated.";
  } catch (error) {
    return "Failed to generate review.";
  }
};