// WebSocket connection management
let realtimeConnection;
let audioQueue = [];
const OPENAI_API_KEY = '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'; // Replace with actual key

// Enhanced chat modal controls
document.getElementById('chatButton').addEventListener('click', () => {
  document.getElementById('chatModal').style.display = 'flex';
  initializeRealtimeConnection();
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('chatModal').style.display = 'none';
  realtimeConnection?.close();
});

// Real-time audio processing using MediaRecorder
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function initializeRealtimeConnection() {
  try {
    realtimeConnection = new WebSocket('wss://api.openai.com/v1/audio/realtime', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    realtimeConnection.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.audio) {
        audioQueue.push(response.audio);
        playNextAudio();
      }
      if (response.text) {
        displayReply(response.text);
      }
    };

    realtimeConnection.onerror = (error) => {
      console.error('WebSocket Error:', error);
      displayReply("Well butter my biscuit - connection troubles!");
    };

  } catch (error) {
    console.error('Connection Error:', error);
  }
}

// Audio playback management
function playNextAudio() {
  if (audioQueue.length > 0) {
    const audio = new Audio(`data:audio/wav;base64,${audioQueue.shift()}`);
    audio.play();
  }
}

// Advanced voice capture with Opus encoding
async function startAudioCapture() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      bitsPerSecond: 16000
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = btoa(String.fromCharCode(...new Uint8Array(reader.result)));
          realtimeConnection.send(JSON.stringify({
            audio: base64Data,
            voice: "country", // Valid options: alloy, echo, fable, onyx, nova, shimmer
            model: "gpt-4o-realtime-preview",
            prompt: "You're Dr. Southern Comfort, an ER physician with 20 years experience. Use layman's terms with a warm Southern drawl.",
            safety_check: true
          }));
        };
        reader.readAsArrayBuffer(event.data);
      }
    };

    mediaRecorder.start(500); // Send chunks every 500ms
    isRecording = true;
    document.getElementById('audioWaves').style.display = 'block';

  } catch (error) {
    console.error('Audio Capture Error:', error);
  }
}

// Enhanced UI controls
document.getElementById('startVoice').addEventListener('click', async () => {
  if (!isRecording) {
    await startAudioCapture();
    document.getElementById('startVoice').textContent = 'Stop Consultation';
  } else {
    mediaRecorder?.stop();
    isRecording = false;
    document.getElementById('audioWaves').style.display = 'none';
    document.getElementById('startVoice').textContent = 'Start Consultation';
  }
});

// Real-time display updates
function displayReply(text) {
  const chatArea = document.getElementById('chatArea');
  const replyElement = document.createElement('div');
  replyElement.className = 'response-bubble';
  replyElement.innerHTML = `
    <div class="doctor-icon">🏥</div>
    <div class="response-text">${text}</div>
  `;
  chatArea.appendChild(replyElement);
  chatArea.scrollTop = chatArea.scrollHeight;
}
