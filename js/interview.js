/**
 * WorkSight - AI Interview Module
 * Handles the conversational UI and extraction to Baseline DNA.
 */

document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendChatBtn");
  const chatHistory = document.getElementById("chatHistory");
  const statusEl = document.getElementById("interviewStatus");

  let conversationHistory = [];
  let interviewActive = false;
  let analyzing = false;

  // The system instruction for the interviewer
  const INTERVIEWER_PROMPT = `You are the WorkSight AI Recruiter. Your goal is to establish the candidate's psychological baseline.
Ask exactly 3 behavioral questions ONE AT A TIME. Wait for the user to answer before asking the next.
Keep questions brief (max 2 sentences).
Question 1: Ask about how they handle strict deadlines or sudden changes (assesses Conscientiousness/Neuroticism).
Question 2: Ask about how they prefer to collaborate with a team (assesses Extraversion/Agreeableness).
Question 3: Ask them to describe a complex problem they solved recently (assesses Cognitive/Openness).
Once they answer the 3rd question, simply say: "Thank you. Your profile is now being processed." and STOP.`;

  // Function to initialize or check API key
  function checkSetup() {
    const apiKey = (localStorage.getItem("worksight_api_key") || "").trim();
    if (apiKey) {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      statusEl.textContent = "API Key active. Type your name and role to start.";
      if (!interviewActive) {
        interviewActive = true;
        // Start conversation
        conversationHistory = [
          { role: "user", parts: [{ text: "SYSTEM PROMPT INSTRUCTION: " + INTERVIEWER_PROMPT + " The user is ready." }] },
          { role: "model", parts: [{ text: "Hello! I am the WorkSight AI Recruiter. I'm going to ask you 3 quick behavioral questions to establish your baseline profile.\nFirst, please tell me your full name and the role you are applying for." }] }
        ];
      }
    } else {
      chatInput.disabled = true;
      sendBtn.disabled = true;
      statusEl.textContent = "Waiting for API Key via Settings...";
    }
  }

  // Check setup every time the AI Interview tab is clicked
  const navInterview = document.getElementById("nav-interview");
  if (navInterview) {
    navInterview.addEventListener("click", checkSetup);
  }
  
  // Initial check in case it's loaded directly
  checkSetup();

  function appendMessage(text, isUser) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-msg ${isUser ? 'user' : 'bot'}`;
    
    // Convert markdown bold and newlines to simple HTML
    let htmlText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    htmlText = htmlText.replace(/\n/g, '<br>');
    
    msgDiv.innerHTML = `
      <div class="chat-avatar">${isUser ? 'YOU' : 'AI'}</div>
      <div class="chat-bubble"><p style="margin:0;">${htmlText}</p></div>
    `;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text || analyzing) return;

    appendMessage(text, true);
    chatInput.value = "";
    conversationHistory.push({ role: "user", parts: [{ text }] });

    const apiKey = localStorage.getItem("worksight_api_key");
    const model = localStorage.getItem("worksight_model") || "gemini-2.5-flash";

    // Disable input while bot types
    chatInput.disabled = true;
    sendBtn.disabled = true;
    statusEl.innerHTML = '<span class="blinking-dot">●●●</span> AI is typing...';

    try {
      // Create lightweight fetch for the chat completion to avoid looping inside gemini.js
      const botReply = await sendChatTurn(conversationHistory, apiKey, model);
      
      conversationHistory.push({ role: "model", parts: [{ text: botReply }] });
      appendMessage(botReply, false);
      statusEl.textContent = "API Key active.";
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();

      // Check if bot said "Thank you. Your profile is now being processed."
      if (botReply.toLowerCase().includes("processing") || botReply.toLowerCase().includes("processed")) {
        triggerExtraction(apiKey, model);
      }
      
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Error: " + err.message;
      chatInput.disabled = false;
      sendBtn.disabled = false;
    }
  }

  async function triggerExtraction(apiKey, model) {
    chatInput.disabled = true;
    sendBtn.disabled = true;
    statusEl.innerHTML = '<span class="blinking-dot">●●●</span> Extracting Psychological Matrix...';
    
    try {
        const extractionPrompt = `Analyze the previous interview transcript. Extract the psychological baseline of the candidate.
        Output ONLY a strict JSON object (no markdown) with these exact keys:
        {
          "name": "Candidate Name (if found, else Unknown)",
          "role": "Candidate Role (if found, else Unknown)",
          "openness": 0-100 integer,
          "conscientiousness": 0-100 integer,
          "extraversion": 0-100 integer,
          "agreeableness": 0-100 integer,
          "neuroticism": 0-100 integer,
          "cognitiveScore": 0-100 integer (based on problem-solving answer),
          "interviewSentiment": "Very Positive"|"Positive"|"Neutral"|"Negative",
          "initialEngagement": 0-100 integer
        }
        The values MUST be based on their conversational answers.`;

        const extractionHistory = [...conversationHistory, { role: "user", parts: [{ text: extractionPrompt }] }];
        
        const jsonStr = await sendChatTurn(extractionHistory, apiKey, model);
        const data = JSON.parse(jsonStr.replace(/```json/g, "").replace(/```/g, "").trim());
        
        // Auto-fill Baseline DNA form
        document.getElementById("employeeName").value = data.name || "Alex Chen";
        document.getElementById("employeeRole").value = data.role || "Developer";
        
        document.getElementById("openness").value = data.openness || 70;
        document.getElementById("val-openness").innerText = data.openness || 70;
        
        document.getElementById("conscientiousness").value = data.conscientiousness || 70;
        document.getElementById("val-conscientiousness").innerText = data.conscientiousness || 70;
        
        document.getElementById("extraversion").value = data.extraversion || 50;
        document.getElementById("val-extraversion").innerText = data.extraversion || 50;
        
        document.getElementById("agreeableness").value = data.agreeableness || 50;
        document.getElementById("val-agreeableness").innerText = data.agreeableness || 50;
        
        document.getElementById("neuroticism").value = data.neuroticism || 50;
        document.getElementById("val-neuroticism").innerText = data.neuroticism || 50;
        
        document.getElementById("cognitiveScore").value = data.cognitiveScore || 80;
        
        const sentSelect = document.getElementById("interviewSentiment");
        if (sentSelect) {
            Array.from(sentSelect.options).forEach(opt => {
                if (opt.value === data.interviewSentiment) opt.selected = true;
            });
        }
        
        document.getElementById("initialEngagement").value = data.initialEngagement || 80;

        statusEl.textContent = "Extraction Complete!";
        
        // Switch to baseline tab
        setTimeout(() => {
            document.getElementById("nav-baseline").click();
            if (window.showToast) window.showToast("Baseline DNA successfully extracted from interview!", "success");
        }, 1500);

    } catch (err) {
        console.error("Extraction Failed", err);
        statusEl.textContent = "Extraction Failed. See console.";
    }
  }

  // Raw Gemini Chat API Call
  async function sendChatTurn(history, apiKey, modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // We must format the history to Gemini's strict format.
    const contents = history.map(msg => ({
        role: msg.role === "bot" ? "model" : msg.role,
        parts: msg.parts
    }));

    const body = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error?.message || "API Error");
    }
    
    return data.candidates[0].content.parts[0].text;
  }

  sendBtn.addEventListener("click", handleSend);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
});
