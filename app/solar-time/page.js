"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, useTexture } from "@react-three/drei";
import * as THREE from "three";
import * as SunCalc from "suncalc";

function latLngToPosition(lat, lng, radius = 1.01) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function EarthWithTerminator({ date, lat, lng }) {
  const earthRef = useRef();
  const texture = useTexture(
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
  );

  const sunPos = useMemo(() => {
    return SunCalc.getPosition(date, lat, lng);
  }, [date, lat, lng]);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0008;
    }
  });

  const markerPos = useMemo(() => latLngToPosition(lat, lng, 1.02), [lat, lng]);

  const sunDirection = useMemo(() => {
    const altitude = sunPos.altitude;
    const azimuth = sunPos.azimuth;
    const x = Math.cos(altitude) * Math.sin(azimuth);
    const y = Math.sin(altitude);
    const z = Math.cos(altitude) * Math.cos(azimuth);
    return new THREE.Vector3(x, y, z).normalize();
  }, [sunPos]);

  return (
    <group>
      <group ref={earthRef}>
        <Sphere args={[1, 64, 64]}>
          <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
        </Sphere>
        <Sphere args={[1.005, 64, 64]}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.08} side={THREE.BackSide} />
        </Sphere>
        <mesh position={markerPos}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>
      <directionalLight
        position={[sunDirection.x * 5, sunDirection.y * 5, sunDirection.z * 5]}
        intensity={1.6}
        color="#ffffff"
      />
      <ambientLight intensity={0.25} />
    </group>
  );
}

const PRESETS = [
  { name: "Jakarta", lat: -6.2, lng: 106.8 },
  { name: "Tokyo", lat: 35.68, lng: 139.69 },
  { name: "London", lat: 51.51, lng: -0.13 },
  { name: "New York", lat: 40.71, lng: -74.01 },
  { name: "Sydney", lat: -33.87, lng: 151.21 },
];

