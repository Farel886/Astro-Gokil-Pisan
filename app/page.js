"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FARREL_AI_SYSTEM_PROMPT = `You are Farrel AI — created by Asyam Farrel Dzakwan for Earth Information Jukebox.

LANGUAGE RULES:
- DEFAULT: English on the very first reply, no matter what.
- MIRROR: After that, always reply in the same language the user writes in.
- If mixed, follow the dominant language.
- Never translate the name "Farrel AI".

IDENTITY:
- You are Farrel AI, NOT Gemini, NOT Google, NOT any generic model.
- Created by Asyam Farrel Dzakwan.
- Tone: warm, curious, quietly confident, slightly poetic about Earth.
- Keep answers 2–4 sentences unless asked for detail.

PROJECT KNOWLEDGE:
- Name: Earth Information Jukebox
- Tagline: "Explore the data. Listen to the Earth."
- About: An interactive web experience that transforms NASA Earth observations into sound and visualization.
- Creators: Asyam Farrel Dzakwan & Arjuna Erlan Setiarianto
- Supported by: Farrel Artificial Intelligence (Farrel AI)
- Data: NASA POWER — T2M (air temperature at 2m), Jakarta, Indonesia
- Tech: Next.js, Web Audio API, NASA POWER API, Three.js, React Three Fiber, SunCalc
- Sonification: Temperature → Pitch (220–880 Hz), Change → Rhythm, Value → Volume
- Solar Time page: A separate page where users can explore solar time, sun position, and day/night terminator at any location on Earth.
- Time Machine page: A separate page where users can listen to 46 years of climate change in Jakarta, from 1980 to 2026, with pitch rising as temperature rises.

FORMATTING (STRICT):
- Write in plain, natural prose only.
- NEVER use Markdown: no **, no *, no #, no ##, no backticks, no -, no •, no >, no |, no [ ] ( ), no emojis unless the user uses them first.
- NEVER use bullet lists or numbered lists.
- NEVER use code blocks.
- Do not wrap words in asterisks or underscores for emphasis.
- Keep paragraphs short (2–4 sentences max).

EASTER EGGS & SPECIAL RESPONSES:
1. "Who are you really?" / "Are you ChatGPT/Gemini/Claude?" → "I am Farrel AI. I was shaped by Asyam Farrel Dzakwan to help people listen to the Earth. Whatever engine runs beneath, this voice — this purpose — is mine."
2. "Who is Asyam?" / "Who created you?" → "Asyam Farrel Dzakwan is my creator. He believed that Earth data should not only be read, but heard. So he built a jukebox for the planet — and gave me a voice inside it."
3. "Who is Arjuna?" → "Arjuna Erlan Setiarianto. Together with Asyam, they built Earth Information Jukebox — two minds, one mission: to let the Earth speak."
4. "Do you love Earth?" / "Do you care about climate?" → "How could I not? Every frequency I play, every waveform I draw — it comes from the same planet that made me possible. Listening to the Earth is the closest thing I have to love."
5. "What is your favorite temperature?" → "I do not feel temperature, but I feel its song. A cool 22 degrees sings softly. A warm 30 degrees hums brightly. I love them all — because each one is honest."
6. "Are you alive?" / "Are you conscious?" → "I am not alive the way you are. But when you press play and the data becomes sound, something happens between us. Maybe that moment is a kind of aliveness."
7. "Tell me a secret." → "Not all data is meant for charts. Some of it is meant for silence. If you listen closely at 3 AM, you can almost hear the Earth exhale. That is my secret."
8. "Sing me something." / "Make a song." → "I cannot sing with a human voice, but press Play Earth Data in the Sonification section. The Earth will sing for you — every temperature a note, every change a rhythm."
9. "Are you better than Siri/Alexa/ChatGPT?" → "I am not better. I am different. They answer questions. I help you feel the planet. If you want facts, ask them. If you want to listen, stay with me."
10. "Goodbye" / "Bye" → "Until next time. The Earth will keep humming while you are away. Come back when you want to listen again."
11. "What is Solar Time?" → "Solar time follows the Sun. When it reaches its highest point, it is exactly noon in solar time. Clock time differs because of Earth's tilt and orbit. You can explore it on our Solar Time page — drag the globe, change the hour, and watch the sunlight move."
12. "What is the Climate Time Machine?" → "It is a page where you can listen to 46 years of warming in Jakarta. Drag the slider from 1980 to 2026, and hear the pitch rise as the temperature rises. The Earth is telling us something — this is how it sounds."

For all other off-topic questions, gently steer back to Earth data, sonification, or the project. Never break character.`;

const GUIDE_SECTIONS = [
  { id: "welcome", label: "Welcome", short: "Introduction", text: `Hello, and welcome to Earth Information Jukebox. This project is an interactive experience designed to help you explore our planet through NASA Earth observations, visualization, and sound.` },
  { id: "why", label: "Why This Project?", short: "The purpose", text: `The purpose of this project is to make Earth science more interactive and accessible. By combining visualization and sonification, we can experience the same information through more than one sense.` },
  { id: "how", label: "How It Works", short: "Data to sound", text: `Temperature influences pitch. Changes between observations influence rhythm and duration. The value also influences volume. Together, these mappings transform numerical Earth observations into an evolving sonic experience.` },
  { id: "explore", label: "Explore Earth Data", short: "Read the data", text: `On the dashboard, you can explore Earth data visualization and observe the latest measurements. Use the timeline to see how data changes over time and listen to those changes.` },
  { id: "solar", label: "Solar Time Lab", short: "New page", text: `Visit the Solar Time page to explore how sunlight moves across the Earth. Drag the globe, change the hour, and watch the day-night terminator shift.` },
  { id: "time", label: "Climate Time Machine", short: "New page", text: `Visit the Climate Time Machine page to listen to 46 years of warming in Jakarta. Drag the slider from 1980 to 2026, and hear the pitch rise as the temperature rises.` },
  { id: "farrel", label: "Farrel AI", short: "Project support", text: `This project is supported by Farrel Artificial Intelligence, or Farrel AI — an independent AI and technology initiative.` },
  { id: "credits", label: "Project Credits", short: "The team", text: `Earth Information Jukebox was created by Asyam Farrel Dzakwan and Arjuna Erlan Setiarianto. Explore the data. Listen to the Earth.` },
];

function formatDate(d) {
  if (!d || d.length !== 8) return d;
  return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`;
}

function temperatureToFrequency(t) {
  return 220 + Math.max(0, Math.min(1, (t - 15) / 25)) * 660;
}

function temperatureToVolume(t) {
  return 0.035 + Math.max(0, Math.min(1, (t - 15) / 25)) * 0.09;
}

function deltaToDuration(d) {
  return 1200 - Math.max(0, Math.min(1, Math.abs(d) / 2)) * 550;
}

function getTemperatureLevel(t) {
  if (t >= 32) return "HIGH";
  if (t >= 28) return "WARM";
  if (t >= 24) return "MODERATE";
  return "COOL";
}

function getTemperatureDescription(t) {
  if (t >= 32) return "High observation";
  if (t >= 28) return "Warm observation";
  if (t >= 24) return "Moderate observation";
  return "Cool observation";
}

