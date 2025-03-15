// Open and close the chat modal
document.getElementById('chatButton').addEventListener('click', function() {
  document.getElementById('chatModal').style.display = 'flex';
});

document.getElementById('closeModal').addEventListener('click', function() {
  document.getElementById('chatModal').style.display = 'none';
});

// Voice recognition setup using the Web Speech API
let recognizing = false;
let recognition;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = function() {
    console.log('Voice recognition started.');
    document.getElementById('audioWaves').style.display = 'block';
  };

  recognition.onerror = function(event) {
    console.log('Error: ' + event.error);
  };

  recognition.onend = function() {
    console.log('Voice recognition ended.');
    document.getElementById('audioWaves').style.display = 'none';
  };

  recognition.onresult = function(event) {
    let transcript = event.results[0][0].transcript;
    console.log('User said: ', transcript);
    sendToChatGPT(transcript);
  };
} else {
  alert('Your browser does not support voice recognition.');
}

// Toggle voice chat on button click
document.getElementById('startVoice').addEventListener('click', function() {
  if (!recognizing) {
    recognition.start();
    recognizing = true;
    document.getElementById('startVoice').textContent = 'Stop Voice Chat';
  } else {
    recognition.stop();
    recognizing = false;
    document.getElementById('startVoice').textContent = 'Start Voice Chat';
  }
});

// Function to call the ChatGPT Advanced Voice Mode API
function sendToChatGPT(message) {
  // Replace with the actual API endpoint URL
  let apiUrl = 'https://api.yourchatgptvoice.com/advanced-voice';

  // Prompt engineering: instruct the API to reply with a country accent and clinical expertise
  let promptEngineering = "You are a board-certified emergency medicine physician with a warm, empathetic tone and a deep southern accent. Speak friendly and down-to-earth. Advise the user clearly, and if symptoms are severe, tell them to seek urgent care or visit an emergency department.";

  let requestBody = {
    prompt: promptEngineering + "\nUser: " + message,
    voiceAccent: "country"  // This parameter is hypothetical; adjust based on the API docs
    // Add any additional parameters required by the API here
  };

  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'  // Replace YOUR_API_KEY with your actual key
    },
    body: JSON.stringify(requestBody)
  })
  .then(response => response.json())
  .then(data => {
    let reply = data.reply || "Well butter my biscuit - technical difficulties!";
    console.log('ChatGPT reply: ', reply);
    displayReply(reply);
    speakText(reply);
  })
  .catch(error => {
    console.log('Error: ', error);
    displayReply("Well butter my biscuit - technical difficulties!");
  });
}

// Function to display the reply in the chat area
function displayReply(reply) {
  let chatArea = document.getElementById('chatArea');
  let replyElement = document.createElement('p');
  replyElement.textContent = reply;
  chatArea.appendChild(replyElement);
}

// Use text-to-speech to speak the reply back with a slight modification for accent
function speakText(text) {
  if ('speechSynthesis' in window) {
    let utterance = new SpeechSynthesisUtterance(text);
    // Adjust pitch and rate to give a hint of that country accent if a matching voice isn’t available
    utterance.pitch = 1.2;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}
