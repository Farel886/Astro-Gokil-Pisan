// app/api/chat/route.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { message, systemPrompt, history, context, isFirstMessage } = await req.json();

    // ... (logika prompt kamu tetap sama) ...

    // Tambahkan timeout 25 detik agar tidak menggantung
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Gunakan model yang lebih stabil jika 2.5 bermasalah
      contents: prompt,
      // config: { ... } // sesuaikan dengan kode kamu
      // Note: jika SDK kamu mendukung signal, tambahkan { signal: controller.signal }
    });

    clearTimeout(timeoutId);
    
    return Response.json({ reply: response.text });

  } catch (error) {
    // LOG ERROR ASLI DI SINI
    console.error("=== GEMINI ERROR ===");
    console.error("Message:", error.message);
    console.error("Status:", error.status); 
    console.error("====================");
    
    // Kirim pesan error yang lebih informatif ke frontend (opsional)
    return Response.json(
      { error: `AI service unavailable: ${error.message}` }, 
      { status: 500 }
    );
  }
}