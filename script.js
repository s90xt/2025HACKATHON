// script.js
const OPENAI_API_KEY = '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';
let recognition;
let isListening = false;
let audioContext;
let analyser;

// Medical system prompt
const systemPrompt = `You are Nurse Jed, a Southern emergency physician with:
- Medical expertise (ACEP guidelines)
- Warm country dialect ("Bless your heart", "Ain't that somethin'")
- Cultural sensitivity for medical distrust
- Triage protocol:
  1️⃣ ER: Chest pain, stroke signs, major trauma
  2️⃣ Urgent Care: Sprains, minor burns
  3️⃣ Home Care: Colds, rashes
- Always explain medical terms in plain language`;

// Initialize voice recognition
function initVoice() {
    recognition = new webkitSpeechRecognition() || new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        
        if (event.results[0].isFinal) {
            await processMedicalQuery(transcript);
        }
    };
}

// Initialize audio visualization
function initVisualizer() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            visualizeVoice();
        });
}

// Voice visualization
function visualizeVoice() {
    const canvas = document.getElementById('voiceVisualizer');
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!isListening) return;
        
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        dataArray.forEach((value, i) => {
            ctx.fillStyle = `hsl(${i * 2}, 100%, 50%)`;
            ctx.fillRect(i * 3, canvas.height - value, 2, value);
        });

        requestAnimationFrame(draw);
    }
    
    draw();
}

// Process medical queries
async function processMedicalQuery(query) {
    addMessage(query, 'user');
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;
        addMessage(reply, 'bot');
        speakResponse(reply);
    } catch (error) {
        addMessage("Well butter my biscuit - technical difficulties!", 'bot');
    }
}

// Text-to-speech with accent
function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    speechSynthesis.speak(utterance);
}

// UI functions
function addMessage(text, sender) {
    const chatWindow = document.getElementById('chatWindow');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Voice control
document.getElementById('voiceControl').addEventListener('click', () => {
    if (!isListening) {
        initVoice();
        initVisualizer();
        recognition.start();
        isListening = true;
        document.getElementById('voiceControl').classList.add('active');
    } else {
        recognition.stop();
        isListening = false;
        document.getElementById('voiceControl').classList.remove('active');
    }
});

// Initial setup
window.onload = () => {
    // Set canvas size
    const canvas = document.getElementById('voiceVisualizer');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
