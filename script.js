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

const OPENAI_API_URL = "/api/openai"; // Backend proxy endpoint to OpenAI

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

// Send Query to Backend API Proxy
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

// Add Message to Chat Box
function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Speak Response (browser TTS fallback)
function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    speechSynthesis.speak(utterance);
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
