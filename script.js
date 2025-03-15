const API_KEY = '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';
const API_URL = 'https://api.openai.com/v1/chat/completions';

const chatOutput = document.getElementById('chat-output');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const voiceButton = document.getElementById('voice-button');

let isVoiceChatActive = false;

sendButton.addEventListener('click', sendMessage);
voiceButton.addEventListener('click', toggleVoiceChat);

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        appendMessage('You: ' + message);
        userInput.value = '';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "system",
                        content: "You are a helpful assistant with a strong country accent. Please respond in a way that reflects this accent."
                    }, {
                        role: "user",
                        content: message
                    }]
                })
            });

            const data = await response.json();
            const reply = data.choices[0].message.content;
            appendMessage('Chatbot: ' + reply);

            if (isVoiceChatActive) {
                // Here you would integrate with a text-to-speech API to vocalize the response
                // For simplicity, we're just alerting the message
                alert('Chatbot says: ' + reply);
            }
        } catch (error) {
            console.error('Error:', error);
            appendMessage('Error: Unable to get response');
        }
    }
}

function appendMessage(message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    chatOutput.appendChild(messageElement);
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

function toggleVoiceChat() {
    isVoiceChatActive = !isVoiceChatActive;
    voiceButton.textContent = isVoiceChatActive ? 'Stop Voice Chat' : 'Start Voice Chat';
    // Here you would integrate with a speech recognition API to handle voice input
    // For simplicity, we're just alerting the status
    alert(isVoiceChatActive ? 'Voice chat activated' : 'Voice chat deactivated');
}
