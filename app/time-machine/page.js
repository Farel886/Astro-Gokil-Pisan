"use client";

import { useState, useEffect, useRef } from "react";

const CHART_DATA = [
  { year: 1980, temp: 26.6 }, { year: 1982, temp: 26.7 }, { year: 1984, temp: 26.5 },
  { year: 1986, temp: 26.8 }, { year: 1988, temp: 26.9 }, { year: 1990, temp: 27.0 },
  { year: 1992, temp: 26.8 }, { year: 1994, temp: 27.1 }, { year: 1996, temp: 27.0 },
  { year: 1998, temp: 27.4 }, { year: 2000, temp: 27.2 }, { year: 2002, temp: 27.3 },
  { year: 2004, temp: 27.4 }, { year: 2006, temp: 27.5 }, { year: 2008, temp: 27.3 },
  { year: 2010, temp: 27.6 }, { year: 2012, temp: 27.7 }, { year: 2014, temp: 27.8 },
  { year: 2016, temp: 28.0 }, { year: 2018, temp: 27.9 }, { year: 2020, temp: 28.1 },
  { year: 2022, temp: 28.0 }, { year: 2024, temp: 28.2 }, { year: 2026, temp: 28.3 },
];

function tempToFreq(t) {
  return 220 + Math.max(0, Math.min(1, (t - 25) / 5)) * 660;
}

