import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { message, systemPrompt, history, context, isFirstMessage } = await req.json();

    const firstRule = isFirstMessage
      ? "\n\nIMPORTANT: This is the user's FIRST message. You MUST reply in English, regardless of the language used."
      : "";

    const ctx = context
      ? `\n\nCurrent page context:\n- Location: ${context.location}\n- Temperature: ${context.currentTemp}°C\n- Date: ${context.date}\n- Frequency: ${context.frequency} Hz`
      : "";

    const historyText = (history || [])
      .map((m) => `${m.role === "user" ? "User" : "Farrel AI"}: ${m.content}`)
      .join("\n");

    const prompt = `${systemPrompt || ""}${firstRule}${ctx}\n\nConversation:\n${historyText}\n\nUser: ${message}\nFarrel AI:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    return Response.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini error:", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}