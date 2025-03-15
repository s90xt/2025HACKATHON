// script.js - Enhanced Version
const OPENAI_API_KEY = 'your-api-key-here';
let isListening = false;
let recognition;
let synthesis;
let audioContext;

// Enhanced system prompt with safety protocols
const systemPrompt = `You are Nurse Bessie Mae, MD - Emergency Medicine Specialist with:
- Southern US dialect ("Bless your heart", "Let me think on that")
- ACEP 2024 triage guidelines
- Cultural competence for rural populations
- Strict safety protocols:
  1. ER: Chest pain, stroke symptoms, trauma
  2. Urgent Care: Sprains, minor injuries
  3. Home Care: Colds, rashes
- Medical analogies using farming references`;

// 1. Audio visualization initialization
function initAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            visualizeAudio(analyser);
        })
        .catch(err => {
            console.error('Audio setup failed:', err);
            addSystemMessage("Microphone access required for voice features");
        });
}

// 2. Modern audio visualization
function visualizeAudio(analyser) {
    const canvas = document.getElementById('voiceVisualizer');
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!isListening) return;

        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'rgba(18, 18, 29, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height/2;

            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            x += sliceWidth;
        }

        ctx.stroke();
        requestAnimationFrame(draw);
    }

    draw();
}

// 3. Enhanced voice recognition
function initVoiceRecognition() {
    try {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = async (event) => {
            const transcript = event.results[event.results.length-1][0].transcript;
            addMessage(transcript, 'user', true);
            await processMedicalQuery(transcript);
        };

        recognition.onerror = handleRecognitionError;

    } catch (error) {
        console.error('Recognition init failed:', error);
        addSystemMessage("Voice features unavailable in this browser");
    }
}

// 4. Robust API communication
async function processMedicalQuery(query) {
    try {
        showLoadingState(true);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'X-Request-ID': crypto.randomUUID()
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { 
                        role: "system", 
                        content: systemPrompt,
                        temperature: 0.7,
                        max_tokens: 150
                    },
                    { role: "user", content: query }
                ]
            })
        });

        const data = await parseResponse(response);
        handleAPIResponse(data);

    } catch (error) {
        handleAPIError(error);
    } finally {
        showLoadingState(false);
    }
}

// 5. Response handling utilities
async function parseResponse(response) {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API ${response.status}: ${errorData.error?.message}`);
    }
    return response.json();
}

function handleAPIResponse(data) {
    const reply = data.choices[0].message.content;
    addMessage(reply, 'bot', true);
    speakResponse(reply);
    logInteraction('success');
}

function handleAPIError(error) {
    console.error('API Error:', error);
    addSystemMessage("Connection issues - trying backup protocol...");
    logInteraction('failure');
    attemptFallback();
}

// 6. Enhanced speech synthesis
function speakResponse(text) {
    return new Promise((resolve) => {
        if (!synthesis) {
            addMessage(text, 'bot');
            return resolve();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        configureVoice(utterance);
        
        utterance.onend = resolve;
        utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
            resolve();
        };

        synthesis.speak(utterance);
    });
}

function configureVoice(utterance) {
    const voices = synthesis.getVoices();
    const voicePriorities = [
        'Microsoft Zira', 
        'Google US English',
        'English (America)'
    ];

    utterance.rate = 0.92;
    utterance.pitch = 0.85;
    utterance.volume = 1.2;

    const selectedVoice = voices.find(v => voicePriorities.includes(v.name)) || voices[0];
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = 'en-US';
    }
}

// 7. UI state management
function showLoadingState(loading) {
    document.querySelectorAll('.message-bot').lastElementChild?.classList.toggle('thinking', loading);
    document.getElementById('voiceControl').classList.toggle('processing', loading);
}

function addMessage(text, sender, isVoice = false) {
    const chat = document.getElementById('chatHistory');
    const message = document.createElement('div');
    
    message.className = `message message-${sender} ${isVoice ? 'voice' : 'text'}`;
    message.innerHTML = `
        <div class="message-bubble">
            ${sender === 'bot' ? '<div class="bot-indicator"></div>' : ''}
            ${escapeHTML(text)}
            ${sender === 'bot' ? '<div class="response-loader"></div>' : ''}
        </div>
    `;

    chat.appendChild(message);
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 8. Voice control core
document.getElementById('voiceControl').addEventListener('click', async () => {
    if (!isListening) {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            initVoiceRecognition();
            recognition.start();
            isListening = true;
            updateUIVisuals(true);
        } catch (error) {
            handleRecognitionError(error);
        }
    } else {
        recognition.stop();
        isListening = false;
        updateUIVisuals(false);
    }
});

function updateUIVisuals(listening) {
    const button = document.getElementById('voiceControl');
    button.classList.toggle('active', listening);
    button.innerHTML = listening ? 
        '<i class="fas fa-microphone-slash"></i> Stop Listening' : 
        '<i class="fas fa-microphone"></i> Start Consultation';
}

// 9. System initialization
function initApplication() {
    synthesis = window.speechSynthesis;
    initAudioContext();
    
    if (!synthesis) {
        addSystemMessage("Voice responses unavailable - text only mode");
    }

    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices updated:', synthesis.getVoices());
    };
}

// 10. Start application
window.addEventListener('load', () => {
    initApplication();
    addMessage("Howdy friend! What brings you in today?", 'bot');
});