export default function TimeMachinePage() {
  const [yearIndex, setYearIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const currentData = CHART_DATA[yearIndex];
  const baseline = CHART_DATA[0].temp;
  const diff = currentData.temp - baseline;
  const freq = tempToFreq(currentData.temp);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const pad = 40;
      ctx.clearRect(0, 0, w, h);

      const minTemp = 26;
      const maxTemp = 29;
      const minYear = CHART_DATA[0].year;
      const maxYear = CHART_DATA[CHART_DATA.length - 1].year;

      const xFor = (year) => pad + ((year - minYear) / (maxYear - minYear)) * (w - pad * 2);
      const yFor = (temp) => h - pad - ((temp - minTemp) / (maxTemp - minTemp)) * (h - pad * 2);

      ctx.strokeStyle = "rgba(148,163,184,0.1)";
      ctx.lineWidth = 1;
      for (let t = 26; t <= 29; t += 0.5) {
        const y = yFor(t);
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(96,165,250,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      CHART_DATA.forEach((d, i) => {
        const x = xFor(d.year);
        const y = yFor(d.temp);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, pad, 0, h - pad);
      grad.addColorStop(0, "rgba(96,165,250,0.35)");
      grad.addColorStop(1, "rgba(96,165,250,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      CHART_DATA.forEach((d, i) => {
        const x = xFor(d.year);
        const y = yFor(d.temp);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(w - pad, h - pad);
      ctx.lineTo(pad, h - pad);
      ctx.closePath();
      ctx.fill();

      const ax = xFor(currentData.year);
      const ay = yFor(currentData.temp);
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(ax, ay, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.arc(ax, ay, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(226,232,240,0.5)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";
      for (let yr = minYear; yr <= maxYear; yr += 10) {
        ctx.fillText(String(yr), xFor(yr), h - 15);
      }

      animationRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [yearIndex, currentData, mounted]);

  function playYearTone() {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioRef.current = new AC();
    }
    const ctx = audioRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  }

  function startAutoPlay() {
    if (isPlaying) {
      setIsPlaying(false);
      clearTimeout(timerRef.current);
      return;
    }
    setIsPlaying(true);
    let i = 0;
    const next = () => {
      if (i >= CHART_DATA.length) {
        setIsPlaying(false);
        return;
      }
      setYearIndex(i);
      i += 1;
      timerRef.current = setTimeout(next, 700);
    };
    next();
  }

  function handleSlider(e) {
    const idx = Number(e.target.value);
    setYearIndex(idx);
    playYearTone();
  }

  return (
    <main className="tm-page">
      <nav className="tm-nav">
        <a href="/" className="back-link">← BACK TO JUKEBOX</a>
        <div className="brand-mini">
          <span className="brand-icon">◉</span>
          <span>CLIMATE TIME MACHINE</span>
        </div>
      </nav>

      <section className="tm-hero">
        <div className="tm-hero-content">
          <div className="tm-label">1980 — 2026 · JAKARTA</div>
          <h1>CLIMATE<br />TIME MACHINE</h1>
          <p>
            Listen to 46 years of climate change. Drag the slider, hear the pitch rise,
            and see how Jakarta's temperature has shifted since 1980.
          </p>
        </div>
      </section>

      <section className="tm-section">
        <div className="tm-display">
          <div className="tm-year">{mounted ? currentData.year : "—"}</div>
          <div className="tm-temp">{currentData.temp.toFixed(1)}°C</div>
          <div className={`tm-diff ${diff >= 0 ? "warm" : "cool"}`}>
            {diff >= 0 ? "+" : ""}{diff.toFixed(2)}°C vs 1980
          </div>
        </div>

        <div className="tm-slider-wrap">
          <input
            type="range"
            min="0"
            max={CHART_DATA.length - 1}
            value={yearIndex}
            onChange={handleSlider}
            className="tm-slider"
          />
          <div className="tm-slider-labels">
            <span>1980</span>
            <span>2000</span>
            <span>2026</span>
          </div>
        </div>

        <div className="tm-chart-wrap">
          <canvas ref={canvasRef} className="tm-chart" />
        </div>

        <div className="tm-controls">
          <button className="tm-play-btn" onClick={startAutoPlay}>
            {isPlaying ? "■ STOP" : "▶ PLAY CLIMATE HISTORY"}
          </button>
          <div className="tm-hint">
            {isPlaying
              ? "Listening to 46 years of temperature rise..."
              : "Drag the slider to hear each year's pitch."}
          </div>
        </div>

        <div className="tm-info">
          <div className="tm-info-row">
            <span>CURRENT FREQUENCY</span>
            <strong>{freq.toFixed(0)} Hz</strong>
          </div>
          <div className="tm-info-row">
            <span>BASELINE (1980)</span>
            <strong>{baseline.toFixed(2)}°C</strong>
          </div>
          <div className="tm-info-row">
            <span>TOTAL WARMING</span>
            <strong className="warm">+{diff.toFixed(2)}°C</strong>
          </div>
        </div>

        <div className="tm-note">
          <p>
            <strong>Why does this matter?</strong> Each year is a note. Higher
            temperature, higher pitch. When you play the full timeline, you hear
            the planet warming — not as a chart, but as a sound.
          </p>
        </div>
      </section>

      <style jsx>{`
        .tm-page {
          min-height: 100vh;
          background: #0f172a;
          color: #e2e8f0;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .tm-nav {
          padding: 20px 5vw;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(12px);
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
        }
        .back-link {
          color: #60a5fa;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.1em;
          font-weight: 600;
          transition: color 0.2s;
        }
        .back-link:hover { color: #93c5fd; }
        .brand-mini {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #f1f5f9;
        }
        .brand-icon { color: #60a5fa; }

        .tm-hero {
          padding: 160px 8vw 60px;
          background: radial-gradient(circle at 50% 0%, rgba(59,130,246,0.12), transparent 60%);
        }
        .tm-hero-content { max-width: 800px; }
        .tm-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.24em;
          color: #60a5fa;
          margin-bottom: 20px;
        }
        .tm-hero h1 {
          margin: 0 0 20px;
          font-size: clamp(40px, 7vw, 96px);
          line-height: 0.9;
          letter-spacing: -0.05em;
          font-weight: 900;
          color: #f1f5f9;
        }
        .tm-hero p {
          max-width: 540px;
          color: rgba(226,232,240,0.65);
          font-size: 14px;
          line-height: 1.8;
        }

        .tm-section {
          padding: 40px 8vw 100px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .tm-display {
          display: flex;
          align-items: baseline;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .tm-year {
          font-size: clamp(48px, 8vw, 88px);
          font-weight: 900;
          letter-spacing: -0.05em;
          color: #f1f5f9;
          font-variant-numeric: tabular-nums;
        }
        .tm-temp {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 700;
          color: #93c5fd;
          letter-spacing: -0.03em;
        }
        .tm-diff {
          font-size: 12px;
          letter-spacing: 0.1em;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
        }
        .tm-diff.warm {
          background: rgba(251,191,36,0.15);
          border: 1px solid rgba(251,191,36,0.4);
          color: #fbbf24;
        }
        .tm-diff.cool {
          background: rgba(96,165,250,0.15);
          border: 1px solid rgba(96,165,250,0.4);
          color: #60a5fa;
        }

        .tm-slider-wrap {
          margin-bottom: 30px;
        }
        .tm-slider {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          background: rgba(148,163,184,0.2);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }
        .tm-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(96,165,250,0.6);
        }
        .tm-slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 9px;
          letter-spacing: 0.15em;
          color: rgba(226,232,240,0.45);
        }

        .tm-chart-wrap {
          height: 320px;
          border: 1px solid rgba(148,163,184,0.15);
          border-radius: 12px;
          background: rgba(30,41,59,0.5);
          padding: 10px;
          margin-bottom: 24px;
        }
        .tm-chart {
          width: 100%;
          height: 100%;
        }

        .tm-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }
        .tm-play-btn {
          padding: 14px 22px;
          border: 1px solid #3b82f6;
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          color: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
          transition: transform 0.2s;
          box-shadow: 0 8px 30px rgba(59,130,246,0.4);
        }
        .tm-play-btn:hover { transform: translateY(-2px); }
        .tm-hint {
          color: rgba(226,232,240,0.55);
          font-size: 11px;
        }

        .tm-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }
        .tm-info-row {
          padding: 16px;
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(30,41,59,0.5);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tm-info-row span {
          font-size: 8px;
          letter-spacing: 0.18em;
          color: rgba(226,232,240,0.5);
        }
        .tm-info-row strong {
          font-size: 18px;
          color: #f1f5f9;
          font-weight: 700;
        }
        .tm-info-row strong.warm { color: #fbbf24; }

        .tm-note {
          padding: 20px;
          border: 1px solid rgba(96,165,250,0.15);
          background: rgba(59,130,246,0.06);
          border-radius: 8px;
        }
        .tm-note p {
          margin: 0;
          font-size: 12px;
          line-height: 1.7;
          color: rgba(226,232,240,0.7);
        }
        .tm-note strong { color: #93c5fd; }

        @media (max-width: 800px) {
          .tm-hero { padding: 130px 6vw 40px; }
          .tm-section { padding: 30px 6vw 80px; }
          .tm-info { grid-template-columns: 1fr; }
          .tm-chart-wrap { height: 240px; }
        }
      `}</style>
    </main>
  );
}