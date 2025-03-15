// script.js - Full Working Version
const OPENAI_API_KEY = 'your-api-key-here'; // Replace with actual key
let isListening = false;
let recognition;
let synthesis;

// Medical system prompt with enhanced instructions
const systemPrompt = `You are Nurse Bessie Mae, a Southern emergency physician with:
- Medical expertise (ACEP guidelines)
- Warm country dialect ("Bless your heart", "Sugar, let me tell ya")
- Cultural awareness of rural healthcare needs
- Triage protocol:
  1. ER: Chest pain, stroke signs, major trauma
  2. Urgent Care: Sprains, minor burns
  3. Home Care: Colds, minor rashes
- Always explain medical terms using folksy analogies`;

// 1. Initialize voice recognition with error handling
function initializeVoice() {
    try {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = async (event) => {
            const transcript = event.results[event.results.length-1][0].transcript;
            addMessage(transcript, 'user');
            console.log('User said:', transcript);
            await processQuery(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            addMessage("Dagnabbit! My ears aren't workin' right", 'bot');
            recognition.stop();
            toggleVoiceUI(false);
        };

        // Initialize speech synthesis
        synthesis = window.speechSynthesis;
        console.log('Speech synthesis supported:', synthesis !== undefined);

    } catch (error) {
        console.error('Voice initialization failed:', error);
        addMessage("Well butter my biscuit! Voice features aren't available", 'bot');
    }
}

// 2. Enhanced API communication with debugging
async function processQuery(query) {
    try {
        console.log('Starting API request...');
        const startTime = Date.now();
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        console.log(`API response time: ${Date.now() - startTime}ms`);
        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Details:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        const reply = data.choices[0].message.content;
        addMessage(reply, 'bot');
        speakResponse(reply);

    } catch (error) {
        console.error('Full Error Chain:', error);
        addMessage("Well butter my biscuit! Let's try that again", 'bot');
    }
}

// 3. Robust speech synthesis with fallback
function speakResponse(text) {
    try {
        if (!synthesis) {
            throw new Error('Speech synthesis not supported');
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 0.8;

        // Voice selection logic
        const voices = synthesis.getVoices();
        const preferredVoices = [
            'Microsoft Zira Desktop', 
            'Google US English',
            'Alex'
        ];
        
        const voice = voices.find(v => preferredVoices.includes(v.name)) || voices[0];
        if (voice) {
            utterance.voice = voice;
            utterance.lang = 'en-US';
        }

        synthesis.speak(utterance);

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            addMessage("Can't speak right now, sugar", 'bot');
        };

    } catch (error) {
        console.error('Speech failed:', error);
        addMessage(text, 'bot'); // Fallback to text display
    }
}

// 4. UI control with state management
function toggleVoiceUI(active) {
    isListening = active;
    const button = document.getElementById('voiceControl');
    button.classList.toggle('active', active);
    button.innerHTML = active ? 
        '<i class="fas fa-microphone-slash"></i> Stop Listening' : 
        '<i class="fas fa-microphone"></i> Start Listening';
}

// 5. Message handling with sanitization
function addMessage(text, sender) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Basic sanitization
    const cleanText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    messageDiv.innerHTML = `
        <div class="message-bubble">
            ${sender === 'bot' ? '🤠 ' : ''}${cleanText}
        </div>
    `;
    
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 6. Voice control with safety checks
document.getElementById('voiceControl').addEventListener('click', async () => {
    if (!isListening) {
        try {
            // Request microphone permission first
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            initializeVoice();
            recognition.start();
            toggleVoiceUI(true);
            
        } catch (error) {
            console.error('Microphone access denied:', error);
            addMessage("Need microphone access to hear ya, sugar", 'bot');
            toggleVoiceUI(false);
        }
    } else {
        recognition.stop();
        toggleVoiceUI(false);
    }
});

// 7. Connection test function
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });
        
        if (response.ok) {
            console.log('API Connection Successful');
            return true;
        }
        console.log('API Connection Failed:', response.status);
        return false;
        
    } catch (error) {
        console.error('Connection Test Error:', error);
        return false;
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('Initializing application...');
    testAPIConnection().then(success => {
        if (!success) {
            addMessage("Technical difficulties, sugar. Try refreshin' the page", 'bot');
        }
    });
});
