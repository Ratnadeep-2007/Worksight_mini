import Vapi from "https://esm.sh/@vapi-ai/web";

const VAPI_PUBLIC_KEY = "fa7f7ec0-b529-41f1-92c0-9cfe29124359";
const VAPI_ASSISTANT_ID = "45c29b86-11ad-4477-98e6-556fb4a1cb55";

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const statusText = document.getElementById("statusText");
const subtitleText = document.getElementById("subtitleText");
const orbCore = document.getElementById("orbCore");
const body = document.body;

let vapi;
let isCallActive = false;
let conversationTranscript = "";

try {
  vapi = new Vapi(VAPI_PUBLIC_KEY);
  setupVapiEvents();
} catch (err) {
  console.error("Failed to initialize Vapi", err);
  statusText.innerText = "Error Core Logic";
  subtitleText.innerText = "Please check console.";
}

function startCall() {
  statusText.innerText = "Connecting...";
  subtitleText.innerText = "Securing voice connection to the AI engine.";
  startBtn.style.display = "none";
  endBtn.style.display = "inline-flex";
  
  // Request microphone access specifically to avoid silent failures
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => {
      vapi.start(VAPI_ASSISTANT_ID, {
        firstMessage: "Hi there. I'm WorkSight, your AI wellness partner. I wanted to just do a quick check-in to see how you're feeling about work lately. How has your week been going?"
      });
    })
    .catch((err) => {
      console.error("Microphone access denied:", err);
      statusText.innerText = "Microphone Denied";
      subtitleText.innerText = "Please allow microphone access and try again.";
      resetUI();
    });
}

function setupVapiEvents() {
  vapi.on("message", (msg) => {
    if (msg.type === "transcript" && msg.transcriptType === "final") {
      conversationTranscript += `\n${msg.role}: ${msg.transcript}`;
    }
  });

  vapi.on("call-start", () => {
    isCallActive = true;
    conversationTranscript = ""; // Reset for new call
    statusText.innerText = "Connected";
    subtitleText.innerText = "The AI is ready. You can begin speaking.";
    body.classList.add("state-listening");
  });

  vapi.on("call-end", () => {
    isCallActive = false;
    statusText.innerText = "Call Ended";
    subtitleText.innerText = "The interview has been concluded. You can return to the dashboard.";
    resetUI();
  });

  vapi.on("speech-start", () => {
    // AI is talking
    statusText.innerText = "AI is Speaking...";
    body.classList.remove("state-listening");
    body.classList.add("state-speaking");
    
    // Simulate mouth/bot movement with CSS scale
    orbCore.style.transform = "scale(1.15)";
  });

  vapi.on("speech-end", () => {
    // AI stopped talking, user turn
    if (isCallActive) {
      statusText.innerText = "Listening...";
      body.classList.remove("state-speaking");
      body.classList.add("state-listening");
      orbCore.style.transform = "scale(1)";
    }
  });

  vapi.on("volume-level", (level) => {
    // Volume level drives the glow and size of orb
    if (isCallActive) {
      // level is typically 0 to 1
      const scale = 1 + (level * 0.5);
      orbCore.style.transform = `scale(${scale})`;
    }
  });

  vapi.on("error", (e) => {
    console.error("Vapi Error:", e);
    statusText.innerText = "Connection Error";
    subtitleText.innerText = "Something went wrong. Please check your connection.";
    resetUI();
  });
}

function resetUI() {
  isCallActive = false;
  body.classList.remove("state-listening");
  body.classList.remove("state-speaking");
  orbCore.style.transform = "scale(1)";
  startBtn.style.display = "inline-flex";
  endBtn.style.display = "none";
  if (vapi) {
      vapi.stop();
  }
  // Save transcript to be processed on the dashboard
  if (conversationTranscript.trim().length > 10) {
    localStorage.setItem("worksight_latest_transcript", conversationTranscript);
    window.location.href = "index.html"; // Redirect back automatically!
  }
}

// Button Listeners
startBtn.addEventListener("click", () => {
  if (vapi) {
    startCall();
  }
});

endBtn.addEventListener("click", () => {
  resetUI();
});
