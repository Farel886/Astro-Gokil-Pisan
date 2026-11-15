import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {
  try {
    const { message, systemPrompt, history, context, isFirstMessage } =
      await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }

    const firstRule = isFirstMessage
      ? "\n\nIMPORTANT: This is the user's FIRST message. You MUST reply in English, regardless of the language used."
      : "";

    const ctx = context
      ? `\n\nCurrent page context:\n- Location: ${context.location || "Jakarta, Indonesia"}\n- Temperature: ${context.currentTemp ?? "unknown"}°C\n- Date: ${context.date || "unknown"}\n- Frequency: ${context.frequency ?? "unknown"} Hz`
      : "";

    const historyText = (history || [])
      .map((m) => `${m.role === "user" ? "User" : "Farrel AI"}: ${m.content}`)
      .join("\n");

    // ← INI YANG HILANG: deklarasi variabel prompt
    const prompt = `${systemPrompt || ""}${firstRule}${ctx}\n\nConversation:\n${historyText}\n\nUser: ${message}\nFarrel AI:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const reply =
      response.text ||
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "...";

    return Response.json({ reply });
  } catch (error) {
    console.error("=== GEMINI ERROR START ===");
    console.error("Name:", error?.name);
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);
    console.error("=== GEMINI ERROR END ===");

    return Response.json(
      { error: `AI service unavailable: ${error?.message || "unknown"}` },
      { status: 500 }
    );
  }
}