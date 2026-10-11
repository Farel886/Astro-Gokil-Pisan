"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const INDONESIA = {
  lat: -6.2,
  lon: 106.8,
};

const GUIDE_SECTIONS = [
  {
    id: "welcome",
    label: "Welcome",
    short: "Introduction",
    text: `Hello, and welcome to Earth Information Jukebox.

This project is an interactive experience designed to help you explore our planet through NASA Earth observations, visualization, and sound.

Earth generates enormous amounts of scientific data every day. Temperature, atmosphere, oceans, vegetation, and many other observations help scientists understand how our planet is changing.

However, scientific data is often presented through numbers, charts, and visualizations. Earth Information Jukebox explores another way to experience that information by transforming Earth data into sound.`,
  },
  {
    id: "why",
    label: "Why This Project?",
    short: "The purpose",
    text: `The purpose of this project is to make Earth science more interactive and accessible.

Scientific data can sometimes feel abstract when it is presented only as numbers. By combining visualization and sonification, we can experience the same information through more than one sense.

The goal is not to turn scientific data into music simply for entertainment.

Instead, sonification provides another way to perceive patterns, changes, and relationships within Earth observations.

We hope this approach can make scientific information more engaging, especially for people who may not normally interact with large scientific datasets.`,
  },
  {
    id: "how",
    label: "How It Works",
    short: "Data to sound",
    text: `So, how does the sonification work?

First, Earth observation data is collected and processed.

Then, the data is mapped into sound.

In this project, temperature influences pitch. Higher temperatures produce a higher frequency, while lower temperatures produce a lower frequency.

Changes between observations influence the rhythm and duration of each sound.

The value of the observation also influences volume.

Together, these mappings transform numerical Earth observations into an evolving sonic experience.`,
  },
  {
    id: "explore",
    label: "Explore Earth Data",
    short: "Read the data",
    text: `On the Earth Information Jukebox dashboard, you can explore an Earth data visualization and observe the latest available measurements.

The dashboard presents the observation value, date, location, and a timeline of available readings.

The visualization is designed as an interactive representation of Earth information rather than simply displaying a table of numbers.

You can use the observation timeline to see how the data changes over time and then listen to those changes through the sonification system.`,
  },
  {
    id: "farrel",
    label: "Farrel AI",
    short: "Project support",
    text: `This project is also supported by Farrel Artificial Intelligence, or Farrel AI.

Farrel AI is an independent AI and technology initiative focused on exploring artificial intelligence, programming, creative technology, and interactive digital experiences.

Through Farrel AI, this project brings together web development, data visualization, artificial intelligence oriented thinking, and human interaction into one digital experience.

The goal is to continue exploring how technology can make complex information easier to understand and more engaging.`,
  },
  {
    id: "credits",
    label: "Project Credits",
    short: "The team",
    text: `Earth Information Jukebox was created by Asyam Farrel Dzakwan and Arjuna Erlan Setiarianto.

We created this project to explore a different way of experiencing information about our planet.

We hope this experience helps you see Earth data from a different perspective, not only as numbers on a screen, but as information that can be explored, experienced, and heard.

Welcome to Earth Information Jukebox.

Explore the data.

Listen to the Earth.`,
  },
];

const FULL_WELCOME = `
Hello, and welcome to Earth Information Jukebox.

This project is an interactive experience designed to help you explore our planet through NASA Earth observations, visualization, and sound.

Earth generates enormous amounts of scientific data every day. Temperature, atmosphere, oceans, vegetation, and many other observations help scientists understand how our planet is changing.

However, scientific data is often presented through numbers, charts, and visualizations. Earth Information Jukebox explores another way to experience that information by transforming Earth data into sound.

On this website, you can explore Earth observations through an interactive visualization, view observation data, and listen to a sonification generated from the data.

Our sonification system translates changes in Earth data into different musical properties.

Temperature can influence pitch.

Changes in the data can influence rhythm.

And the value of an observation can influence volume.

The goal is not to turn scientific data into music simply for entertainment, but to create another way for people to perceive and interact with information about our planet.

This project is also supported by Farrel Artificial Intelligence, or Farrel AI.

Farrel AI is an independent AI and technology initiative focused on exploring artificial intelligence, programming, creative technology, and interactive digital experiences.

Through Farrel AI, this project combines web development, data visualization, AI oriented thinking, and interactive technology into one experience.

Earth Information Jukebox was created by Asyam Farrel Dzakwan and Arjuna Erlan Setiarianto.

We hope this experience helps you see Earth data from a different perspective, not only as numbers on a screen, but as information that can be experienced, explored, and heard.

Welcome to Earth Information Jukebox.

Explore the data.

Listen to the Earth.
`;

function temperatureToFrequency(temp) {
  const minTemp = 15;
  const maxTemp = 40;
  const minFreq = 220;
  const maxFreq = 880;

  const normalized = Math.max(
    0,
    Math.min(1, (temp - minTemp) / (maxTemp - minTemp))
  );

  return minFreq + normalized * (maxFreq - minFreq);
}

function temperatureToVolume(temp) {
  const minTemp = 15;
  const maxTemp = 40;

  const normalized = Math.max(
    0,
    Math.min(1, (temp - minTemp) / (maxTemp - minTemp))
  );

  return 0.035 + normalized * 0.09;
}

function deltaToDuration(delta) {
  const normalized = Math.max(0, Math.min(1, Math.abs(delta) / 2));
  return 1200 - normalized * 550;
}

function formatDate(dateString) {
  if (!dateString || dateString.length !== 8) return dateString;

  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);

  return `${day}/${month}/${year}`;
}

function getTemperatureLevel(temp) {
  if (temp >= 32) return "HIGH";
  if (temp >= 28) return "WARM";
  if (temp >= 24) return "MODERATE";
  return "COOL";
}

function getTemperatureDescription(temp) {
  if (temp >= 32) {
    return "High observation";
  }

  if (temp >= 28) {
    return "Warm observation";
  }

  if (temp >= 24) {
    return "Moderate observation";
  }

  return "Cool observation";
}