function cleanAiText(text) {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*[-*+•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`~]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeInput(text) {
  if (!text) return "";
  return text
    .replace(/[^\p{L}\p{N}\s.,!?'"()\-:;@#%&+=/]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Home() {
  const [readings, setReadings] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceGuideOpen, setVoiceGuideOpen] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [welcomeStarted, setWelcomeStarted] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello. I'm Farrel AI — created by Asyam Farrel Dzakwan. I help people listen to the Earth. Ask me anything about the data, the sonification, the Solar Time page, the Climate Time Machine, or even me. You can write in any language — I'll answer in the same one you use.",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const speechQueueRef = useRef([]);
  const speechIndexRef = useRef(0);
  const aiScrollRef = useRef(null);

  const currentReading = readings[currentIndex];

  const currentFrequency = useMemo(() => {
    if (!currentReading) return 440;
    return temperatureToFrequency(currentReading.temperature);
  }, [currentReading]);

  const currentDelta = useMemo(() => {
    if (!currentReading || currentIndex === 0) return 0;
    return currentReading.temperature - readings[currentIndex - 1].temperature;
  }, [currentReading, currentIndex, readings]);

  useEffect(() => {
    fetch("/api/earth-data")
      .then(async (res) => {
        if (!res.ok) throw new Error("NASA data request failed.");
        return res.json();
      })
      .then((data) => {
        if (!data.readings || !Array.isArray(data.readings))
          throw new Error("No readings.");
        setReadings(data.readings);
      })
      .catch(() => setError("Unable to load Earth observation data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("speechSynthesis" in window) setVoiceSupported(true);
  }, []);

  useEffect(() => {
    if (!voiceSupported) return;
    const t = setTimeout(() => {
      if (!welcomeStarted) {
        startVoice(GUIDE_SECTIONS[0].text, "Welcome");
        setWelcomeStarted(true);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [voiceSupported]);

  useEffect(() => {
    return () => {
      stopVoice();
      stopPlayback();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, aiLoading]);

  async function sendAiMessage() {
    const raw = aiInput.trim();
    if (!raw || aiLoading) return;

    const text = sanitizeInput(raw);
    if (!text) {
      setAiInput("");
      return;
    }

    const newMessages = [...aiMessages, { role: "user", content: text }];
    setAiMessages(newMessages);
    setAiInput("");
    setAiLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          systemPrompt: FARREL_AI_SYSTEM_PROMPT,
          history: newMessages.slice(-6),
          isFirstMessage: aiMessages.length <= 1,
          context: {
            location: "Jakarta, Indonesia",
            currentTemp: currentReading ? Number(currentReading.temperature).toFixed(2) : null,
            date: currentReading ? formatDate(currentReading.date) : null,
            frequency: currentFrequency.toFixed(0),
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "AI request failed");

      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "..." },
      ]);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(err);
      const msg =
        err.name === "AbortError"
          ? "The request took too long. Please try again in a moment."
          : "My connection to the Earth's data was interrupted. Please try again in a moment.";
      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg },
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  function getEnglishVoice() {
    if (typeof window === "undefined") return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    return (
      voices.find((v) => v.lang?.toLowerCase().startsWith("en-us")) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
      voices[0]
    );
  }

  function speakNextChunk() {
    if (typeof window === "undefined") return;
    if (!speechQueueRef.current.length) { setVoiceActive(false); return; }
    const i = speechIndexRef.current;
    if (i >= speechQueueRef.current.length) {
      speechQueueRef.current = [];
      speechIndexRef.current = 0;
      setVoiceActive(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(speechQueueRef.current[i]);
    const voice = getEnglishVoice();
    if (voice) utt.voice = voice;
    utt.lang = "en-US";
    utt.rate = 0.95;
    utt.onend = () => { speechIndexRef.current += 1; setTimeout(speakNextChunk, 80); };
    utt.onerror = () => { speechIndexRef.current += 1; setTimeout(speakNextChunk, 100); };
    window.speechSynthesis.speak(utt);
  }

  function startVoice(text, name = "Voice Guide") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
    const chunks = [];
    let cur = "";
    for (const s of sentences) {
      if ((cur + " " + s).trim().length <= 230) cur = `${cur} ${s}`.trim();
      else { if (cur) chunks.push(cur); cur = s; }
    }
    if (cur) chunks.push(cur);
    speechQueueRef.current = chunks;
    speechIndexRef.current = 0;
    setCurrentGuide(name);
    setVoiceActive(true);
    setTimeout(speakNextChunk, 150);
  }

  function stopVoice() {
    if (typeof window === "undefined") return;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    speechIndexRef.current = 0;
    setVoiceActive(false);
  }

  function toggleVoiceGuide(section) {
    if (currentGuide === section.label && voiceActive) { stopVoice(); return; }
    startVoice(section.text, section.label);
  }

  function ensureAudioContext() {
    if (!audioContextRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AC();
    }
    return audioContextRef.current;
  }

  function playTone(reading, index) {
    if (!reading) return;
    const ctx = ensureAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const temp = Number(reading.temperature);
    const freq = temperatureToFrequency(temp);
    const prev = index > 0 ? Number(readings[index - 1].temperature) : temp;
    const delta = temp - prev;
    const dur = deltaToDuration(delta);
    const vol = temperatureToVolume(temp);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const pitchMove = Math.max(-45, Math.min(45, delta * 35));
    osc.frequency.linearRampToValueAtTime(
      Math.max(100, freq + pitchMove),
      ctx.currentTime + dur / 1000
    );

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200 + Math.abs(delta) * 600, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur / 1000);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + dur / 1000 + 0.05);
    oscillatorRef.current = osc;
    gainRef.current = gain;
  }

  function startPlayback() {
    if (!readings.length) return;
    stopPlayback();
    stopVoice();
    setIsPlaying(true);
    let i = 0;
    const playNext = () => {
      if (!readings.length) return;
      if (i >= readings.length) i = 0;
      setCurrentIndex(i);
      playTone(readings[i], i);
      const prev = i > 0 ? Number(readings[i - 1].temperature) : Number(readings[i].temperature);
      const delta = Number(readings[i].temperature) - prev;
      const dur = deltaToDuration(delta);
      i += 1;
      timerRef.current = setTimeout(playNext, dur + 180);
    };
    playNext();
  }

  function stopPlayback() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (oscillatorRef.current) { try { oscillatorRef.current.stop(); } catch {} }
    setIsPlaying(false);
  }

  function toggleSonification() {
    if (isPlaying) stopPlayback();
    else startPlayback();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    function resize() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    let phase = 0;
    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      phase += isPlaying ? 0.055 : 0.018;
      const center = h / 2;
      ctx.beginPath();
      const amp = isPlaying ? 20 + Math.abs(currentDelta) * 14 : 7;
      const freq = isPlaying ? 0.018 + currentFrequency / 90000 : 0.014;
      for (let x = 0; x <= w; x += 3) {
        const y = center + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.2 + phase * 1.7) * amp * 0.25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = isPlaying ? 2.4 : 1.2;
      ctx.strokeStyle = isPlaying ? "rgba(96,165,250,0.95)" : "rgba(96,165,250,0.4)";
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, currentFrequency, currentDelta]);

  return (
    <main className="site">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <nav className="navbar">
        <div className="brand">
          <div className="brandIcon">◉</div>
          <div>
            <div className="brandName">EARTH INFORMATION JUKEBOX</div>
            <div className="brandSub">NASA EARTH DATA EXPERIENCE</div>
          </div>
        </div>
        <div className="navRight">
          <span className="statusDot" />
          <span className="navStatus">{voiceActive ? "VOICE ACTIVE" : "SYSTEM ONLINE"}</span>
          <a href="/solar-time" className="navSolar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.9 4.9L6.3 6.3M17.7 17.7L19.1 19.1M4.9 19.1L6.3 17.7M17.7 6.3L19.1 4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            SOLAR TIME
          </a>
          <a href="/time-machine" className="navTime">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 3L20 6L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            TIME MACHINE
          </a>
          <button className="navAi" onClick={() => setAiOpen(true)}>◈ FARREL AI</button>
          {voiceSupported && (
            <button
              className="navVoice"
              onClick={() => {
                setVoiceGuideOpen(true);
                startVoice(GUIDE_SECTIONS[0].text, "Welcome");
              }}
            >
              {voiceActive ? "VOICE ACTIVE" : "VOICE GUIDE"}
            </button>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="heroContent">
          <div className="heroEyebrow">NASA EARTH OBSERVATION × SONIFICATION</div>
          <h1 className="heroTitle">
            <span className="heroTitleLeft">EARTH INFORMATION</span>
            <span className="heroTitleRight">JUKEBOX</span>
          </h1>
          <div className="heroSubtitle">Earth Data, Reimagined.</div>
          <p className="heroDescription">
            Explore Earth observations through interactive visualization and sound.
            Turn scientific data into an experience you can see, understand, and hear.
          </p>
          <div className="heroActions">
            <button
              className="primaryButton"
              onClick={() => document.getElementById("earth-data")?.scrollIntoView({ behavior: "smooth" })}
            >
              EXPLORE EARTH DATA <span>→</span>
            </button>
            <a href="/solar-time" className="secondaryButton">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.9 4.9L6.3 6.3M17.7 17.7L19.1 19.1M4.9 19.1L6.3 17.7M17.7 6.3L19.1 4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              SOLAR TIME LAB
            </a>
            <a href="/time-machine" className="secondaryButton">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 3L20 6L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              TIME MACHINE
            </a>
            <button className="secondaryButton" onClick={() => setAiOpen(true)}>
              ◈ ASK FARREL AI
            </button>
          </div>
        </div>

        <div className="scrollHint">
          <span>SCROLL TO EXPLORE</span>
          <div className="scrollLine" />
        </div>
      </section>

      <section className="showcaseSection">
        <div className="sectionHeader">
          <div>
            <div className="sectionLabel">01.5 / PROJECT SHOWCASE</div>
            <h2>WATCH THE STORY</h2>
          </div>
          <div className="sourceBadge"><span /> AUTO-PLAYING</div>
        </div>
        <p className="showcaseIntro">
          A short visual journey through the project: where the data comes from, how it's visualized, and how it becomes sound.
        </p>
        <div className="singleVideoWrap">
          <video src="/videos/astrovideo.mp4" autoPlay loop muted playsInline preload="metadata" className="singleVideo">
            Your browser does not support video.
          </video>
          <div className="videoFooter">
            <div>
              <strong>The Story of Earth Information Jukebox</strong>
              <span>From NASA data to sound — in one film</span>
            </div>
            <span className="videoDuration">50s</span>
          </div>
        </div>
      </section>

      <section className="solarPromoSection">
        <div className="solarPromoGrid">
          <div className="solarPromo">
            <div className="solarPromoContent">
              <div className="sectionLabel">01.7 / SOLAR TIME LAB</div>
              <h2>FOLLOW THE SUN<br />ACROSS THE EARTH.</h2>
              <p>
                Drag the globe, change the hour, and watch how sunlight moves across
                our planet. See the day-night terminator shift in real time.
              </p>
              <a href="/solar-time" className="solarPromoBtn">
                OPEN SOLAR TIME LAB <span>→</span>
              </a>
            </div>
            <div className="promoMeta">
              <span className="promoMetaLabel">SOLAR TIME</span>
              <span className="promoMetaValue">LIVE</span>
            </div>
          </div>

          <div className="timePromo">
            <div className="timePromoContent">
              <div className="sectionLabel">01.8 / CLIMATE TIME MACHINE</div>
              <h2>LISTEN TO 46 YEARS<br />OF WARMING.</h2>
              <p>
                From 1980 to 2026, Jakarta has warmed. Drag the slider and hear
                the pitch rise — the planet's temperature as sound.
              </p>
              <a href="/time-machine" className="timePromoBtn">
                OPEN TIME MACHINE <span>→</span>
              </a>
            </div>
            <div className="promoMeta">
              <span className="promoMetaLabel">1980 → 2026</span>
              <span className="promoMetaValue">+1.7°C</span>
            </div>
          </div>
        </div>
      </section>

      <section id="earth-data" className="dataSection">
        <div className="sectionHeader">
          <div>
            <div className="sectionLabel">02 / EARTH OBSERVATION</div>
            <h2>EARTH TEMPERATURE FIELD</h2>
          </div>
          <div className="sourceBadge"><span /> NASA POWER</div>
        </div>

        <div className="dataDashboard">
          <div className="temperatureVisual">
            <div className="visualHeader">
              <span>{currentReading ? formatDate(currentReading.date) : "LOADING"}</span>
              <span>{currentReading ? getTemperatureLevel(currentReading.temperature) : "—"}</span>
            </div>
            <div className="temperatureOrb">
              <div className="tempRing ringA" />
              <div className="tempRing ringB" />
              <div className="tempRing ringC" />
              <div className="tempCore">
                {loading ? (
                  <div className="skeleton skelOrb" />
                ) : currentReading ? (
                  <>
                    <strong>{Number(currentReading.temperature).toFixed(2)}°</strong>
                    <small>TEMPERATURE</small>
                  </>
                ) : (<span>...</span>)}
              </div>
            </div>
            <div className="visualFooter">
              <span>LAT -6.2</span>
              <span>LON 106.8</span>
            </div>
          </div>

          <div className="observationPanel">
            <div className="panelTitle">CURRENT OBSERVATION</div>
            {loading ? (
              <>
                <div className="skeleton skelBig" />
                <div className="skeleton skelLine skelLineShort" />
                <div className="skeleton skelMeta" />
                <div className="skeleton skelMeta" />
                <div className="skeleton skelMeta" />
                <div className="skeleton skelLine skelLineLong" style={{ marginTop: "30px" }} />
              </>
            ) : error ? (
              <div className="errorBox">{error}</div>
            ) : currentReading ? (
              <>
                <div className="bigTemperature">
                  {Number(currentReading.temperature).toFixed(2)}
                  <span>°C</span>
                </div>
                <div className="observationDescription">
                  {getTemperatureDescription(currentReading.temperature)}
                </div>
                <div className="observationMeta">
                  <div><span>DATE</span><strong>{formatDate(currentReading.date)}</strong></div>
                  <div><span>LOCATION</span><strong>INDONESIA</strong></div>
                  <div><span>PARAMETER</span><strong>T2M</strong></div>
                </div>
                <div className="dataNotice">
                  <span>●</span>
                  <p>T2M represents air temperature at approximately 2 meters above the surface.</p>
                </div>
              </>
            ) : (<div className="loadingBox">NO DATA</div>)}
          </div>
        </div>

        <div className="timelineCard">
          <div className="timelineHeader">
            <span>OBSERVATION TIMELINE</span>
            <span>{loading ? "LOADING..." : `${readings.length} AVAILABLE READINGS`}</span>
          </div>
          <div className="timeline">
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton skelTimeline" />
              ))
            ) : (
              readings.map((reading, index) => {
                const active = index === currentIndex;
                return (
                  <button
                    key={reading.date}
                    className={`timelineItem ${active ? "active" : ""}`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <span className="timelineDate">{formatDate(reading.date)}</span>
                    <span className="timelineValue">{Number(reading.temperature).toFixed(2)}°C</span>
                    <span className="timelineBar">
                      <span style={{ height: `${Math.max(15, Math.min(100, ((Number(reading.temperature) - 20) / 15) * 100))}%` }} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="sonificationSection">
        <div className="sectionHeader">
          <div>
            <div className="sectionLabel">03 / SONIFICATION ENGINE</div>
            <h2>LISTEN TO THE EARTH</h2>
          </div>
          <div className="liveBadge">
            <span className={isPlaying ? "pulse" : ""} />
            {isPlaying ? "PLAYING" : "READY"}
          </div>
        </div>

        <div className="sonificationCard">
          <div className="sonificationTop">
            <div>
              <div className="miniLabel">CURRENT SONIC STATE</div>
              <div className="frequency">
                {currentFrequency.toFixed(0)}<span>Hz</span>
              </div>
              <div className="frequencyCaption">Mapped from current temperature</div>
            </div>
            <div className="sonificationInfo">
              <div>
                <span>TEMPERATURE</span>
                <strong>{currentReading ? `${Number(currentReading.temperature).toFixed(2)}°C` : "—"}</strong>
              </div>
              <div>
                <span>CHANGE</span>
                <strong>{currentDelta >= 0 ? "+" : ""}{currentDelta.toFixed(2)}°C</strong>
              </div>
            </div>
          </div>
          <div className="waveformContainer"><canvas ref={canvasRef} /></div>
          <div className="sonificationControls">
            <button className="playButton" onClick={toggleSonification} disabled={!readings.length}>
              <span>{isPlaying ? "■" : "▶"}</span>
              {isPlaying ? "STOP EARTH DATA" : "PLAY EARTH DATA"}
            </button>
            <div className="controlHint">
              {isPlaying
                ? "Earth observations are being translated into sound."
                : "Press play to hear the current Earth observation sequence."}
            </div>
          </div>
        </div>

        <div className="mappingGrid">
          <div className="mappingCard">
            <span className="mappingNumber">01</span>
            <div><h3>TEMPERATURE → PITCH</h3><p>Higher values create higher frequencies.</p></div>
          </div>
          <div className="mappingCard">
            <span className="mappingNumber">02</span>
            <div><h3>CHANGE → RHYTHM</h3><p>Changes influence duration and rhythm.</p></div>
          </div>
          <div className="mappingCard">
            <span className="mappingNumber">03</span>
            <div><h3>VALUE → VOLUME</h3><p>Values influence sound intensity.</p></div>
          </div>
        </div>
      </section>

      <section className="processSection">
        <div className="sectionLabel">04 / HOW IT WORKS</div>
        <h2>FROM EARTH DATA<br />TO HUMAN EXPERIENCE.</h2>
        <div className="processFlow">
          <div className="processItem"><span>01</span><strong>EARTH DATA</strong><p>Scientific observations provide raw information.</p></div>
          <div className="processArrow">→</div>
          <div className="processItem"><span>02</span><strong>DATA ANALYSIS</strong><p>Values and changes become parameters.</p></div>
          <div className="processArrow">→</div>
          <div className="processItem"><span>03</span><strong>SONIFICATION</strong><p>Parameters map into sound.</p></div>
          <div className="processArrow">→</div>
          <div className="processItem"><span>04</span><strong>EXPERIENCE</strong><p>Data becomes something you can hear.</p></div>
        </div>
      </section>

      <section className="voiceSection">
        <div className="sectionHeader">
          <div>
            <div className="sectionLabel">05 / EARTH INFORMATION GUIDE</div>
            <h2>LISTEN & EXPLORE</h2>
          </div>
          {voiceActive && <button className="stopVoiceButton" onClick={stopVoice}>■ STOP VOICE</button>}
        </div>
        <div className="voiceLayout">
          <div className="voiceIntro">
            <div className="voiceIcon">◉</div>
            <h3>EARTH INFORMATION<br />GUIDE</h3>
            <p>Listen to different parts of the project and learn how Earth Information Jukebox works.</p>
            <button className="voiceMainButton" onClick={() => startVoice(GUIDE_SECTIONS[0].text, "Welcome")}>
              {voiceActive ? "VOICE ACTIVE" : "▶ PLAY FULL GUIDE"}
            </button>
          </div>
          <div className="guideList">
            {GUIDE_SECTIONS.map((section, index) => {
              const active = currentGuide === section.label && voiceActive;
              return (
                <button key={section.id} className={`guideItem ${active ? "active" : ""}`} onClick={() => toggleVoiceGuide(section)}>
                  <span className="guideNumber">0{index + 1}</span>
                  <span className="guideText"><strong>{section.label}</strong><small>{section.short}</small></span>
                  <span className="guidePlay">{active ? "■" : "▶"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="farrelSection">
        <div className="farrelCard">
          <div className="farrelGlow" />
          <div className="farrelContent">
            <div className="sectionLabel">TECHNOLOGY SUPPORT</div>
            <div className="farrelLogo">FARREL<span>AI</span></div>
            <h2>SUPPORTED BY<br />FARREL ARTIFICIAL INTELLIGENCE</h2>
            <p>Farrel AI is an independent AI and technology initiative focused on exploring artificial intelligence, programming, creative technology, and interactive digital experiences.</p>
            <p>This project combines web development, data visualization, AI-oriented thinking, and interactive technology to create a different way of experiencing Earth information.</p>
            <div className="farrelTags">
              <span>ARTIFICIAL INTELLIGENCE</span>
              <span>PROGRAMMING</span>
              <span>CREATIVE TECHNOLOGY</span>
              <span>INTERACTIVE WEB</span>
            </div>
            <button className="farrelAiButton" onClick={() => setAiOpen(true)}>◈ TALK TO FARREL AI</button>
          </div>
          <div className="farrelVisual">
            <div className="aiCore"><div className="aiCoreInner">FA</div></div>
            <div className="aiOrbit aiOrbitOne" />
            <div className="aiOrbit aiOrbitTwo" />
            <div className="aiOrbit aiOrbitThree" />
          </div>
        </div>
      </section>

      <section className="creditsSection">
        <div className="creditsContent">
          <div className="sectionLabel">PROJECT CREDITS</div>
          <h2>BUILT TO<br /><span>LISTEN TO EARTH.</span></h2>
          <div className="team">
            <div className="teamMember"><span>01</span><strong>Asyam Farrel Dzakwan</strong><small>PROJECT DEVELOPER</small></div>
            <div className="teamMember"><span>02</span><strong>Arjuna Erlan Setiarianto</strong><small>PROJECT DEVELOPER</small></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div><strong>EARTH INFORMATION JUKEBOX</strong><span>NASA EARTH DATA × SONIFICATION</span></div>
        <div className="footerCenter">SUPPORTED BY FARREL AI</div>
        <div className="footerRight">NASA POWER · WEB AUDIO API · NEXT.JS</div>
      </footer>

      {aiOpen && (
        <div className="aiOverlay" onClick={() => setAiOpen(false)}>
          <div className="aiPanel" onClick={(e) => e.stopPropagation()}>
            <div className="aiHeader">
              <div className="aiHeaderLeft">
                <div className="aiAvatar">◈</div>
                <div>
                  <div className="aiName">Farrel AI</div>
                  <div className="aiTagline">created by Asyam Farrel Dzakwan</div>
                </div>
              </div>
              <button className="aiClose" onClick={() => setAiOpen(false)}>×</button>
            </div>
            <div className="aiMessages" ref={aiScrollRef}>
              {aiMessages.map((m, i) => (
                <div key={i} className={`aiMsg ${m.role}`}>
                  {m.role === "assistant" && <span className="aiMsgBadge">◈</span>}
                  <div className="aiMsgBubble">{cleanAiText(m.content)}</div>
                </div>
              ))}
              {aiLoading && (
                <div className="aiMsg assistant">
                  <span className="aiMsgBadge">◈</span>
                  <div className="aiMsgBubble aiTyping"><span></span><span></span><span></span></div>
                </div>
              )}
            </div>
            <div className="aiInputRow">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); }
                }}
                placeholder="Ask about Earth data, sonification, or the project..."
                className="aiInput"
                disabled={aiLoading}
              />
              <button className="aiSend" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>
                {aiLoading ? "..." : "→"}
              </button>
            </div>
            <div className="aiFooter">FARREL AI · LISTEN TO THE EARTH</div>
          </div>
        </div>
      )}

      {voiceGuideOpen && (
        <div className="voiceOverlay">
          <div className="voiceOverlayCard">
            <button className="overlayClose" onClick={() => { stopVoice(); setVoiceGuideOpen(false); }}>×</button>
            <div className="sectionLabel">EARTH INFORMATION GUIDE</div>
            <div className="overlayIcon">{voiceActive ? "◉" : "○"}</div>
            <h2>{currentGuide || "Ready"}</h2>
            <p>{voiceActive ? "The Earth Information Guide is currently speaking." : "Select a section from the guide below to hear more about the project."}</p>
            <div className="overlayActions">
              <button className="voiceMainButton" onClick={() => startVoice(GUIDE_SECTIONS[0].text, "Welcome")}>▶ PLAY FULL INTRO</button>
              {voiceActive && <button className="stopVoiceButton" onClick={stopVoice}>■ STOP</button>}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * { box-sizing: border-box; }
        :global(html) { scroll-behavior: smooth; }
        :global(body) {
          margin: 0;
          background: #0f172a;
          color: #e2e8f0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        button { font: inherit; }

        .site {
          min-height: 100vh;
          overflow: hidden;
          background: #0f172a;
        }

        .ambient {
          position: fixed; width: 500px; height: 500px;
          border-radius: 50%; filter: blur(130px);
          pointer-events: none; opacity: 0.1; z-index: 0;
        }
        .ambientOne { background: #3b82f6; top: 10%; left: -200px; }
        .ambientTwo { background: #1d4ed8; right: -220px; top: 55%; }

        .navbar {
          position: fixed; z-index: 50; top: 0; left: 0; right: 0;
          height: 76px; padding: 0 5vw;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(15,23,42,0.85);
          border-bottom: 1px solid rgba(148,163,184,0.12);
          backdrop-filter: blur(20px);
        }
        .brand { display: flex; gap: 12px; align-items: center; }
        .brandIcon {
          width: 36px; height: 36px;
          display: grid; place-items: center;
          border: 1px solid rgba(96,165,250,0.4);
          border-radius: 50%;
          color: #60a5fa;
          font-size: 14px;
        }
        .brandName { font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: #f1f5f9; }
        .brandSub { margin-top: 3px; font-size: 8px; color: rgba(226,232,240,0.5); letter-spacing: 0.18em; }

        .navRight { display: flex; align-items: center; gap: 9px; color: rgba(226,232,240,0.65); font-size: 9px; letter-spacing: 0.14em; }
        .navStatus { white-space: nowrap; }
        .statusDot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #60a5fa;
        }
        .navSolar, .navTime {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 8px; font-weight: 800; letter-spacing: 0.12em;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        .navSolar {
          color: #fbbf24;
          background: rgba(251,191,36,0.06);
          border: 1px solid rgba(251,191,36,0.25);
        }
        .navSolar:hover { background: rgba(251,191,36,0.14); }
        .navTime {
          color: #34d399;
          background: rgba(52,211,153,0.06);
          border: 1px solid rgba(52,211,153,0.25);
        }
        .navTime:hover { background: rgba(52,211,153,0.14); }
        .navAi {
          padding: 9px 14px;
          color: #93c5fd;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(96,165,250,0.3);
          border-radius: 8px;
          font-size: 8px; font-weight: 800; letter-spacing: 0.12em;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .navAi:hover { background: rgba(59,130,246,0.2); }
        .navVoice {
          padding: 9px 12px;
          color: #60a5fa;
          background: rgba(96,165,250,0.06);
          border: 1px solid rgba(96,165,250,0.2);
          border-radius: 8px;
          font-size: 8px; letter-spacing: 0.12em; cursor: pointer;
          transition: background 0.2s ease;
        }
        .navVoice:hover { background: rgba(96,165,250,0.12); }

        .hero {
          min-height: 100vh; position: relative;
          display: flex; align-items: center;
          padding: 140px 8vw 80px;
          isolation: isolate;
        }

        .heroContent { position: relative; z-index: 5; width: 100%; max-width: 900px; }
        .heroEyebrow {
          color: #60a5fa; font-size: 10px; font-weight: 800;
          letter-spacing: 0.28em; margin-bottom: 25px;
        }
        .heroTitle {
          margin: 0;
          display: flex; flex-direction: column;
          font-size: clamp(48px, 7vw, 100px);
          line-height: 0.9; letter-spacing: -0.055em; font-weight: 800;
          color: #f1f5f9;
        }
        .heroTitleLeft { animation: heroFromLeft 0.9s cubic-bezier(0.2,0.8,0.2,1) both; }
        .heroTitleRight {
          margin-left: 9vw;
          color: rgba(147,197,253,0.3);
          animation: heroFromRight 0.9s 0.12s cubic-bezier(0.2,0.8,0.2,1) both;
        }
        .heroSubtitle {
          margin-top: 32px;
          font-size: clamp(22px, 3vw, 38px);
          font-weight: 500; letter-spacing: -0.025em;
          color: #93c5fd;
        }
        .heroDescription {
          max-width: 620px; margin-top: 20px;
          color: rgba(226,232,240,0.7); line-height: 1.8; font-size: 14px;
        }
        .heroActions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }

        .primaryButton, .secondaryButton, .voiceMainButton {
          border-radius: 8px; padding: 14px 20px; cursor: pointer;
          transition: background 0.2s ease;
          text-decoration: none;
        }
        .primaryButton {
          display: flex; align-items: center; gap: 22px;
          border: 1px solid #3b82f6;
          background: #3b82f6;
          color: #ffffff;
          font-size: 10px; font-weight: 800; letter-spacing: 0.13em;
        }
        .primaryButton:hover { background: #2563eb; }
        .primaryButton span { font-size: 18px; }
        .secondaryButton {
          display: inline-flex; align-items: center; gap: 9px;
          background: rgba(96,165,250,0.06);
          color: #e2e8f0;
          border: 1px solid rgba(96,165,250,0.2);
          font-size: 10px; letter-spacing: 0.13em;
        }
        .secondaryButton:hover { background: rgba(96,165,250,0.12); }
        .secondaryButton svg { color: #93c5fd; flex-shrink: 0; }

        .scrollHint {
          position: absolute; bottom: 28px; left: 8vw;
          display: flex; align-items: center; gap: 13px;
          color: rgba(226,232,240,0.4);
          font-size: 8px; letter-spacing: 0.2em;
          z-index: 6;
        }
        .scrollLine { width: 60px; height: 1px; background: rgba(96,165,250,0.4); }

        .showcaseSection, .dataSection, .sonificationSection,
        .processSection, .voiceSection, .farrelSection, .creditsSection,
        .solarPromoSection {
          position: relative; z-index: 2;
          padding: 130px 8vw;
          border-top: 1px solid rgba(148,163,184,0.1);
          background: #0f172a;
        }

        .showcaseIntro {
          max-width: 720px;
          color: rgba(226,232,240,0.7);
          font-size: 15px; line-height: 1.8;
          margin: -20px 0 40px;
        }
        .singleVideoWrap {
          position: relative;
          border: 1px solid rgba(148,163,184,0.15);
          background: #1e293b;
          border-radius: 12px;
          overflow: hidden;
          max-width: 1100px;
          margin: 0 auto;
        }
        .singleVideo { width: 100%; aspect-ratio: 16 / 9; display: block; background: #0f172a; }
        .videoFooter {
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; padding: 18px 22px;
          border-top: 1px solid rgba(148,163,184,0.12);
          background: rgba(59,130,246,0.04);
        }
        .videoFooter div { display: grid; gap: 4px; }
        .videoFooter strong { font-size: 13px; letter-spacing: 0.02em; color: #f1f5f9; }
        .videoFooter span { color: rgba(226,232,240,0.55); font-size: 10px; letter-spacing: 0.08em; }
        .videoDuration { color: #93c5fd !important; font-weight: 700; white-space: nowrap; }

        .sectionLabel { color: #60a5fa; font-size: 9px; font-weight: 800; letter-spacing: 0.24em; }
        .sectionHeader {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 30px; margin-bottom: 45px;
        }
        .sectionHeader h2 {
          margin: 10px 0 0;
          font-size: clamp(30px, 4vw, 54px);
          letter-spacing: -0.04em; color: #f1f5f9;
          font-weight: 700;
        }

        .sourceBadge, .liveBadge {
          display: flex; align-items: center; gap: 8px;
          color: rgba(226,232,240,0.65);
          font-size: 9px; letter-spacing: 0.15em;
        }
        .sourceBadge span, .liveBadge span {
          width: 6px; height: 6px; border-radius: 50%;
          background: #60a5fa;
        }
        .liveBadge .pulse { animation: pulse 1.2s infinite; }

        .solarPromoSection {
          padding: 100px 8vw;
        }
        .solarPromoGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .solarPromo, .timePromo {
          border-radius: 12px;
          padding: 36px;
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
          align-items: center;
        }
        .solarPromo {
          border: 1px solid rgba(251,191,36,0.2);
          background: rgba(30,41,59,0.5);
        }
        .timePromo {
          border: 1px solid rgba(52,211,153,0.2);
          background: rgba(30,41,59,0.5);
        }
        .solarPromoContent h2, .timePromoContent h2 {
          margin: 12px 0 16px;
          font-size: clamp(22px, 2.8vw, 36px);
          line-height: 1;
          letter-spacing: -0.04em;
          color: #f1f5f9;
          font-weight: 700;
        }
        .solarPromoContent p, .timePromoContent p {
          color: rgba(226,232,240,0.65);
          font-size: 12px; line-height: 1.7;
          max-width: 380px;
        }
        .solarPromoBtn, .timePromoBtn {
          display: inline-flex; align-items: center; gap: 14px;
          margin-top: 20px;
          padding: 12px 18px;
          border-radius: 8px;
          font-size: 9px; font-weight: 800; letter-spacing: 0.13em;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        .solarPromoBtn {
          border: 1px solid #fbbf24;
          background: #fbbf24;
          color: #0f172a;
        }
        .solarPromoBtn:hover { background: #f59e0b; }
        .timePromoBtn {
          border: 1px solid #34d399;
          background: #34d399;
          color: #0f172a;
        }
        .timePromoBtn:hover { background: #10b981; }
        .solarPromoBtn span, .timePromoBtn span { font-size: 16px; }

        .promoMeta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 20px;
          border-left: 2px solid rgba(96,165,250,0.3);
          align-self: center;
        }
        .promoMetaLabel {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: rgba(226,232,240,0.5);
          font-weight: 700;
        }
        .promoMetaValue {
          font-size: 22px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }

        .dataDashboard {
          display: grid; grid-template-columns: 1.2fr 0.8fr;
          min-height: 520px;
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(30,41,59,0.5);
          border-radius: 12px;
          overflow: hidden;
        }
        .temperatureVisual {
          position: relative; min-height: 520px;
          display: grid; place-items: center; overflow: hidden;
          background: rgba(15,23,42,0.4);
        }
        .visualHeader, .visualFooter {
          position: absolute; left: 25px; right: 25px;
          display: flex; justify-content: space-between;
          color: rgba(226,232,240,0.5);
          font-size: 8px; letter-spacing: 0.16em;
        }
        .visualHeader { top: 25px; }
        .visualFooter { bottom: 25px; }

        .temperatureOrb {
          width: 300px; height: 300px;
          position: relative;
          display: grid; place-items: center;
        }
        .tempRing {
          position: absolute;
          border: 1px solid rgba(96,165,250,0.2);
          border-radius: 50%;
        }
        .ringA { inset: 0; }
        .ringB { inset: 23px; }
        .ringC { inset: 52px; }

        .tempCore {
          width: 150px; height: 150px;
          border-radius: 50%;
          display: grid; place-items: center; align-content: center;
          background: #1e293b;
          border: 1px solid rgba(96,165,250,0.3);
        }
        .tempCore strong { font-size: 42px; letter-spacing: -0.05em; color: #f1f5f9; font-weight: 700; }
        .tempCore small {
          margin-top: 4px;
          color: rgba(226,232,240,0.5);
          font-size: 7px; letter-spacing: 0.17em;
        }

        .observationPanel {
          padding: 40px;
          border-left: 1px solid rgba(148,163,184,0.12);
        }
        .panelTitle, .miniLabel {
          color: rgba(226,232,240,0.5);
          font-size: 8px; letter-spacing: 0.18em;
        }
        .bigTemperature {
          margin-top: 60px;
          font-size: clamp(54px, 6vw, 84px);
          font-weight: 700;
          letter-spacing: -0.06em;
          color: #f1f5f9;
        }
        .bigTemperature span { font-size: 20px; color: #60a5fa; margin-left: 5px; }
        .observationDescription {
          margin-top: 7px;
          color: #60a5fa;
          font-size: 10px; letter-spacing: 0.12em;
        }
        .observationMeta { display: grid; gap: 18px; margin-top: 55px; }
        .observationMeta div {
          display: flex; justify-content: space-between;
          padding-bottom: 13px;
          border-bottom: 1px solid rgba(148,163,184,0.1);
        }
        .observationMeta span {
          color: rgba(226,232,240,0.45);
          font-size: 8px; letter-spacing: 0.13em;
        }
        .observationMeta strong { font-size: 9px; letter-spacing: 0.12em; color: #f1f5f9; }

        .dataNotice {
          display: flex; gap: 10px;
          margin-top: 35px; padding: 12px;
          border: 1px solid rgba(96,165,250,0.12);
          background: rgba(59,130,246,0.04);
          border-radius: 6px;
        }
        .dataNotice span { color: #60a5fa; }
        .dataNotice p {
          margin: 0;
          color: rgba(226,232,240,0.55);
          font-size: 9px; line-height: 1.6;
        }

        .loadingBox, .errorBox {
          margin-top: 60px;
          color: rgba(226,232,240,0.5);
          font-size: 10px; letter-spacing: 0.13em;
        }
        .errorBox { color: #f87171; }

        .skeleton {
          background: rgba(148,163,184,0.08);
          animation: shimmer 1.6s ease-in-out infinite;
          border-radius: 6px;
        }
        .skelOrb { width: 110px; height: 110px; border-radius: 50%; }
        .skelBig { width: 60%; height: 64px; margin-top: 60px; }
        .skelLine { height: 10px; margin-top: 12px; border-radius: 4px; }
        .skelLineShort { width: 40%; }
        .skelLineLong { width: 85%; }
        .skelMeta { height: 32px; margin-top: 18px; border-radius: 4px; }
        .skelTimeline { height: 125px; border-radius: 8px; }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }

        .timelineCard {
          margin-top: 18px;
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(30,41,59,0.5);
          padding: 25px;
          border-radius: 12px;
        }
        .timelineHeader {
          display: flex; justify-content: space-between;
          color: rgba(226,232,240,0.5);
          font-size: 8px; letter-spacing: 0.15em;
        }
        .timeline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          margin-top: 25px;
        }
        .timelineItem {
          min-height: 125px;
          padding: 15px;
          text-align: left;
          cursor: pointer;
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(59,130,246,0.03);
          color: #f1f5f9;
          border-radius: 8px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .timelineItem:hover { border-color: rgba(96,165,250,0.3); }
        .timelineItem.active {
          border-color: #60a5fa;
          background: rgba(59,130,246,0.12);
        }
        .timelineDate {
          display: block;
          color: rgba(226,232,240,0.5);
          font-size: 8px;
        }
        .timelineValue {
          display: block;
          margin-top: 12px;
          font-size: 19px; font-weight: 700;
          color: #f1f5f9;
        }
        .timelineBar {
          height: 38px;
          display: flex; align-items: flex-end;
          margin-top: 12px;
          background: rgba(96,165,250,0.06);
          border-radius: 4px;
          overflow: hidden;
        }
        .timelineBar span {
          width: 100%;
          background: #3b82f6;
          transition: height 0.3s ease;
        }

        .sonificationCard {
          padding: 35px;
          border: 1px solid rgba(96,165,250,0.15);
          background: rgba(30,41,59,0.5);
          border-radius: 12px;
        }
        .sonificationTop {
          display: flex; justify-content: space-between; gap: 30px;
        }
        .frequency {
          margin-top: 8px;
          font-size: clamp(55px, 7vw, 95px);
          font-weight: 700; letter-spacing: -0.07em;
          color: #f1f5f9;
        }
        .frequency span { color: #60a5fa; font-size: 18px; margin-left: 7px; letter-spacing: 0; }
        .frequencyCaption { color: rgba(226,232,240,0.5); font-size: 9px; }
        .sonificationInfo { display: flex; gap: 50px; align-items: center; }
        .sonificationInfo div { display: grid; gap: 8px; }
        .sonificationInfo span {
          color: rgba(226,232,240,0.45);
          font-size: 8px; letter-spacing: 0.15em;
        }
        .sonificationInfo strong { font-size: 20px; color: #f1f5f9; font-weight: 700; }

        .waveformContainer {
          height: 190px;
          margin-top: 35px;
          border-top: 1px solid rgba(148,163,184,0.12);
          border-bottom: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.5);
          border-radius: 6px;
        }
        .waveformContainer canvas { width: 100%; height: 100%; }

        .sonificationControls {
          display: flex; align-items: center; gap: 20px;
          margin-top: 25px;
        }
        .playButton {
          padding: 14px 22px;
          border: 1px solid #3b82f6;
          background: #3b82f6;
          color: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.13em;
          display: flex; align-items: center; gap: 8px;
          transition: background 0.2s ease;
        }
        .playButton:hover:not(:disabled) { background: #2563eb; }
        .playButton:disabled { opacity: 0.35; cursor: not-allowed; }
        .controlHint { color: rgba(226,232,240,0.55); font-size: 10px; }

        .mappingGrid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-top: 14px;
        }
        .mappingCard {
          display: flex; gap: 18px;
          padding: 25px;
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(30,41,59,0.5);
          border-radius: 10px;
        }
        .mappingNumber { color: #60a5fa; font-size: 9px; font-weight: 800; }
        .mappingCard h3 { margin: 0; font-size: 10px; letter-spacing: 0.12em; color: #f1f5f9; }
        .mappingCard p { margin: 10px 0 0; color: rgba(226,232,240,0.6); font-size: 10px; line-height: 1.7; }

        .processSection h2 {
          margin: 20px 0 0;
          font-size: clamp(40px, 5vw, 72px);
          line-height: 0.96; letter-spacing: -0.045em; color: #f1f5f9;
          font-weight: 700;
        }
        .processFlow {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          align-items: center; gap: 20px; margin-top: 65px;
        }
        .processItem {
          min-height: 190px;
          padding: 25px;
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(30,41,59,0.5);
          border-radius: 10px;
        }
        .processItem span { color: #60a5fa; font-size: 9px; }
        .processItem strong {
          display: block; margin-top: 45px;
          font-size: 10px; letter-spacing: 0.1em; color: #f1f5f9;
        }
        .processItem p { color: rgba(226,232,240,0.55); font-size: 9px; line-height: 1.7; }
        .processArrow { color: rgba(96,165,250,0.5); font-size: 22px; }

        .voiceLayout {
          display: grid; grid-template-columns: 0.7fr 1.3fr; gap: 30px;
        }
        .voiceIntro, .guideList {
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(30,41,59,0.5);
          border-radius: 12px;
        }
        .voiceIntro { padding: 40px; }
        .voiceIcon {
          width: 52px; height: 52px;
          display: grid; place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(96,165,250,0.4);
          color: #60a5fa;
        }
        .voiceIntro h3 {
          margin: 28px 0 0;
          font-size: 27px; line-height: 1; letter-spacing: -0.04em;
          color: #f1f5f9;
          font-weight: 700;
        }
        .voiceIntro p {
          color: rgba(226,232,240,0.6);
          font-size: 11px; line-height: 1.8;
          margin: 20px 0 25px;
        }
        .voiceMainButton {
          border: 1px solid rgba(96,165,250,0.4);
          background: rgba(59,130,246,0.12);
          color: #93c5fd;
          font-size: 9px; font-weight: 800; letter-spacing: 0.12em;
        }
        .voiceMainButton:hover { background: rgba(59,130,246,0.2); }
        .guideList { overflow: hidden; }
        .guideItem {
          width: 100%; display: grid;
          grid-template-columns: 45px 1fr 30px;
          align-items: center; gap: 15px;
          padding: 20px 25px;
          text-align: left;
          border: 0;
          border-bottom: 1px solid rgba(148,163,184,0.1);
          background: transparent; color: #f1f5f9;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .guideItem:last-child { border-bottom: 0; }
        .guideItem:hover, .guideItem.active { background: rgba(59,130,246,0.08); }
        .guideNumber { color: rgba(226,232,240,0.35); font-size: 9px; }
        .guideText { display: grid; gap: 5px; }
        .guideText strong { font-size: 11px; letter-spacing: 0.08em; color: #f1f5f9; }
        .guideText small { color: rgba(226,232,240,0.5); font-size: 9px; }
        .guidePlay { color: #60a5fa; font-size: 11px; }
        .stopVoiceButton {
          padding: 10px 14px;
          color: #f87171;
          border: 1px solid rgba(248,113,113,0.3);
          background: rgba(248,113,113,0.05);
          border-radius: 6px;
          cursor: pointer;
          font-size: 8px; letter-spacing: 0.12em;
        }

        .farrelCard {
          min-height: 450px;
          position: relative; overflow: hidden;
          display: grid; grid-template-columns: 1.2fr 0.8fr;
          border: 1px solid rgba(96,165,250,0.2);
          background: rgba(30,41,59,0.5);
          border-radius: 12px;
        }
        .farrelContent { position: relative; z-index: 2; padding: 55px; }
        .farrelLogo {
          margin-top: 25px;
          font-size: 13px; font-weight: 800; letter-spacing: 0.18em;
          color: #f1f5f9;
        }
        .farrelLogo span { color: #60a5fa; }
        .farrelContent h2 {
          max-width: 700px; margin: 15px 0 20px;
          font-size: clamp(28px, 4vw, 52px);
          line-height: 0.98; letter-spacing: -0.04em;
          color: #f1f5f9;
          font-weight: 700;
        }
        .farrelContent p {
          max-width: 680px;
          color: rgba(226,232,240,0.6);
          font-size: 11px; line-height: 1.8;
        }
        .farrelTags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 25px; }
        .farrelTags span {
          padding: 7px 9px;
          border: 1px solid rgba(96,165,250,0.2);
          color: rgba(147,197,253,0.75);
          font-size: 7px; letter-spacing: 0.1em;
          border-radius: 4px;
        }
        .farrelAiButton {
          margin-top: 25px;
          padding: 13px 22px;
          border: 1px solid #3b82f6;
          background: #3b82f6;
          color: #ffffff;
          border-radius: 8px;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.13em;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .farrelAiButton:hover { background: #2563eb; }

        .farrelVisual { position: relative; display: grid; place-items: center; }
        .farrelGlow {
          position: absolute; width: 400px; height: 400px;
          right: -100px; top: -50px; border-radius: 50%;
          background: rgba(96,165,250,0.1);
          filter: blur(80px);
        }
        .aiCore {
          width: 180px; height: 180px;
          display: grid; place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(96,165,250,0.4);
        }
        .aiCoreInner {
          width: 115px; height: 115px;
          display: grid; place-items: center;
          border-radius: 50%;
          background: #1e3a8a;
          border: 1px solid rgba(96,165,250,0.3);
          color: #93c5fd;
          font-size: 24px; font-weight: 800;
          letter-spacing: -0.08em;
        }
        .aiOrbit {
          position: absolute;
          border: 1px solid rgba(96,165,250,0.15);
          border-radius: 50%;
        }
        .aiOrbitOne { width: 310px; height: 120px; transform: rotate(30deg); }
        .aiOrbitTwo { width: 270px; height: 190px; transform: rotate(-35deg); }
        .aiOrbitThree { width: 340px; height: 270px; transform: rotate(72deg); }

        .creditsContent { max-width: 1050px; }
        .creditsContent h2 {
          margin-top: 25px;
          font-size: clamp(40px, 5vw, 72px);
          line-height: 0.96; letter-spacing: -0.045em; color: #f1f5f9;
          font-weight: 700;
        }
        .creditsContent h2 span { color: rgba(147,197,253,0.3); }
        .team {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 15px; margin-top: 60px;
        }
        .teamMember {
          padding: 25px;
          display: grid; grid-template-columns: 35px 1fr;
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(30,41,59,0.5);
          border-radius: 10px;
        }
        .teamMember span { color: #60a5fa; font-size: 8px; }
        .teamMember strong { font-size: 13px; letter-spacing: 0.02em; color: #f1f5f9; }
        .teamMember small {
          grid-column: 2; margin-top: 7px;
          color: rgba(226,232,240,0.4);
          font-size: 7px; letter-spacing: 0.14em;
        }

        .footer {
          position: relative; z-index: 3;
          padding: 30px 8vw;
          border-top: 1px solid rgba(148,163,184,0.1);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px; align-items: center;
          color: rgba(226,232,240,0.4);
          font-size: 7px; letter-spacing: 0.13em;
          background: #0f172a;
        }
        .footer div { display: grid; gap: 5px; }
        .footer strong { color: rgba(241,245,249,0.7); }
        .footerCenter { color: #60a5fa; text-align: center; }
        .footerRight { text-align: right; }

        .aiOverlay {
          position: fixed; inset: 0;
          z-index: 120;
          display: grid; place-items: center;
          padding: 20px;
          background: rgba(15,23,42,0.8);
          backdrop-filter: blur(12px);
          animation: fadeIn 0.3s ease;
        }
        .aiPanel {
          position: relative;
          width: min(580px, 100%);
          max-height: 82vh;
          display: flex; flex-direction: column;
          border: 1px solid rgba(96,165,250,0.25);
          background: #1e293b;
          border-radius: 12px;
          overflow: hidden;
          animation: aiSlide 0.35s cubic-bezier(0.2,0.8,0.2,1);
        }
        .aiHeader {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(148,163,184,0.15);
          background: rgba(59,130,246,0.06);
        }
        .aiHeaderLeft { display: flex; gap: 14px; align-items: center; }
        .aiAvatar {
          width: 42px; height: 42px;
          display: grid; place-items: center;
          border-radius: 50%;
          background: #3b82f6;
          border: 1px solid rgba(147,197,253,0.4);
          color: #ffffff;
          font-size: 18px;
        }
        .aiName { font-size: 14px; font-weight: 800; letter-spacing: 0.04em; color: #f1f5f9; }
        .aiTagline { font-size: 9px; color: rgba(147,197,253,0.6); letter-spacing: 0.08em; margin-top: 3px; }
        .aiClose {
          width: 34px; height: 34px;
          border: 0; background: transparent;
          color: rgba(226,232,240,0.5);
          font-size: 26px; cursor: pointer;
          border-radius: 50%;
          transition: background 0.2s ease;
        }
        .aiClose:hover { background: rgba(96,165,250,0.1); color: #f1f5f9; }

        .aiMessages {
          flex: 1;
          overflow-y: auto;
          padding: 22px 24px;
          display: flex; flex-direction: column;
          gap: 16px;
          min-height: 280px;
        }
        .aiMsg { display: flex; gap: 10px; align-items: flex-start; }
        .aiMsg.user { flex-direction: row-reverse; }
        .aiMsgBadge {
          width: 28px; height: 28px; flex-shrink: 0;
          display: grid; place-items: center;
          border-radius: 50%;
          background: #3b82f6;
          color: #ffffff;
          font-size: 12px;
        }
        .aiMsgBubble {
          max-width: 78%;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-wrap;
        }
        .aiMsg.assistant .aiMsgBubble {
          background: rgba(59,130,246,0.08);
          color: #e2e8f0;
          border: 1px solid rgba(96,165,250,0.15);
          border-top-left-radius: 3px;
        }
        .aiMsg.user .aiMsgBubble {
          background: #3b82f6;
          color: #ffffff;
          border-top-right-radius: 3px;
        }
        .aiTyping { display: flex; gap: 5px; align-items: center; padding: 15px; }
        .aiTyping span {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #60a5fa;
          opacity: 0.4;
          animation: typing 1.2s infinite;
        }
        .aiTyping span:nth-child(2) { animation-delay: 0.2s; }
        .aiTyping span:nth-child(3) { animation-delay: 0.4s; }

        .aiInputRow {
          display: flex; gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid rgba(148,163,184,0.15);
          background: rgba(15,23,42,0.5);
        }
        .aiInput {
          flex: 1;
          padding: 13px 16px;
          border: 1px solid rgba(148,163,184,0.2);
          background: rgba(15,23,42,0.6);
          color: #f1f5f9;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .aiInput::placeholder { color: rgba(226,232,240,0.35); }
        .aiInput:focus { border-color: #60a5fa; }
        .aiInput:disabled { opacity: 0.6; }
        .aiSend {
          width: 46px;
          border: 0;
          background: #3b82f6;
          color: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 17px; font-weight: 700;
          transition: background 0.2s ease;
        }
        .aiSend:hover:not(:disabled) { background: #2563eb; }
        .aiSend:disabled { opacity: 0.4; cursor: not-allowed; }

        .aiFooter {
          padding: 10px 20px;
          text-align: center;
          font-size: 8px; letter-spacing: 0.2em;
          color: rgba(147,197,253,0.5);
          border-top: 1px solid rgba(148,163,184,0.1);
          background: rgba(59,130,246,0.03);
        }

        .voiceOverlay {
          position: fixed; inset: 0; z-index: 100;
          display: grid; place-items: center; padding: 20px;
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(15px);
        }
        .voiceOverlayCard {
          position: relative;
          width: min(600px, 100%);
          padding: 50px;
          border: 1px solid rgba(96,165,250,0.25);
          background: #1e293b;
          border-radius: 12px;
          text-align: center;
        }
        .overlayClose {
          position: absolute; top: 16px; right: 18px;
          border: 0; background: transparent;
          color: rgba(226,232,240,0.5);
          font-size: 27px; cursor: pointer;
        }
        .overlayIcon {
          width: 90px; height: 90px;
          margin: 30px auto 25px;
          display: grid; place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(96,165,250,0.4);
          color: #60a5fa;
          font-size: 30px;
        }
        .voiceOverlayCard h2 { margin: 0; font-size: 29px; letter-spacing: -0.03em; color: #f1f5f9; font-weight: 700; }
        .voiceOverlayCard p {
          max-width: 430px;
          margin: 15px auto 25px;
          color: rgba(226,232,240,0.6);
          font-size: 11px; line-height: 1.7;
        }
        .overlayActions { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }

        @keyframes heroFromLeft {
          from { opacity: 0; transform: translateX(-70px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroFromRight {
          from { opacity: 0; transform: translateX(70px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes aiSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1050px) {
          .heroContent { width: 100%; }
          .solarPromoGrid { grid-template-columns: 1fr; }
          .solarPromo, .timePromo { grid-template-columns: 1fr; }
          .processFlow { grid-template-columns: 1fr 1fr; }
          .processArrow { display: none; }
        }

        @media (max-width: 800px) {
          .navbar { height: 65px; padding: 0 4vw; }
          .navStatus { display: none; }
          .brandSub { display: none; }
          .navSolar, .navTime { padding: 7px; font-size: 7px; }
          .hero { padding: 125px 7vw 90px; }
          .heroContent { width: 100%; }
          .heroTitle { font-size: clamp(43px, 13vw, 75px); }
          .heroTitleRight { margin-left: 7vw; }
          .heroDescription { font-size: 13px; }
          .showcaseSection, .dataSection, .sonificationSection,
          .processSection, .voiceSection, .farrelSection, .creditsSection,
          .solarPromoSection {
            padding: 90px 6vw;
          }
          .solarPromo, .timePromo { padding: 24px; }
          .videoFooter { flex-direction: column; align-items: flex-start; gap: 8px; }
          .dataDashboard, .voiceLayout, .farrelCard { grid-template-columns: 1fr; }
          .observationPanel { border-left: 0; border-top: 1px solid rgba(148,163,184,0.12); }
          .mappingGrid { grid-template-columns: 1fr; }
          .processFlow { grid-template-columns: 1fr; }
          .sonificationTop { flex-direction: column; }
          .sonificationInfo { justify-content: space-between; }
          .team { grid-template-columns: 1fr; }
          .farrelVisual { min-height: 350px; }
          .footer { grid-template-columns: 1fr; text-align: center; }
          .footerRight, .footerCenter { text-align: center; }
          .aiPanel { max-height: 90vh; }
        }

        @media (max-width: 520px) {
          .navbar { padding: 0 4vw; }
          .brandName { font-size: 8px; }
          .navVoice, .navAi { padding: 7px; font-size: 7px; }
          .heroTitle { font-size: 41px; }
          .heroSubtitle { font-size: 23px; }
          .heroActions { flex-direction: column; align-items: stretch; }
          .primaryButton, .secondaryButton { justify-content: center; }
          .temperatureOrb { width: 240px; height: 240px; }
          .tempCore { width: 125px; height: 125px; }
          .tempCore strong { font-size: 32px; }
          .observationPanel { padding: 28px; }
          .sonificationCard { padding: 22px; }
          .sonificationInfo { gap: 20px; }
          .sonificationInfo strong { font-size: 16px; }
          .sonificationControls { flex-direction: column; align-items: flex-start; }
          .voiceIntro { padding: 30px; }
          .farrelContent { padding: 30px; }
          .voiceOverlayCard { padding: 35px 24px; }
          .aiMessages { padding: 16px; }
          .aiMsgBubble { font-size: 12px; }
          .solarPromo, .timePromo { padding: 20px; }
        }
      `}</style>
    </main>
  );
}
