const VAPI_PUBLIC_KEY = "fa7f7ec0-b529-41f1-92c0-9cfe29124359";
const VAPI_ASSISTANT_ID = "45c29b86-11ad-4477-98e6-556fb4a1cb55";

document.addEventListener("DOMContentLoaded", () => {
  const vapiBtn = document.getElementById("vapiBtn");
  const vapiBtnText = document.getElementById("vapiBtnText");
  const vapiMicIcon = document.getElementById("vapiMicIcon");

  // Prevent initialization if Vapi isn't loaded (e.g. offline)
  if (!window.vapi) {
    if (window.Vapi) {
      window.vapiInstance = new window.Vapi(VAPI_PUBLIC_KEY);
    } else {
      console.error("Vapi SDK not found on window object.");
      return;
    }
  }

  const vapi = window.vapiInstance;
  let isCallActive = false;

  vapiBtn.addEventListener("click", () => {
    if (isCallActive) {
      vapi.stop();
      vapiBtnText.innerText = "Stopping...";
    } else {
      vapi.start(VAPI_ASSISTANT_ID);
      vapiBtnText.innerText = "Connecting...";
    }
  });

  // Event Listeners for Call State
  vapi.on("call-start", () => {
    isCallActive = true;
    vapiBtn.classList.add("active-call");
    vapiBtnText.innerText = "End Interview";
    vapiMicIcon.style.stroke = "#fff";
  });

  vapi.on("call-end", () => {
    isCallActive = false;
    vapiBtn.classList.remove("active-call");
    vapiBtnText.innerText = "Start Interview";
    vapiMicIcon.style.stroke = "currentColor";
  });

  vapi.on("speech-start", () => {
    // When the AI starts speaking
    vapiBtnText.innerText = "Listening...";
  });

  vapi.on("speech-end", () => {
    // When the AI stops speaking
    if (isCallActive) {
      vapiBtnText.innerText = "End Interview";
    }
  });

  vapi.on("error", (e) => {
    console.error("Vapi Error:", e);
    isCallActive = false;
    vapiBtn.classList.remove("active-call");
    vapiBtnText.innerText = "Start Interview";
    alert("There was an error connecting to the voice assistant.");
  });
});