function splitSpeechText(text, maxLength = 230) {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/);

  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= maxLength) {
      current = `${current} ${sentence}`.trim();
    } else {
      if (current) chunks.push(current);
      current = sentence;
    }
  }

  if (current) chunks.push(current);

  return chunks;
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

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const timerRef = useRef(null);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const speechQueueRef = useRef([]);
  const speechIndexRef = useRef(0);

  const currentReading = readings[currentIndex];

  const currentFrequency = useMemo(() => {
    if (!currentReading) return 440;
    return temperatureToFrequency(currentReading.temperature);
  }, [currentReading]);

  const currentDelta = useMemo(() => {
    if (!currentReading || currentIndex === 0) return 0;

    return (
      currentReading.temperature -
      readings[currentIndex - 1].temperature
    );
  }, [currentReading, currentIndex, readings]);

  useEffect(() => {
    fetch("/api/earth-data")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("NASA data request failed.");
        }

        return response.json();
      })
      .then((data) => {
        if (!data.readings || !Array.isArray(data.readings)) {
          throw new Error("No Earth observation readings found.");
        }

        setReadings(data.readings);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load Earth observation data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      setVoiceSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!voiceSupported) return;

    const timer = setTimeout(() => {
      if (!welcomeStarted) {
        startVoice(FULL_WELCOME, "Welcome");
        setWelcomeStarted(true);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [voiceSupported]);

  useEffect(() => {
    return () => {
      stopVoice();
      stopPlayback();

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  function getEnglishVoice() {
    if (typeof window === "undefined") return null;

    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) return null;

    const preferredNames = [
      "Google US English",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Samantha",
      "Alex",
    ];

    for (const preferred of preferredNames) {
      const found = voices.find((voice) =>
        voice.name.toLowerCase().includes(preferred.toLowerCase())
      );

      if (found) return found;
    }

    return (
      voices.find((voice) =>
        voice.lang?.toLowerCase().startsWith("en-us")
      ) ||
      voices.find((voice) =>
        voice.lang?.toLowerCase().startsWith("en")
      ) ||
      voices[0]
    );
  }

  function speakNextChunk() {
    if (typeof window === "undefined") return;

    if (!speechQueueRef.current.length) {
      setVoiceActive(false);
      return;
    }

    const index = speechIndexRef.current;

    if (index >= speechQueueRef.current.length) {
      speechQueueRef.current = [];
      speechIndexRef.current = 0;
      setVoiceActive(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      speechQueueRef.current[index]
    );

    const voice = getEnglishVoice();

    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = "en-US";
    utterance.rate = 0.93;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      speechIndexRef.current += 1;

      setTimeout(() => {
        speakNextChunk();
      }, 80);
    };

    utterance.onerror = () => {
      speechIndexRef.current += 1;

      setTimeout(() => {
        speakNextChunk();
      }, 100);
    };

    window.speechSynthesis.speak(utterance);
  }

  function startVoice(text, sectionName = "Voice Guide") {
    if (typeof window === "undefined") return;

    if (!("speechSynthesis" in window)) {
      alert("Your browser does not support speech synthesis.");
      return;
    }

    window.speechSynthesis.cancel();

    const chunks = splitSpeechText(text);

    speechQueueRef.current = chunks;
    speechIndexRef.current = 0;

    setCurrentGuide(sectionName);
    setVoiceActive(true);

    setTimeout(() => {
      speakNextChunk();
    }, 150);
  }

  function stopVoice() {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speechQueueRef.current = [];
    speechIndexRef.current = 0;

    setVoiceActive(false);
  }

  function toggleVoiceGuide(section) {
    if (currentGuide === section.label && voiceActive) {
      stopVoice();
      return;
    }

    startVoice(section.text, section.label);
  }

  function ensureAudioContext() {
    if (!audioContextRef.current) {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      audioContextRef.current = new AudioContext();
    }

    return audioContextRef.current;
  }

  function playTone(reading, index) {
    if (!reading) return;

    const context = ensureAudioContext();

    if (context.state === "suspended") {
      context.resume();
    }

    const temperature = Number(reading.temperature);

    const frequency = temperatureToFrequency(temperature);

    const previous =
      index > 0 ? Number(readings[index - 1].temperature) : temperature;

    const delta = temperature - previous;

    const duration = deltaToDuration(delta);
    const volume = temperatureToVolume(temperature);

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      frequency,
      context.currentTime
    );

    const pitchMovement = Math.max(
      -45,
      Math.min(45, delta * 35)
    );

    oscillator.frequency.linearRampToValueAtTime(
      Math.max(100, frequency + pitchMovement),
      context.currentTime + duration / 1000
    );

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(
      2200 + Math.abs(delta) * 600,
      context.currentTime
    );

    gain.gain.setValueAtTime(0.0001, context.currentTime);

    gain.gain.exponentialRampToValueAtTime(
      volume,
      context.currentTime + 0.06
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duration / 1000
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration / 1000 + 0.05);

    oscillatorRef.current = oscillator;
    gainRef.current = gain;
  }

  function startPlayback() {
    if (!readings.length) return;

    stopPlayback();

    stopVoice();

    setIsPlaying(true);

    let index = 0;

    const playNext = () => {
      if (!readings.length) return;

      if (index >= readings.length) {
        index = 0;
      }

      setCurrentIndex(index);

      playTone(readings[index], index);

      const previous =
        index > 0
          ? Number(readings[index - 1].temperature)
          : Number(readings[index].temperature);

      const delta =
        Number(readings[index].temperature) - previous;

      const duration = deltaToDuration(delta);

      index += 1;

      timerRef.current = setTimeout(playNext, duration + 180);
    };

    playNext();
  }

  function stopPlayback() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {}
    }

    setIsPlaying(false);
  }

  function toggleSonification() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      const ratio = window.devicePixelRatio || 1;

      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    let phase = 0;

    function draw() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ctx.clearRect(0, 0, width, height);

      phase += isPlaying ? 0.055 : 0.018;

      const center = height / 2;

      ctx.beginPath();

      const amplitude = isPlaying
        ? 20 + Math.abs(currentDelta) * 14
        : 7;

      const frequency = isPlaying
        ? 0.018 + currentFrequency / 90000
        : 0.014;

      for (let x = 0; x <= width; x += 3) {
        const y =
          center +
          Math.sin(x * frequency + phase) * amplitude +
          Math.sin(x * frequency * 2.2 + phase * 1.7) *
            amplitude *
            0.25;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = isPlaying ? 2.4 : 1.2;

      ctx.strokeStyle = isPlaying
        ? "rgba(14, 165, 233, 0.95)"
        : "rgba(14, 165, 233, 0.4)";

      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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
            <div className="brandName">
              EARTH INFORMATION JUKEBOX
            </div>

            <div className="brandSub">
              NASA EARTH DATA EXPERIENCE
            </div>
          </div>
        </div>

        <div className="navRight">
          <span className="statusDot" />

          <span>
            {voiceActive ? "VOICE ACTIVE" : "SYSTEM ONLINE"}
          </span>

          {voiceSupported && (
            <button
              className="navVoice"
              onClick={() => {
                setVoiceGuideOpen(true);

                startVoice(
                  FULL_WELCOME,
                  "Welcome"
                );
              }}
            >
              {voiceActive ? "VOICE ACTIVE" : "VOICE GUIDE"}
            </button>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="heroGrid" />

        <div className="heroContent">
          <div className="heroEyebrow heroLeft">
            NASA EARTH OBSERVATION × SONIFICATION
          </div>

          <h1 className="heroTitle">
            <span className="heroTitleLeft">
              EARTH INFORMATION
            </span>

            <span className="heroTitleRight">
              JUKEBOX
            </span>
          </h1>

          <div className="heroSubtitle heroRight">
            Earth Data, Reimagined.
          </div>

          <p className="heroDescription heroLeft">
            Explore Earth observations through interactive
            visualization and sound. Turn scientific data
            into an experience you can see, understand,
            and hear.
          </p>

          <div className="heroActions heroRight">
            <button
              className="primaryButton"
              onClick={() => {
                document
                  .getElementById("earth-data")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
            >
              EXPLORE EARTH DATA
              <span>→</span>
            </button>

            <button
              className="secondaryButton"
              onClick={() => {
                setVoiceGuideOpen(true);

                startVoice(
                  FULL_WELCOME,
                  "Welcome"
                );
              }}
            >
              <span>◉</span>
              LISTEN TO INTRO
            </button>
          </div>
        </div>

        <div className="earthVisual">
          <div className="earthGlow" />

          <div className="earth">
            <div className="earthSurface" />
            <div className="earthGrid" />
            <div className="earthHighlight" />
          </div>

          <div className="orbit orbitOne" />
          <div className="orbit orbitTwo" />
          <div className="orbit orbitThree" />

          <div className="dataPoint pointOne" />
          <div className="dataPoint pointTwo" />
          <div className="dataPoint pointThree" />

          <div className="orbitLabel labelOne">
            EARTH DATA
          </div>

          <div className="orbitLabel labelTwo">
            OBSERVATION
          </div>

          <div className="orbitLabel labelThree">
            SONIFICATION
          </div>
        </div>

        <div className="scrollHint">
          <span>SCROLL TO EXPLORE</span>
          <div className="scrollLine" />
        </div>
      </section>

      <section className="introSection">
        <div className="sectionLabel">
          01 / WHY THIS MATTERS
        </div>

        <div className="introGrid">
          <h2>
            DATA IS MORE
            <br />
            THAN NUMBERS.
          </h2>

          <div className="introText">
            <p>
              Earth generates enormous amounts of scientific
              information every day.
            </p>

            <p>
              Temperature, atmosphere, oceans, vegetation,
              and other observations help us understand our
              changing planet.
            </p>

            <p>
              But scientific information is often experienced
              through numbers and graphs alone.
            </p>

            <p className="highlightText">
              Earth Information Jukebox explores another
              possibility: experiencing Earth data through
              sound.
            </p>
          </div>
        </div>
      </section>

      <section
        id="earth-data"
        className="dataSection"
      >
        <div className="sectionHeader">
          <div>
            <div className="sectionLabel">
              02 / EARTH OBSERVATION
            </div>

            <h2>EARTH TEMPERATURE FIELD</h2>
          </div>

          <div className="sourceBadge">
            <span />
            NASA POWER
          </div>
        </div>

        <div className="dataDashboard">
          <div className="temperatureVisual">
            <div className="visualHeader">
              <span>
                {currentReading
                  ? formatDate(currentReading.date)
                  : "LOADING"}
              </span>

              <span>
                {currentReading
                  ? getTemperatureLevel(
                      currentReading.temperature
                    )
                  : "—"}
              </span>
            </div>

            <div className="temperatureOrb">
              <div className="tempRing ringA" />
              <div className="tempRing ringB" />
              <div className="tempRing ringC" />

              <div className="tempCore">
                {currentReading ? (
                  <>
                    <strong>
                      {Number(
                        currentReading.temperature
                      ).toFixed(2)}
                      °
                    </strong>

                    <small>
                      TEMPERATURE
                    </small>
                  </>
                ) : (
                  <span>...</span>
                )}
              </div>
            </div>

            <div className="visualFooter">
              <span>
                LAT {INDONESIA.lat}
              </span>

              <span>
                LON {INDONESIA.lon}
              </span>
            </div>
          </div>

          <div className="observationPanel">
            <div className="panelTitle">
              CURRENT OBSERVATION
            </div>

            {loading ? (
              <div className="loadingBox">
                CONNECTING TO NASA DATA...
              </div>
            ) : error ? (
              <div className="errorBox">
                {error}
              </div>
            ) : currentReading ? (
              <>
                <div className="bigTemperature">
                  {Number(
                    currentReading.temperature
                  ).toFixed(2)}
                  <span>°C</span>
                </div>

                <div className="observationDescription">
                  {getTemperatureDescription(
                    currentReading.temperature
                  )}
                </div>

                <div className="observationMeta">
                  <div>
                    <span>DATE</span>
                    <strong>
                      {formatDate(
                        currentReading.date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>LOCATION</span>
                    <strong>INDONESIA</strong>
                  </div>

                  <div>
                    <span>PARAMETER</span>
                    <strong>T2M</strong>
                  </div>
                </div>

                <div className="dataNotice">
                  <span>●</span>

                  <p>
                    T2M represents air temperature
                    at approximately 2 meters above
                    the surface.
                  </p>
                </div>
              </>
            ) : (
              <div className="loadingBox">
                NO DATA
              </div>
            )}
          </div>
        </div>

        <div className="timelineCard">
          <div className="timelineHeader">
            <span>OBSERVATION TIMELINE</span>
            <span>
              {readings.length} AVAILABLE READINGS
            </span>
          </div>

          <div className="timeline">
            {readings.map((reading, index) => {
              const active = index === currentIndex;

              return (
                <button
                  key={reading.date}
                  className={`timelineItem ${
                    active ? "active" : ""
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                  }}
                >
                  <span className="timelineDate">
                    {formatDate(reading.date)}
                  </span>

                  <span className="timelineValue">
                    {Number(
                      reading.temperature
                    ).toFixed(2)}
                    °C
                  </span>

                  <span className="timelineBar">
                    <span
                      style={{
                        height: `${Math.max(
                          15,
                          Math.min(
                            100,
                            ((Number(
                              reading.temperature
                            ) -
                              20) /
                              15) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sonificationSection">
        <div className="sectionHeader">
          <div>
            <div className="sectionLabel">
              03 / SONIFICATION ENGINE
            </div>

            <h2>LISTEN TO THE EARTH</h2>
          </div>

          <div className="liveBadge">
            <span
              className={
                isPlaying ? "pulse" : ""
              }
            />
            {isPlaying ? "PLAYING" : "READY"}
          </div>
        </div>

        <div className="sonificationCard">
          <div className="sonificationTop">
            <div>
              <div className="miniLabel">
                CURRENT SONIC STATE
              </div>

              <div className="frequency">
                {currentFrequency.toFixed(0)}
                <span>Hz</span>
              </div>

              <div className="frequencyCaption">
                Mapped from current temperature
              </div>
            </div>

            <div className="sonificationInfo">
              <div>
                <span>TEMPERATURE</span>

                <strong>
                  {currentReading
                    ? `${Number(
                        currentReading.temperature
                      ).toFixed(2)}°C`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>CHANGE</span>

                <strong>
                  {currentDelta >= 0 ? "+" : ""}
                  {currentDelta.toFixed(2)}°C
                </strong>
              </div>
            </div>
          </div>

          <div className="waveformContainer">
            <canvas ref={canvasRef} />
          </div>

          <div className="sonificationControls">
            <button
              className="playButton"
              onClick={toggleSonification}
              disabled={!readings.length}
            >
              <span>
                {isPlaying ? "■" : "▶"}
              </span>

              {isPlaying
                ? "STOP EARTH DATA"
                : "PLAY EARTH DATA"}
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
            <span className="mappingNumber">
              01
            </span>

            <div>
              <h3>TEMPERATURE → PITCH</h3>

              <p>
                Higher temperature values create
                higher frequencies.
              </p>
            </div>
          </div>

          <div className="mappingCard">
            <span className="mappingNumber">
              02
            </span>

            <div>
              <h3>CHANGE → RHYTHM</h3>

              <p>
                Changes between observations
                influence the duration and rhythm.
              </p>
            </div>
          </div>

          <div className="mappingCard">
            <span className="mappingNumber">
              03
            </span>

            <div>
              <h3>VALUE → VOLUME</h3>

              <p>
                Observation values influence the
                intensity of the generated sound.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="processSection">
        <div className="sectionLabel">
          04 / HOW IT WORKS
        </div>

        <h2>
          FROM EARTH DATA
          <br />
          TO HUMAN EXPERIENCE.
        </h2>

        <div className="processFlow">
          <div className="processItem">
            <span>01</span>
            <strong>EARTH DATA</strong>
            <p>
              Scientific observations provide the
              raw information.
            </p>
          </div>

          <div className="processArrow">→</div>

          <div className="processItem">
            <span>02</span>
            <strong>DATA ANALYSIS</strong>
            <p>
              Values and changes are processed into
              meaningful parameters.
            </p>
          </div>

          <div className="processArrow">→</div>

          <div className="processItem">
            <span>03</span>
            <strong>SONIFICATION</strong>
            <p>
              Data parameters are mapped into
              sound characteristics.
            </p>
          </div>

          <div className="processArrow">→</div>

          <div className="processItem">
            <span>04</span>
            <strong>HUMAN EXPERIENCE</strong>
            <p>
              Scientific information becomes
              something you can hear and explore.
            </p>
          </div>
        </div>
      </section>

      <section className="voiceSection">
        <div className="sectionHeader">
          <div>
            <div className="sectionLabel">
              05 / EARTH INFORMATION GUIDE
            </div>

            <h2>LISTEN & EXPLORE</h2>
          </div>

          {voiceActive && (
            <button
              className="stopVoiceButton"
              onClick={stopVoice}
            >
              ■ STOP VOICE
            </button>
          )}
        </div>

        <div className="voiceLayout">
          <div className="voiceIntro">
            <div className="voiceIcon">
              ◉
            </div>

            <h3>
              EARTH INFORMATION
              <br />
              GUIDE
            </h3>

            <p>
              Listen to different parts of the
              project and learn how Earth Information
              Jukebox works.
            </p>

            <button
              className="voiceMainButton"
              onClick={() => {
                startVoice(
                  FULL_WELCOME,
                  "Welcome"
                );
              }}
            >
              {voiceActive
                ? "VOICE ACTIVE"
                : "▶ PLAY FULL GUIDE"}
            </button>
          </div>

          <div className="guideList">
            {GUIDE_SECTIONS.map((section, index) => {
              const active =
                currentGuide === section.label &&
                voiceActive;

              return (
                <button
                  key={section.id}
                  className={`guideItem ${
                    active ? "active" : ""
                  }`}
                  onClick={() =>
                    toggleVoiceGuide(section)
                  }
                >
                  <span className="guideNumber">
                    0{index + 1}
                  </span>

                  <span className="guideText">
                    <strong>
                      {section.label}
                    </strong>

                    <small>
                      {section.short}
                    </small>
                  </span>

                  <span className="guidePlay">
                    {active ? "■" : "▶"}
                  </span>
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
            <div className="sectionLabel">
              TECHNOLOGY SUPPORT
            </div>

            <div className="farrelLogo">
              FARREL
              <span>AI</span>
            </div>

            <h2>
              SUPPORTED BY
              <br />
              FARREL ARTIFICIAL INTELLIGENCE
            </h2>

            <p>
              Farrel AI is an independent AI and
              technology initiative focused on exploring
              artificial intelligence, programming,
              creative technology, and interactive
              digital experiences.
            </p>

            <p>
              This project combines web development,
              data visualization, AI-oriented thinking,
              and interactive technology to create a
              different way of experiencing Earth
              information.
            </p>

            <div className="farrelTags">
              <span>ARTIFICIAL INTELLIGENCE</span>
              <span>PROGRAMMING</span>
              <span>CREATIVE TECHNOLOGY</span>
              <span>INTERACTIVE WEB</span>
            </div>
          </div>

          <div className="farrelVisual">
            <div className="aiCore">
              <div className="aiCoreInner">
                FA
              </div>
            </div>

            <div className="aiOrbit aiOrbitOne" />
            <div className="aiOrbit aiOrbitTwo" />
            <div className="aiOrbit aiOrbitThree" />
          </div>
        </div>
      </section>

      <section className="creditsSection">
        <div className="creditsLine" />

        <div className="creditsContent">
          <div className="sectionLabel">
            PROJECT CREDITS
          </div>

          <h2>
            BUILT TO
            <br />
            <span>LISTEN TO EARTH.</span>
          </h2>

          <div className="team">
            <div className="teamMember">
              <span>01</span>

              <strong>
                Asyam Farrel Dzakwan
              </strong>

              <small>
                PROJECT DEVELOPER
              </small>
            </div>

            <div className="teamMember">
              <span>02</span>

              <strong>
                Arjuna Erlan Setiarianto
              </strong>

              <small>
                PROJECT DEVELOPER
              </small>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>
            EARTH INFORMATION JUKEBOX
          </strong>

          <span>
            NASA EARTH DATA × SONIFICATION
          </span>
        </div>

        <div className="footerCenter">
          SUPPORTED BY FARREL AI
        </div>

        <div className="footerRight">
          NASA POWER · WEB AUDIO API · NEXT.JS
        </div>
      </footer>

      {voiceGuideOpen && (
        <div className="voiceOverlay">
          <div className="voiceOverlayCard">
            <button
              className="overlayClose"
              onClick={() => {
                stopVoice();
                setVoiceGuideOpen(false);
              }}
            >
              ×
            </button>

            <div className="sectionLabel">
              EARTH INFORMATION GUIDE
            </div>

            <div className="overlayIcon">
              {voiceActive ? "◉" : "○"}
            </div>

            <h2>
              {currentGuide || "Ready"}
            </h2>

            <p>
              {voiceActive
                ? "The Earth Information Guide is currently speaking."
                : "Select a section from the guide below to hear more about the project."}
            </p>

            <div className="overlayActions">
              <button
                className="voiceMainButton"
                onClick={() =>
                  startVoice(
                    FULL_WELCOME,
                    "Welcome"
                  )
                }
              >
                ▶ PLAY FULL INTRO
              </button>

              {voiceActive && (
                <button
                  className="stopVoiceButton"
                  onClick={stopVoice}
                >
                  ■ STOP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(html) {
          scroll-behavior: smooth;
        }

        :global(body) {
          margin: 0;
          background: #ffffff;
          color: #0f172a;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button {
          font: inherit;
        }

        .site {
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(14, 165, 233, 0.06),
              transparent 35%
            ),
            #ffffff;
        }

        .ambient {
          position: fixed;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(110px);
          pointer-events: none;
          opacity: 0.15;
          z-index: 0;
        }

        .ambientOne {
          background: #7dd3fc;
          top: 15%;
          left: -180px;
        }

        .ambientTwo {
          background: #93c5fd;
          right: -180px;
          top: 55%;
        }

        .navbar {
          position: fixed;
          z-index: 50;
          top: 0;
          left: 0;
          right: 0;
          height: 76px;
          padding: 0 5vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(18px);
        }

        .brand {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .brandIcon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(2, 132, 199, 0.5);
          border-radius: 50%;
          color: #0284c7;
          box-shadow:
            0 0 22px rgba(2, 132, 199, 0.15);
        }

        .brandName {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #0f172a;
        }

        .brandSub {
          margin-top: 3px;
          font-size: 8px;
          color: rgba(15, 23, 42, 0.5);
          letter-spacing: 0.18em;
        }

        .navRight {
          display: flex;
          align-items: center;
          gap: 9px;
          color: rgba(15, 23, 42, 0.6);
          font-size: 9px;
          letter-spacing: 0.14em;
        }

        .statusDot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0ea5e9;
          box-shadow: 0 0 12px #0ea5e9;
        }

        .navVoice {
          margin-left: 12px;
          padding: 8px 11px;
          color: #0369a1;
          background: rgba(14, 165, 233, 0.08);
          border: 1px solid rgba(14, 165, 233, 0.3);
          border-radius: 6px;
          font-size: 8px;
          letter-spacing: 0.12em;
          cursor: pointer;
        }

        .hero {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          padding: 140px 8vw 80px;
          isolation: isolate;
        }

        .heroGrid {
          position: absolute;
          inset: 0;
          opacity: 0.5;
          background-image:
            linear-gradient(
              rgba(14, 165, 233, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(14, 165, 233, 0.08) 1px,
              transparent 1px
            );
          background-size: 70px 70px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 90%
          );
          z-index: -2;
        }

        .heroContent {
          position: relative;
          z-index: 5;
          width: 58%;
          max-width: 850px;
        }

        .heroEyebrow {
          color: #0284c7;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.25em;
          margin-bottom: 25px;
        }

        .heroTitle {
          margin: 0;
          display: flex;
          flex-direction: column;
          font-size: clamp(48px, 7vw, 100px);
          line-height: 0.9;
          letter-spacing: -0.055em;
          font-weight: 900;
          color: #0f172a;
        }

        .heroTitleLeft {
          animation: heroFromLeft 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)
            both;
        }

        .heroTitleRight {
          margin-left: 9vw;
          color: rgba(15, 23, 42, 0.3);
          animation: heroFromRight 0.9s 0.12s
            cubic-bezier(0.2, 0.8, 0.2, 1)
            both;
        }

        .heroSubtitle {
          margin-top: 32px;
          font-size: clamp(22px, 3vw, 38px);
          font-weight: 500;
          letter-spacing: -0.025em;
          color: #0284c7;
        }

        .heroDescription {
          max-width: 620px;
          margin-top: 20px;
          color: rgba(15, 23, 42, 0.65);
          line-height: 1.8;
          font-size: 14px;
        }

        .heroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .primaryButton,
        .secondaryButton,
        .voiceMainButton {
          border-radius: 7px;
          padding: 14px 18px;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .primaryButton:hover,
        .secondaryButton:hover,
        .voiceMainButton:hover {
          transform: translateY(-2px);
        }

        .primaryButton {
          display: flex;
          align-items: center;
          gap: 22px;
          border: 1px solid #0284c7;
          background: #0284c7;
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .primaryButton span {
          font-size: 18px;
        }

        .secondaryButton {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #ffffff;
          color: #0f172a;
          border: 1px solid rgba(15, 23, 42, 0.15);
          font-size: 10px;
          letter-spacing: 0.13em;
        }

        .secondaryButton span {
          color: #0284c7;
        }

        .earthVisual {
          position: absolute;
          right: 5vw;
          top: 50%;
          transform: translateY(-50%);
          width: min(42vw, 570px);
          height: min(42vw, 570px);
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .earthGlow {
          position: absolute;
          width: 70%;
          height: 70%;
          border-radius: 50%;
          background: rgba(14, 165, 233, 0.15);
          filter: blur(45px);
        }

        .earth {
          width: 48%;
          aspect-ratio: 1;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 35% 30%,
              rgba(186, 230, 253, 0.9),
              transparent 8%
            ),
            radial-gradient(
              circle at 45% 45%,
              #38bdf8,
              #0ea5e9 52%,
              #0284c7 100%
            );
          box-shadow:
            inset -25px -15px 55px rgba(2, 132, 199, 0.4),
            0 0 70px rgba(14, 165, 233, 0.3);
        }

        .earthSurface {
          position: absolute;
          inset: 0;
          opacity: 0.7;
          background:
            radial-gradient(
              ellipse at 28% 40%,
              rgba(255, 255, 255, 0.7) 0 8%,
              transparent 9%
            ),
            radial-gradient(
              ellipse at 65% 32%,
              rgba(255, 255, 255, 0.55) 0 11%,
              transparent 12%
            ),
            radial-gradient(
              ellipse at 70% 70%,
              rgba(255, 255, 255, 0.6) 0 10%,
              transparent 11%
            ),
            radial-gradient(
              ellipse at 38% 70%,
              rgba(255, 255, 255, 0.55) 0 7%,
              transparent 8%
            );
          filter: blur(2px);
        }

        .earthGrid {
          position: absolute;
          inset: -30%;
          background:
            repeating-linear-gradient(
              0deg,
              transparent 0 17px,
              rgba(255, 255, 255, 0.4) 18px 19px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0 17px,
              rgba(255, 255, 255, 0.4) 18px 19px
            );
          transform: rotate(-20deg);
        }

        .earthHighlight {
          position: absolute;
          width: 45%;
          height: 45%;
          left: 12%;
          top: 8%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          filter: blur(10px);
        }

        .orbit {
          position: absolute;
          border: 1px solid rgba(14, 165, 233, 0.3);
          border-radius: 50%;
        }

        .orbitOne {
          width: 76%;
          height: 30%;
          transform: rotate(-25deg);
        }

        .orbitTwo {
          width: 88%;
          height: 48%;
          transform: rotate(48deg);
        }

        .orbitThree {
          width: 105%;
          height: 75%;
          transform: rotate(-62deg);
          opacity: 0.55;
        }

        .dataPoint {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #0284c7;
          box-shadow: 0 0 14px #0284c7;
        }

        .pointOne {
          top: 27%;
          right: 14%;
        }

        .pointTwo {
          bottom: 17%;
          left: 20%;
        }

        .pointThree {
          top: 12%;
          left: 34%;
        }

        .orbitLabel {
          position: absolute;
          color: rgba(2, 132, 199, 0.6);
          font-size: 7px;
          letter-spacing: 0.17em;
        }

        .labelOne {
          top: 18%;
          right: 2%;
        }

        .labelTwo {
          bottom: 22%;
          left: 0;
        }

        .labelThree {
          top: 3%;
          left: 40%;
        }

        .scrollHint {
          position: absolute;
          bottom: 28px;
          left: 8vw;
          display: flex;
          align-items: center;
          gap: 13px;
          color: rgba(15, 23, 42, 0.4);
          font-size: 8px;
          letter-spacing: 0.2em;
        }

        .scrollLine {
          width: 60px;
          height: 1px;
          background: rgba(2, 132, 199, 0.4);
        }

        .introSection,
        .dataSection,
        .sonificationSection,
        .processSection,
        .voiceSection,
        .farrelSection,
        .creditsSection {
          position: relative;
          z-index: 2;
          padding: 130px 8vw;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
        }

        .sectionLabel {
          color: #0284c7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.22em;
        }

        .introGrid {
          margin-top: 45px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8vw;
        }

        .introGrid h2,
        .processSection h2,
        .creditsContent h2 {
          margin: 0;
          font-size: clamp(40px, 5vw, 72px);
          line-height: 0.96;
          letter-spacing: -0.045em;
          color: #0f172a;
        }

        .introText {
          max-width: 590px;
          color: rgba(15, 23, 42, 0.65);
          font-size: 15px;
          line-height: 1.85;
        }

        .highlightText {
          color: #0284c7;
        }

        .sectionHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 45px;
        }

        .sectionHeader h2 {
          margin: 10px 0 0;
          font-size: clamp(30px, 4vw, 54px);
          letter-spacing: -0.04em;
          color: #0f172a;
        }

        .sourceBadge,
        .liveBadge {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(15, 23, 42, 0.6);
          font-size: 9px;
          letter-spacing: 0.15em;
        }

        .sourceBadge span,
        .liveBadge span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0ea5e9;
          box-shadow: 0 0 12px #0ea5e9;
        }

        .liveBadge .pulse {
          animation: pulse 1.2s infinite;
        }

        .dataDashboard {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          min-height: 520px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
        }

        .temperatureVisual {
          position: relative;
          min-height: 520px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background:
            radial-gradient(
              circle at center,
              rgba(14, 165, 233, 0.08),
              transparent 55%
            );
        }

        .temperatureVisual::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.5;
          background-image:
            linear-gradient(
              rgba(14, 165, 233, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(14, 165, 233, 0.1) 1px,
              transparent 1px
            );
          background-size: 50px 50px;
        }

        .visualHeader,
        .visualFooter {
          position: absolute;
          left: 25px;
          right: 25px;
          display: flex;
          justify-content: space-between;
          color: rgba(15, 23, 42, 0.5);
          font-size: 8px;
          letter-spacing: 0.16em;
        }

        .visualHeader {
          top: 25px;
        }

        .visualFooter {
          bottom: 25px;
        }

        .temperatureOrb {
          width: 300px;
          height: 300px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .tempRing {
          position: absolute;
          border: 1px solid rgba(14, 165, 233, 0.25);
          border-radius: 50%;
        }

        .ringA {
          inset: 0;
        }

        .ringB {
          inset: 23px;
        }

        .ringC {
          inset: 52px;
        }

        .tempCore {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          align-content: center;
          background:
            radial-gradient(
              circle at 35% 30%,
              rgba(255, 255, 255, 0.95),
              transparent 25%
            ),
            radial-gradient(
              circle,
              #e0f2fe,
              #f0f9ff
            );
          border: 1px solid rgba(14, 165, 233, 0.4);
          box-shadow:
            0 0 60px rgba(14, 165, 233, 0.15),
            inset 0 0 40px rgba(14, 165, 233, 0.08);
        }

        .tempCore strong {
          font-size: 42px;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .tempCore small {
          margin-top: 4px;
          color: rgba(15, 23, 42, 0.5);
          font-size: 7px;
          letter-spacing: 0.17em;
        }

        .observationPanel {
          padding: 40px;
          border-left: 1px solid rgba(15, 23, 42, 0.08);
        }

        .panelTitle,
        .miniLabel {
          color: rgba(15, 23, 42, 0.5);
          font-size: 8px;
          letter-spacing: 0.18em;
        }

        .bigTemperature {
          margin-top: 60px;
          font-size: clamp(54px, 6vw, 84px);
          font-weight: 800;
          letter-spacing: -0.06em;
          color: #0f172a;
        }

        .bigTemperature span {
          font-size: 20px;
          color: #0284c7;
          margin-left: 5px;
        }

        .observationDescription {
          margin-top: 7px;
          color: #0284c7;
          font-size: 10px;
          letter-spacing: 0.12em;
        }

        .observationMeta {
          display: grid;
          gap: 18px;
          margin-top: 55px;
        }

        .observationMeta div {
          display: flex;
          justify-content: space-between;
          padding-bottom: 13px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }

        .observationMeta span {
          color: rgba(15, 23, 42, 0.45);
          font-size: 8px;
          letter-spacing: 0.13em;
        }

        .observationMeta strong {
          font-size: 9px;
          letter-spacing: 0.12em;
          color: #0f172a;
        }

        .dataNotice {
          display: flex;
          gap: 10px;
          margin-top: 35px;
          padding: 12px;
          border: 1px solid rgba(14, 165, 233, 0.15);
          background: rgba(14, 165, 233, 0.05);
        }

        .dataNotice span {
          color: #0284c7;
        }

        .dataNotice p {
          margin: 0;
          color: rgba(15, 23, 42, 0.55);
          font-size: 9px;
          line-height: 1.6;
        }

        .loadingBox,
        .errorBox {
          margin-top: 60px;
          color: rgba(15, 23, 42, 0.5);
          font-size: 10px;
          letter-spacing: 0.13em;
        }

        .errorBox {
          color: #dc2626;
        }

        .timelineCard {
          margin-top: 18px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          padding: 25px;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
        }

        .timelineHeader {
          display: flex;
          justify-content: space-between;
          color: rgba(15, 23, 42, 0.5);
          font-size: 8px;
          letter-spacing: 0.15em;
        }

        .timeline {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(130px, 1fr)
          );
          gap: 10px;
          margin-top: 25px;
        }

        .timelineItem {
          min-height: 125px;
          padding: 15px;
          text-align: left;
          cursor: pointer;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          color: #0f172a;
        }

        .timelineItem.active {
          border-color: rgba(14, 165, 233, 0.55);
          background: rgba(14, 165, 233, 0.06);
        }

        .timelineDate {
          display: block;
          color: rgba(15, 23, 42, 0.5);
          font-size: 8px;
        }

        .timelineValue {
          display: block;
          margin-top: 12px;
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
        }

        .timelineBar {
          height: 38px;
          display: flex;
          align-items: flex-end;
          margin-top: 12px;
          background: rgba(15, 23, 42, 0.04);
        }

        .timelineBar span {
          width: 100%;
          background: rgba(14, 165, 233, 0.55);
        }

        .sonificationCard {
          padding: 35px;
          border: 1px solid rgba(14, 165, 233, 0.2);
          background:
            radial-gradient(
              circle at 70% 20%,
              rgba(14, 165, 233, 0.06),
              transparent 40%
            ),
            #ffffff;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.05);
        }

        .sonificationTop {
          display: flex;
          justify-content: space-between;
          gap: 30px;
        }

        .frequency {
          margin-top: 8px;
          font-size: clamp(55px, 7vw, 95px);
          font-weight: 800;
          letter-spacing: -0.07em;
          color: #0f172a;
        }

        .frequency span {
          color: #0284c7;
          font-size: 18px;
          margin-left: 7px;
          letter-spacing: 0;
        }

        .frequencyCaption {
          color: rgba(15, 23, 42, 0.5);
          font-size: 9px;
        }

        .sonificationInfo {
          display: flex;
          gap: 50px;
          align-items: center;
        }

        .sonificationInfo div {
          display: grid;
          gap: 8px;
        }

        .sonificationInfo span {
          color: rgba(15, 23, 42, 0.45);
          font-size: 8px;
          letter-spacing: 0.15em;
        }

        .sonificationInfo strong {
          font-size: 20px;
          color: #0f172a;
        }

        .waveformContainer {
          height: 190px;
          margin-top: 35px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(14, 165, 233, 0.04);
        }

        .waveformContainer canvas {
          width: 100%;
          height: 100%;
        }

        .sonificationControls {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 25px;
        }

        .playButton {
          padding: 14px 20px;
          border: 1px solid #0284c7;
          background: rgba(14, 165, 233, 0.08);
          color: #0284c7;
          border-radius: 6px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .playButton:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .controlHint {
          color: rgba(15, 23, 42, 0.55);
          font-size: 10px;
        }

        .mappingGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 14px;
        }

        .mappingCard {
          display: flex;
          gap: 18px;
          padding: 25px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.03);
        }

        .mappingNumber {
          color: #0284c7;
          font-size: 9px;
          font-weight: 800;
        }

        .mappingCard h3 {
          margin: 0;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #0f172a;
        }

        .mappingCard p {
          margin: 10px 0 0;
          color: rgba(15, 23, 42, 0.6);
          font-size: 10px;
          line-height: 1.7;
        }

        .processSection h2 {
          margin-top: 20px;
        }

        .processFlow {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          align-items: center;
          gap: 20px;
          margin-top: 65px;
        }

        .processItem {
          min-height: 190px;
          padding: 25px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.03);
        }

        .processItem span {
          color: #0284c7;
          font-size: 9px;
        }

        .processItem strong {
          display: block;
          margin-top: 45px;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #0f172a;
        }

        .processItem p {
          color: rgba(15, 23, 42, 0.55);
          font-size: 9px;
          line-height: 1.7;
        }

        .processArrow {
          color: rgba(2, 132, 199, 0.6);
          font-size: 22px;
        }

        .voiceLayout {
          display: grid;
          grid-template-columns: 0.7fr 1.3fr;
          gap: 30px;
        }

        .voiceIntro,
        .guideList {
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.03);
        }

        .voiceIntro {
          padding: 40px;
        }

        .voiceIcon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(14, 165, 233, 0.45);
          color: #0284c7;
          box-shadow: 0 0 35px rgba(14, 165, 233, 0.12);
        }

        .voiceIntro h3 {
          margin: 28px 0 0;
          font-size: 27px;
          line-height: 1;
          letter-spacing: -0.04em;
          color: #0f172a;
        }

        .voiceIntro p {
          color: rgba(15, 23, 42, 0.6);
          font-size: 11px;
          line-height: 1.8;
          margin: 20px 0 25px;
        }

        .voiceMainButton {
          border: 1px solid rgba(14, 165, 233, 0.55);
          background: rgba(14, 165, 233, 0.08);
          color: #0284c7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .guideList {
          overflow: hidden;
        }

        .guideItem {
          width: 100%;
          display: grid;
          grid-template-columns: 45px 1fr 30px;
          align-items: center;
          gap: 15px;
          padding: 20px 25px;
          text-align: left;
          border: 0;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          background: transparent;
          color: #0f172a;
          cursor: pointer;
        }

        .guideItem:last-child {
          border-bottom: 0;
        }

        .guideItem:hover,
        .guideItem.active {
          background: rgba(14, 165, 233, 0.06);
        }

        .guideNumber {
          color: rgba(15, 23, 42, 0.35);
          font-size: 9px;
        }

        .guideText {
          display: grid;
          gap: 5px;
        }

        .guideText strong {
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #0f172a;
        }

        .guideText small {
          color: rgba(15, 23, 42, 0.5);
          font-size: 9px;
        }

        .guidePlay {
          color: #0284c7;
          font-size: 11px;
        }

        .stopVoiceButton {
          padding: 10px 14px;
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.3);
          background: rgba(220, 38, 38, 0.05);
          border-radius: 5px;
          cursor: pointer;
          font-size: 8px;
          letter-spacing: 0.12em;
        }

        .farrelCard {
          min-height: 450px;
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          border: 1px solid rgba(14, 165, 233, 0.2);
          background:
            linear-gradient(
              120deg,
              rgba(14, 165, 233, 0.06),
              rgba(255, 255, 255, 0.9)
            );
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.05);
        }

        .farrelContent {
          position: relative;
          z-index: 2;
          padding: 55px;
        }

        .farrelLogo {
          margin-top: 25px;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.18em;
          color: #0f172a;
        }

        .farrelLogo span {
          color: #0284c7;
        }

        .farrelContent h2 {
          max-width: 700px;
          margin: 15px 0 20px;
          font-size: clamp(28px, 4vw, 52px);
          line-height: 0.98;
          letter-spacing: -0.04em;
          color: #0f172a;
        }

        .farrelContent p {
          max-width: 680px;
          color: rgba(15, 23, 42, 0.6);
          font-size: 11px;
          line-height: 1.8;
        }

        .farrelTags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 25px;
        }

        .farrelTags span {
          padding: 7px 9px;
          border: 1px solid rgba(14, 165, 233, 0.2);
          color: rgba(2, 132, 199, 0.75);
          font-size: 7px;
          letter-spacing: 0.1em;
        }

        .farrelVisual {
          position: relative;
          display: grid;
          place-items: center;
        }

        .farrelGlow {
          position: absolute;
          width: 400px;
          height: 400px;
          right: -100px;
          top: -50px;
          border-radius: 50%;
          background: rgba(14, 165, 233, 0.12);
          filter: blur(80px);
        }

        .aiCore {
          width: 180px;
          height: 180px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(14, 165, 233, 0.5);
          box-shadow:
            0 0 80px rgba(14, 165, 233, 0.12),
            inset 0 0 50px rgba(14, 165, 233, 0.08);
        }

        .aiCoreInner {
          width: 115px;
          height: 115px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #e0f2fe;
          border: 1px solid rgba(14, 165, 233, 0.4);
          color: #0284c7;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.08em;
        }

        .aiOrbit {
          position: absolute;
          border: 1px solid rgba(14, 165, 233, 0.2);
          border-radius: 50%;
        }

        .aiOrbitOne {
          width: 310px;
          height: 120px;
          transform: rotate(30deg);
        }

        .aiOrbitTwo {
          width: 270px;
          height: 190px;
          transform: rotate(-35deg);
        }

        .aiOrbitThree {
          width: 340px;
          height: 270px;
          transform: rotate(72deg);
        }

        .creditsContent {
          max-width: 1050px;
        }

        .creditsContent h2 {
          margin-top: 25px;
        }

        .creditsContent h2 span {
          color: rgba(15, 23, 42, 0.3);
        }

        .team {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 60px;
        }

        .teamMember {
          padding: 25px;
          display: grid;
          grid-template-columns: 35px 1fr;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.03);
        }

        .teamMember span {
          color: #0284c7;
          font-size: 8px;
        }

        .teamMember strong {
          font-size: 13px;
          letter-spacing: 0.02em;
          color: #0f172a;
        }

        .teamMember small {
          grid-column: 2;
          margin-top: 7px;
          color: rgba(15, 23, 42, 0.4);
          font-size: 7px;
          letter-spacing: 0.14em;
        }

        .footer {
          position: relative;
          z-index: 3;
          padding: 30px 8vw;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px;
          align-items: center;
          color: rgba(15, 23, 42, 0.4);
          font-size: 7px;
          letter-spacing: 0.13em;
        }

        .footer div {
          display: grid;
          gap: 5px;
        }

        .footer strong {
          color: rgba(15, 23, 42, 0.7);
        }

        .footerCenter {
          color: #0284c7;
          text-align: center;
        }

        .footerRight {
          text-align: right;
        }

        .voiceOverlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(15px);
        }

        .voiceOverlayCard {
          position: relative;
          width: min(600px, 100%);
          padding: 50px;
          border: 1px solid rgba(14, 165, 233, 0.25);
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(14, 165, 233, 0.08),
              transparent 55%
            ),
            #ffffff;
          box-shadow: 0 30px 100px rgba(15, 23, 42, 0.15);
          text-align: center;
        }

        .overlayClose {
          position: absolute;
          top: 16px;
          right: 18px;
          border: 0;
          background: transparent;
          color: rgba(15, 23, 42, 0.5);
          font-size: 27px;
          cursor: pointer;
        }

        .overlayIcon {
          width: 90px;
          height: 90px;
          margin: 30px auto 25px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(14, 165, 233, 0.4);
          color: #0284c7;
          font-size: 30px;
          box-shadow: 0 0 60px rgba(14, 165, 233, 0.15);
        }

        .voiceOverlayCard h2 {
          margin: 0;
          font-size: 29px;
          letter-spacing: -0.03em;
          color: #0f172a;
        }

        .voiceOverlayCard p {
          max-width: 430px;
          margin: 15px auto 25px;
          color: rgba(15, 23, 42, 0.6);
          font-size: 11px;
          line-height: 1.7;
        }

        .overlayActions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        @keyframes heroFromLeft {
          from {
            opacity: 0;
            transform: translateX(-70px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes heroFromRight {
          from {
            opacity: 0;
            transform: translateX(70px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.35;
            transform: scale(0.7);
          }
        }

        @media (max-width: 1050px) {
          .earthVisual {
            opacity: 0.4;
            right: -80px;
          }

          .heroContent {
            width: 75%;
          }

          .processFlow {
            grid-template-columns: 1fr 1fr;
          }

          .processArrow {
            display: none;
          }
        }

        @media (max-width: 800px) {
          .navbar {
            height: 65px;
          }

          .navRight > span:not(.statusDot) {
            display: none;
          }

          .brandSub {
            display: none;
          }

          .hero {
            padding: 125px 7vw 90px;
          }

          .heroContent {
            width: 100%;
          }

          .heroTitle {
            font-size: clamp(43px, 13vw, 75px);
          }

          .heroTitleRight {
            margin-left: 7vw;
          }

          .heroDescription {
            font-size: 13px;
          }

          .earthVisual {
            width: 80vw;
            height: 80vw;
            right: -28vw;
            opacity: 0.25;
          }

          .introGrid,
          .dataDashboard,
          .voiceLayout,
          .farrelCard {
            grid-template-columns: 1fr;
          }

          .observationPanel {
            border-left: 0;
            border-top: 1px solid rgba(15, 23, 42, 0.08);
          }

          .mappingGrid {
            grid-template-columns: 1fr;
          }

          .processFlow {
            grid-template-columns: 1fr;
          }

          .sonificationTop {
            flex-direction: column;
          }

          .sonificationInfo {
            justify-content: space-between;
          }

          .team {
            grid-template-columns: 1fr;
          }

          .farrelVisual {
            min-height: 350px;
          }

          .footer {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .footerRight,
          .footerCenter {
            text-align: center;
          }
        }

        @media (max-width: 520px) {
          .navbar {
            padding: 0 5vw;
          }

          .brandName {
            font-size: 8px;
          }

          .navVoice {
            margin-left: 4px;
            padding: 7px;
          }

          .heroTitle {
            font-size: 41px;
          }

          .heroSubtitle {
            font-size: 23px;
          }

          .heroActions {
            flex-direction: column;
            align-items: stretch;
          }

          .primaryButton,
          .secondaryButton {
            justify-content: center;
          }

          .introSection,
          .dataSection,
          .sonificationSection,
          .processSection,
          .voiceSection,
          .farrelSection,
          .creditsSection {
            padding: 90px 6vw;
          }

          .temperatureOrb {
            width: 240px;
            height: 240px;
          }

          .tempCore {
            width: 125px;
            height: 125px;
          }

          .tempCore strong {
            font-size: 32px;
          }

          .observationPanel {
            padding: 28px;
          }

          .sonificationCard {
            padding: 22px;
          }

          .sonificationInfo {
            gap: 20px;
          }

          .sonificationInfo strong {
            font-size: 16px;
          }

          .sonificationControls {
            flex-direction: column;
            align-items: flex-start;
          }

          .voiceIntro {
            padding: 30px;
          }

          .farrelContent {
            padding: 30px;
          }

          .voiceOverlayCard {
            padding: 35px 24px;
          }
        }
      `}</style>
    </main>
  );
}
