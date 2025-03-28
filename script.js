let isListening = false;
let recognition;
const chatMessages = document.getElementById("chatMessages");
const voiceButton = document.getElementById("voiceButton");
const canvas = document.getElementById("waveVisualizer");
const ctx = canvas.getContext("2d");
let audioContext;
let analyser;
let microphone;
let dataArray;

const OPENAI_API_URL = "http://127.0.0.1:5000/api/openai"; // Replace with your API endpoint

// Get dialect parameter from the URL (from landing page)
const urlParams = new URLSearchParams(window.location.search);
const dialect = urlParams.get("dialect") || "default";

// Initialize Audio Context for visualization
function initAudioVisualization() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

// Initialize Voice Recognition
function initVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addMessage("Speech recognition not supported in this browser.", "system");
    return;
  }
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  recognition.maxAlternatives = 1;

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    addMessage(transcript, "user");
    await processMedicalQuery(transcript);
  };

  recognition.onerror = (event) => {
    addMessage("Voice error: " + event.error, "system");
  };

  recognition.onend = () => {
    isListening = false;
    voiceButton.textContent = "🎙 Start Voice Chat";
  };
}

// Start or Stop Voice Chat
voiceButton.addEventListener("click", async () => {
  if (!isListening) {
    try {
      if (!audioContext) initAudioVisualization();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      recognition.start();
      isListening = true;
      voiceButton.textContent = "🛑 Stop Listening";
      animateWave();
    } catch (error) {
      addMessage("Microphone access denied.", "system");
    }
  } else {
    recognition.stop();
    isListening = false;
    voiceButton.textContent = "🎙 Start Voice Chat";
  }
});

// Process query through backend API
async function processMedicalQuery(query) {
  addMessage("Thinking...", "bot");
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: query })
    });
    const data = await response.json();
    const reply = data.reply;
    addMessage(reply, "bot");
    speakResponse(reply);
  } catch (error) {
    addMessage("Error contacting AI: " + error.message, "system");
  }
}

// Add message to chat box
function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Choose a voice based on dialect (if available)
function getDialectVoice() {
  const voices = speechSynthesis.getVoices();
  // For demonstration, filter for US English voices
  const filteredVoices = voices.filter(voice => voice.lang.toLowerCase().includes("en-us"));
  return filteredVoices[0] || voices[0];
}

// Speak response with a southern country accent simulation
function speakResponse(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  // Adjust rate and pitch to simulate a southern country accent
  utterance.rate = 0.9;
  utterance.pitch = 0.8;
  const voice = getDialectVoice();
  if (voice) {
    utterance.voice = voice;
  }
  speechSynthesis.speak(utterance);
}

// Visualize audio input
function animateWave() {
  function draw() {
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00f3ff";
    let bars = 50;
    let width = canvas.width / bars;
    for (let i = 0; i < bars; i++) {
      let barHeight = (dataArray[i] / 255) * canvas.height;
      ctx.fillRect(i * width, canvas.height - barHeight, width - 2, barHeight);
    }
    if (isListening) {
      requestAnimationFrame(draw);
    }
  }
  draw();
}

// Initialize the system on page load
window.addEventListener("load", () => {
  initAudioVisualization();
  initVoiceRecognition();
  speechSynthesis.onvoiceschanged = () => {
    getDialectVoice();
  };
});
