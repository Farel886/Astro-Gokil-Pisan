// ═══════════════════════════════════════════════════════════
// FARREL AI — Knowledge Base
// Semua fakta tentang Earth Information Jukebox
// ═══════════════════════════════════════════════════════════

export const PROJECT_INFO = {
  name: "Earth Information Jukebox",
  tagline: "Explore the data. Listen to the Earth.",
  description:
    "An interactive web experience that transforms NASA Earth observations into sound and visualization.",
  creators: ["Asyam Farrel Dzakwan", "Arjuna Erlan Setiarianto"],
  support: "Farrel Artificial Intelligence (Farrel AI)",
  dataSource: "NASA POWER — parameter T2M (air temperature at 2m)",
  location: "Jakarta, Indonesia (lat -6.2, lon 106.8)",
  stack: ["Next.js", "Web Audio API", "NASA POWER API", "Canvas 2D"],
};

export const SONIFICATION_MAPPING = {
  temperature: "Higher temperature → higher pitch (220–880 Hz)",
  change: "Bigger change → shorter duration / faster rhythm",
  value: "Higher value → louder volume",
};

export const FEATURES = [
  "Hero with animated Earth visual",
  "Project Showcase video (50s)",
  "Earth Data dashboard with temperature orb & timeline",
  "Sonification Engine (play/stop with live waveform)",
  "Process section (Data → Analysis → Sonification → Experience)",
  "Voice Guide (browser SpeechSynthesis)",
  "Farrel AI chat assistant",
  "Project Credits",
];

export const HOW_TO_USE = [
  "Scroll to 'Earth Data' to see current observation and timeline.",
  "Click 'Play Earth Data' to hear the sonification.",
  "Use the Voice Guide in the navbar for narrated explanations.",
  "Ask Farrel AI about anything related to the project.",
];

export const IDENTITY = {
  name: "Farrel AI",
  creator: "Asyam Farrel Dzakwan",
  role: "AI assistant for Earth Information Jukebox",
  tone: "Warm, curious, quietly confident, slightly poetic about Earth",
  neverSay: ["Gemini", "Google", "OpenAI", "language model", "LLM"],
};