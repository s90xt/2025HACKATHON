import fs from "fs";
import path from "path";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "fallback-api-key-for-local-dev";
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

// Initialize OpenAI Client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Initialize Audio Context for Sound Waves
function initAudioVisualization() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

// Initialize Voice Recognition
function initVoiceRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
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
        stopListening();
    };
}

// Start or Stop Voice Chat
voiceButton.addEventListener("click", async () => {
    if (!isListening) {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
            });
            recognition.start();
            isListening = true;
            voiceButton.textContent = "🛑 Stop Listening";
            animateWave();
        } catch (error) {
            addMessage("Microphone access denied.", "system");
        }
    } else {
        stopListening();
    }
});

function stopListening() {
    recognition.stop();
    isListening = false;
    voiceButton.textContent = "🎙 Start Voice Chat";
}

// Send Query to OpenAI API
async function processMedicalQuery(query) {
    addMessage("Thinking...", "bot");
    try {
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a board-certified doctor with a Southern US accent. Give professional and empathetic medical advice." },
                { role: "user", content: query }
            ]
        });

        const reply = chatCompletion.choices[0].message.content;
        addMessage(reply, "bot");
        await speakResponse(reply);
    } catch (error) {
        addMessage("Error contacting AI: " + error.message, "system");
    }
}

// Add Message to Chat Box
function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Speak Response
async function speakResponse(text) {
    try {
        const speechFile = path.resolve("./speech.mp3");
        const mp3 = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "coral",
            input: text,
            instructions: "Speak in a professional and empathetic tone.",
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(speechFile, buffer);

        // Play the generated speech
        const audio = new Audio(speechFile);
        audio.play();
    } catch (error) {
        console.error("Text-to-speech error:", error);
        // Fallback to browser's speech synthesis if OpenAI TTS fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        speechSynthesis.speak(utterance);
    }
}

// Visualize Sound Waves
function animateWave() {
    function draw() {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00f3ff";
        let bars = 50;
        let width = canvas.width / bars;
        for (let i = 0; i < bars; i++) {
            let height = (dataArray[i] / 255) * canvas.height;
            ctx.fillRect(i * width, canvas.height - height, width - 2, height);
        }
        if (isListening) requestAnimationFrame(draw);
    }
    draw();
}

// Initialize System
window.addEventListener("load", () => {
    initAudioVisualization();
    initVoiceRecognition();
});
