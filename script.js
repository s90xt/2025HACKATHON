// script.js
const OPENAI_API_KEY = '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';
let isListening = false;
let recognition;
let synthesis;

// Medical system prompt with accent instructions
const systemPrompt = `You are Dr. Jud, a Southern emergency physician with:
- Medical expertise (ACEP guidelines)
- Warm country dialect ("Bless your heart", "Sugar, let me tell ya")
- Cultural awareness of rural healthcare needs
- Triage protocol:
  1. ER: Chest pain, stroke signs, major trauma
  2. Urgent Care: Sprains, minor burns
  3. Home Care: Colds, minor rashes
- Always explain medical terms using folksy analogies`;

function initializeVoice() {
    // Speech recognition
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Speech synthesis
    synthesis = window.speechSynthesis;
    
    recognition.onresult = async (event) => {
        const transcript = event.results[event.results.length-1][0].transcript;
        addMessage(transcript, 'user');
        await processQuery(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        addMessage("Dagnabbit! My ears aren't workin' right", 'bot');
    };
}

async function processQuery(query) {
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
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        addMessage(reply, 'bot');
        speakResponse(reply);
    } catch (error) {
        console.error('API Error:', error);
        addMessage("Well butter my biscuit! Technical troubles, sugar", 'bot');
    }
}

function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure Southern accent
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 1;
    
    // Select a voice with Southern characteristics
    const voices = synthesis.getVoices();
    const southernVoice = voices.find(v => v.name.includes('Microsoft Zira')) || 
                         voices.find(v => v.lang === 'en-US');
    
    if (southernVoice) {
        utterance.voice = southernVoice;
        utterance.lang = 'en-US';
    }

    synthesis.speak(utterance);
}

function addMessage(text, sender) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `
        <div class="message-bubble">
            ${sender === 'bot' ? '🤠 ' : ''}${text}
        </div>
    `;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

document.getElementById('voiceControl').addEventListener('click', () => {
    if (!isListening) {
        initializeVoice();
        recognition.start();
        isListening = true;
        document.getElementById('voiceControl').classList.add('active');
    } else {
        recognition.stop();
        isListening = false;
        document.getElementById('voiceControl').classList.remove('active');
    }
});

// Initialize speech synthesis voices
window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices);
};
