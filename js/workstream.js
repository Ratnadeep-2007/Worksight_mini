/**
 * WorkSight – Workstream Intelligence Module
 * Chat-based task extraction using Gemini as the intelligence engine.
 * Replaces rules.py with LLM-powered intent classification.
 */

const WorkstreamEngine = (() => {
  const STORAGE_KEY = "worksight_workstream";
  const CHAT_KEY = "worksight_ws_chat";

  // Gemini system prompt for workstream intelligence
  const WS_SYSTEM_PROMPT = `You are the WorkSight Workstream Intelligence Engine. Your job is to analyze natural language work updates and extract structured organizational data.

When a user sends a message, you must:
1. CLASSIFY the intent into exactly one category:
   - CREATE_TASK: User describes new work items (default if unclear)
   - UPDATE_STATUS: User reports progress ("finished", "done", "working on", "started")
   - BLOCKER: User reports being stuck ("blocked by", "stuck on", "waiting for")
   - COMMITMENT: User makes a future promise ("I will", "by Friday", "commit to")
   - QUERY: User asks a question ("what", "show", "status", "how many")

2. EXTRACT entities:
   - task_description: What the task is about
   - status: TODO, IN_PROGRESS, DONE, or BLOCKED
   - assignee: Who it's for (use the sender's name if "@someone" not found)
   - due_date: Any mentioned deadline (null if none)
   - blocker_description: What's blocking (null if not a blocker)

3. Generate a helpful RESPONSE acknowledging the update.

OUTPUT FORMAT (strict JSON, no markdown fences):
{
  "intent": "CREATE_TASK|UPDATE_STATUS|BLOCKER|COMMITMENT|QUERY",
  "extracted_entities": [
    {
      "task_description": "string",
      "status": "TODO|IN_PROGRESS|DONE|BLOCKED",
      "assignee": "string",
      "due_date": "string or null",
      "blocker_description": "string or null"
    }
  ],
  "response": "string (friendly acknowledgment to the user)",
  "summary": "string (one-line summary of what was extracted)"
}

For QUERY intents, the extracted_entities array should be empty, and the response should answer the question based on the conversation context.
Important: Always return valid JSON. Never wrap in markdown code fences.`;

  function getData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { tasks: [], blockers: [], commitments: [], stats: {} };
    } catch {
      return { tasks: [], blockers: [], commitments: [], stats: {} };
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getChatHistory() {
    try {
      return JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    } catch { return []; }
  }

  function saveChatHistory(history) {
    localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-50))); // Keep last 50 messages
  }

  function generateTaskId() {
    return "T-" + Date.now().toString(36).toUpperCase();
  }

  // Process extracted entities and save to data store
  function processExtraction(result, senderName) {
    const data = getData();
    const now = new Date().toISOString();

    if (!result.extracted_entities || result.extracted_entities.length === 0) return data;

    result.extracted_entities.forEach(entity => {
      const taskId = generateTaskId();

      if (result.intent === "BLOCKER") {
        // Find the most recent active task for this user
        const activeTask = data.tasks.find(t =>
          t.assignee === senderName && (t.status === "IN_PROGRESS" || t.status === "TODO")
        );

        data.blockers.push({
          id: "B-" + Date.now().toString(36).toUpperCase(),
          description: entity.blocker_description || entity.task_description,
          linkedTaskId: activeTask ? activeTask.id : null,
          linkedTaskDesc: activeTask ? activeTask.description : "Unknown",
          reportedBy: senderName,
          isActive: true,
          createdAt: now
        });

        // Mark the linked task as blocked
        if (activeTask) {
          activeTask.status = "BLOCKED";
          activeTask.updatedAt = now;
        }

      } else if (result.intent === "COMMITMENT") {
        data.commitments.push({
          id: "C-" + Date.now().toString(36).toUpperCase(),
          description: entity.task_description,
          dueDate: entity.due_date,
          assignee: entity.assignee || senderName,
          isFulfilled: false,
          createdAt: now
        });
        // Also create as a TODO task
        data.tasks.push({
          id: taskId,
          description: entity.task_description,
          status: "TODO",
          assignee: entity.assignee || senderName,
          dueDate: entity.due_date,
          createdAt: now,
          updatedAt: now
        });

      } else if (result.intent === "UPDATE_STATUS") {
        // Try to find existing task matching description
        const existingTask = data.tasks.find(t =>
          t.description.toLowerCase().includes(entity.task_description.toLowerCase().substring(0, 20)) ||
          entity.task_description.toLowerCase().includes(t.description.toLowerCase().substring(0, 20))
        );

        if (existingTask) {
          existingTask.status = entity.status;
          existingTask.updatedAt = now;
        } else {
          data.tasks.push({
            id: taskId,
            description: entity.task_description,
            status: entity.status || "IN_PROGRESS",
            assignee: entity.assignee || senderName,
            dueDate: entity.due_date,
            createdAt: now,
            updatedAt: now
          });
        }

      } else if (result.intent === "CREATE_TASK") {
        data.tasks.push({
          id: taskId,
          description: entity.task_description,
          status: entity.status || "TODO",
          assignee: entity.assignee || senderName,
          dueDate: entity.due_date,
          createdAt: now,
          updatedAt: now
        });
      }
    });

    // Recompute stats
    data.stats = computeStats(data);
    saveData(data);
    return data;
  }

  function computeStats(data) {
    const total = data.tasks.length;
    const done = data.tasks.filter(t => t.status === "DONE").length;
    const inProgress = data.tasks.filter(t => t.status === "IN_PROGRESS").length;
    const blocked = data.tasks.filter(t => t.status === "BLOCKED").length;
    const todo = data.tasks.filter(t => t.status === "TODO").length;
    const activeBlockers = data.blockers.filter(b => b.isActive).length;
    const pendingCommitments = data.commitments.filter(c => !c.isFulfilled).length;

    return {
      total, done, inProgress, blocked, todo,
      activeBlockers, pendingCommitments,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      healthScore: total > 0 ? Math.round(((done + inProgress) / total) * 100 - (blocked / total) * 30) : 100
    };
  }

  // Send message to Gemini for processing
  async function processMessage(message, senderName, apiKey, model) {
    const chatHistory = getChatHistory();

    // Build context with recent task data for QUERY handling
    const data = getData();
    const taskContext = data.tasks.length > 0
      ? `\n\nCurrent workstream state for context:\nTasks: ${JSON.stringify(data.tasks.slice(0, 10))}\nActive Blockers: ${JSON.stringify(data.blockers.filter(b => b.isActive))}\nPending Commitments: ${JSON.stringify(data.commitments.filter(c => !c.isFulfilled))}`
      : "";

    const contents = [
      { role: "user", parts: [{ text: WS_SYSTEM_PROMPT + taskContext + "\n\nThe user's name is: " + senderName }] },
      { role: "model", parts: [{ text: "Understood. I will analyze all messages and return structured JSON with intent classification and entity extraction." }] },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.3 }
      })
    });

    const responseData = await res.json();
    if (!res.ok) throw new Error(responseData.error?.message || "API Error");

    const rawText = responseData.candidates[0].content.parts[0].text;
    const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedText);

    // Save chat history
    chatHistory.push({ role: "user", text: message, timestamp: new Date().toISOString() });
    chatHistory.push({ role: "model", text: result.response, timestamp: new Date().toISOString() });
    saveChatHistory(chatHistory);

    // Process and store extracted data
    const updatedData = processExtraction(result, senderName);

    return { result, updatedData };
  }

  // Compute Digital Exhaust metrics from workstream data for burnout engine
  function computeDigitalExhaust() {
    const data = getData();
    if (data.tasks.length === 0) return null;

    const stats = computeStats(data);
    const chatHistory = getChatHistory();

    // Calculate work patterns from chat timestamps
    const userMessages = chatHistory.filter(m => m.role === "user");
    let lateNightCount = 0;
    let weekendCount = 0;

    userMessages.forEach(msg => {
      const d = new Date(msg.timestamp);
      const hour = d.getHours();
      const day = d.getDay();
      if (hour >= 21 || hour < 6) lateNightCount++;
      if (day === 0 || day === 6) weekendCount++;
    });

    return {
      taskCompletionCurrent: stats.completionRate,
      taskCompletionBaseline: 85, // Assumed healthy baseline
      blockedTasks: stats.blocked,
      totalTasks: stats.total,
      lateNightActivity: lateNightCount,
      weekendActivity: weekendCount,
      messageFrequency: userMessages.length,
      healthScore: stats.healthScore
    };
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHAT_KEY);
  }

  return {
    getData, processMessage, computeStats, computeDigitalExhaust,
    getChatHistory, clearAll, generateTaskId
  };
})();