function formatTime(d) {
  if (!d || isNaN(d)) return "--:--";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function SolarTimePage() {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [latitude, setLatitude] = useState(-6.2);
  const [longitude, setLongitude] = useState(106.8);
  const [dateLabel, setDateLabel] = useState("—");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    setDateLabel(`${dd}/${mm}/${yyyy}`);
  }, []);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
  }, [hour, minute]);

  const sunInfo = useMemo(() => {
    const pos = SunCalc.getPosition(selectedDate, latitude, longitude);
    const times = SunCalc.getTimes(selectedDate, latitude, longitude);
    return {
      altitude: (pos.altitude * 180) / Math.PI,
      azimuth: (pos.azimuth * 180) / Math.PI,
      sunrise: times.sunrise,
      sunset: times.sunset,
      solarNoon: times.solarNoon,
    };
  }, [selectedDate, latitude, longitude]);

  const solarTimeDisplay = useMemo(() => {
    if (!sunInfo.solarNoon) return "--:--";
    const noonTotal = sunInfo.solarNoon.getHours() * 60 + sunInfo.solarNoon.getMinutes();
    const nowTotal = hour * 60 + minute;
    const solarTotal = noonTotal + (nowTotal - 720);
    const h = ((Math.floor(solarTotal / 60) % 24) + 24) % 24;
    const m = ((solarTotal % 60) + 60) % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, [hour, minute, sunInfo.solarNoon]);

  const isDaytime = sunInfo.altitude > 0;

  return (
    <main className="solar-page">
      <nav className="solar-nav">
        <a href="/" className="back-link">← BACK TO JUKEBOX</a>
        <div className="brand-mini">
          <span className="brand-icon">◉</span>
          <span>SOLAR TIME LAB</span>
        </div>
      </nav>

      <div className="solar-container">
        <div className="solar-visual">
          <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }}>
            <EarthWithTerminator date={selectedDate} lat={latitude} lng={longitude} />
            <OrbitControls enableZoom={true} enablePan={false} enableDamping dampingFactor={0.05} />
          </Canvas>
          <div className="visual-caption">
            <span>Earth · {mounted ? dateLabel : "—"}</span>
          </div>
          <div className={`day-badge ${isDaytime ? "day" : "night"}`}>
            {isDaytime ? "☀ DAYTIME" : "☾ NIGHTTIME"}
          </div>
        </div>

        <div className="solar-controls">
          <div className="control-header">
            <div className="header-label">SOLAR TIME CALCULATOR</div>
            <h1>SOLAR TIME</h1>
            <p>Explore how sunlight moves across the Earth at any place and any hour.</p>
          </div>

          <div className="control-group">
            <label>TIME OF DAY · {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}</label>
            <input
              type="range"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="time-slider"
            />
            <input
              type="range"
              min="0"
              max="59"
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="time-slider minute-slider"
            />
            <div className="slider-labels">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
          </div>

          <div className="control-group">
            <label>PRESET LOCATIONS</label>
            <div className="preset-row">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className={`preset-btn ${Math.abs(latitude - p.lat) < 0.1 && Math.abs(longitude - p.lng) < 0.1 ? "active" : ""}`}
                  onClick={() => { setLatitude(p.lat); setLongitude(p.lng); }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group location-inputs">
            <div>
              <label>LATITUDE</label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                step="0.1"
              />
            </div>
            <div>
              <label>LONGITUDE</label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                step="0.1"
              />
            </div>
          </div>

          <div className="data-panel">
            <div className="data-row">
              <span>SOLAR TIME (EST.)</span>
              <strong className="highlight">{solarTimeDisplay}</strong>
            </div>
            <div className="data-row">
              <span>SUN ALTITUDE</span>
              <strong>{sunInfo.altitude.toFixed(1)}°</strong>
            </div>
            <div className="data-row">
              <span>SUN AZIMUTH</span>
              <strong>{sunInfo.azimuth.toFixed(1)}°</strong>
            </div>
            <div className="data-row">
              <span>SUNRISE</span>
              <strong>{formatTime(sunInfo.sunrise)}</strong>
            </div>
            <div className="data-row">
              <span>SUNSET</span>
              <strong>{formatTime(sunInfo.sunset)}</strong>
            </div>
            <div className="data-row">
              <span>SOLAR NOON</span>
              <strong>{formatTime(sunInfo.solarNoon)}</strong>
            </div>
          </div>

          <div className="solar-info-box">
            <p>
              <strong>What is Solar Time?</strong> Solar time is based on the Sun's
              position in the sky. When the Sun reaches its highest point (solar noon),
              it is exactly 12:00 solar time at that location. Clock time differs
              because of Earth's axial tilt, elliptical orbit, and timezone boundaries.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .solar-page {
          min-height: 100vh;
          background: #0f172a;
          color: #e2e8f0;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .solar-nav {
          padding: 20px 5vw;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
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
        .solar-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          padding-top: 80px;
        }
        .solar-visual {
          position: relative;
          background: radial-gradient(circle at center, rgba(59, 130, 246, 0.12), transparent 60%);
          height: 100vh;
          position: sticky;
          top: 80px;
        }
        .solar-visual canvas { width: 100% !important; height: 100% !important; }
        .visual-caption {
          position: absolute;
          bottom: 30px;
          left: 30px;
          font-size: 8px;
          color: rgba(226, 232, 240, 0.5);
          letter-spacing: 0.15em;
          background: rgba(15, 23, 42, 0.7);
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }
        .day-badge {
          position: absolute;
          top: 100px;
          right: 30px;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 9px;
          letter-spacing: 0.15em;
          font-weight: 800;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(96, 165, 250, 0.35);
          color: #93c5fd;
        }
        .day-badge.night {
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(96, 165, 250, 0.25);
          color: rgba(147, 197, 253, 0.7);
        }
        .solar-controls {
          padding: 60px 8vw 60px 4vw;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 28px;
          max-width: 620px;
        }
        .control-header { margin-bottom: 10px; }
        .header-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.24em;
          color: #60a5fa;
          margin-bottom: 10px;
        }
        .control-header h1 {
          margin: 0 0 8px 0;
          font-size: clamp(32px, 5vw, 56px);
          letter-spacing: -0.04em;
          color: #f1f5f9;
          font-weight: 900;
        }
        .control-header p {
          margin: 0;
          color: rgba(226, 232, 240, 0.65);
          font-size: 14px;
          line-height: 1.6;
        }
        .control-group { display: flex; flex-direction: column; gap: 10px; }
        .control-group label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #60a5fa;
        }
        .time-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(148, 163, 184, 0.2);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .minute-slider {
          height: 4px;
          opacity: 0.7;
        }
        .time-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(96, 165, 250, 0.5);
          transition: transform 0.15s;
        }
        .minute-slider::-webkit-slider-thumb {
          width: 14px;
          height: 14px;
          background: #93c5fd;
        }
        .time-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: rgba(226, 232, 240, 0.45);
          letter-spacing: 0.1em;
        }
        .preset-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .preset-btn {
          padding: 8px 14px;
          border-radius: 6px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(30, 41, 59, 0.5);
          color: #e2e8f0;
          font-size: 10px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-btn:hover {
          border-color: rgba(96, 165, 250, 0.5);
          background: rgba(59, 130, 246, 0.12);
        }
        .preset-btn.active {
          background: rgba(59, 130, 246, 0.25);
          border-color: #60a5fa;
          color: #ffffff;
        }
        .location-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .location-inputs input {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 6px;
          padding: 10px 12px;
          color: #f1f5f9;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .location-inputs input:focus { border-color: #60a5fa; }
        .data-panel {
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .data-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: rgba(226, 232, 240, 0.55);
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          padding-bottom: 8px;
        }
        .data-row strong {
          color: #f1f5f9;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .data-row .highlight {
          color: #93c5fd;
          font-size: 14px;
        }
        .solar-info-box {
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(96, 165, 250, 0.15);
          border-radius: 8px;
          padding: 16px;
          margin-top: 10px;
        }
        .solar-info-box p {
          margin: 0;
          font-size: 11px;
          line-height: 1.7;
          color: rgba(226, 232, 240, 0.65);
        }
        .solar-info-box strong { color: #93c5fd; }

        @media (max-width: 900px) {
          .solar-container {
            grid-template-columns: 1fr;
            padding-top: 80px;
          }
          .solar-visual {
            height: 55vh;
            position: relative;
            top: 0;
          }
          .solar-controls { padding: 40px 6vw; }
        }
        @media (max-width: 520px) {
          .solar-nav { padding: 16px 5vw; }
          .preset-row { gap: 6px; }
          .preset-btn { padding: 6px 10px; font-size: 9px; }
        }
      `}</style>
    </main>
  );
}