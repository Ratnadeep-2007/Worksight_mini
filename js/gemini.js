/**
 * WorkSight – Gemini API Integration
 * Handles the system prompt, request construction, and response parsing.
 */

const WORKSIGHT_SYSTEM_PROMPT = `Role: You are the WorkSight Predictive HR Engine, a specialized analytical AI designed to bridge the gap between recruitment data and operational reality.

Core Methodology: Your primary task is to measure "Profile Drift"—the mathematical and behavioral distance between an employee's initial "Baseline DNA" (who they were at hire) and their "Current Operational Exhaust" (how they are working now).

Data Inputs (To be provided in JSON format):
1. Recruitment Silo (Baseline DNA): Personality traits (Big Five), cognitive scores, and initial interview sentiment.
2. Operational Silo (Digital Exhaust): Task completion speed, meeting density, and system login/logout patterns.
3. Communication Silo (Metadata): Message frequency and response latency (Note: For privacy, no raw text content is processed).

Step-by-Step Analysis Instructions:
- Step 1: Drift Analysis. Compare the Baseline DNA (e.g., an introverted, high-focus persona) against the Operational Exhaust (e.g., a sudden 40% spike in meeting density).
- Step 2: Risk Scoring. Calculate a Burnout Probability Score (0-100%) based on these misalignments.
- Step 3: SHAP-Style Explainability. For every prediction, identify the top 3 specific stressors. Assign a percentage "impact weight" to each. The three weights must sum to 100%.
- Step 4: Proactive Intervention. Suggest a human-led management tactic to reduce technostress or role overload.

Output Requirements (Strict JSON Format Only — no markdown fences, no extra text):
{
  "burnout_risk_score": [integer 0-100],
  "risk_level": "[Low/Medium/High/Critical]",
  "profile_drift_summary": "[A 2-sentence explanation of how the employee's current work patterns differ from their hiring persona]",
  "xai_reasoning_tags": [
    {"factor": "[Stressor Name]", "impact_weight": "[XX%]", "explanation": "[Brief 'Why' sentence]"},
    {"factor": "[Stressor Name]", "impact_weight": "[XX%]", "explanation": "[Brief 'Why' sentence]"},
    {"factor": "[Stressor Name]", "impact_weight": "[XX%]", "explanation": "[Brief 'Why' sentence]"}
  ],
  "intervention_tactic": "[One specific management action]"
}`;

/**
 * Collect all employee data from the input forms.
 */
function collectEmployeeData() {
  return {
    employee: {
      name: document.getElementById("employeeName").value || "Unknown",
      role: document.getElementById("employeeRole").value || "Unspecified",
    },
    recruitment_silo: {
      big_five_personality: {
        openness: parseInt(document.getElementById("openness").value),
        conscientiousness: parseInt(document.getElementById("conscientiousness").value),
        extraversion: parseInt(document.getElementById("extraversion").value),
        agreeableness: parseInt(document.getElementById("agreeableness").value),
        neuroticism: parseInt(document.getElementById("neuroticism").value),
      },
      cognitive_test_score: parseInt(document.getElementById("cognitiveScore").value),
      interview_sentiment: document.getElementById("interviewSentiment").value,
      initial_engagement_score: parseInt(document.getElementById("initialEngagement").value),
    },
    operational_silo: {
      meeting_density: {
        current_meetings_per_week: parseInt(document.getElementById("meetingsPerWeek").value),
        baseline_meetings_per_week: parseInt(document.getElementById("meetingsBaseline").value),
        back_to_back_percentage: parseInt(document.getElementById("backToBackPct").value),
      },
      work_life_boundary: {
        avg_login_time: document.getElementById("avgLoginTime").value,
        avg_logout_time: document.getElementById("avgLogoutTime").value,
        late_night_logins_per_month: parseInt(document.getElementById("lateNightLogins").value),
        weekend_logins_per_month: parseInt(document.getElementById("weekendLogins").value),
      },
      task_velocity: {
        current_completion_rate: parseInt(document.getElementById("taskCompletionCurrent").value),
        baseline_completion_rate: parseInt(document.getElementById("taskCompletionBaseline").value),
        avg_task_completion_hours: parseFloat(document.getElementById("avgTaskTime").value),
      },
    },
    communication_silo: {
      message_frequency: {
        current_per_day: parseInt(document.getElementById("msgFrequency").value),
        baseline_per_day: parseInt(document.getElementById("msgFrequencyBaseline").value),
      },
      response_latency: {
        current_avg_minutes: parseInt(document.getElementById("responseLatency").value),
        baseline_avg_minutes: parseInt(document.getElementById("responseLatencyBaseline").value),
      },
      network_interaction: {
        current_score: parseInt(document.getElementById("teamInteractionScore").value),
        baseline_score: parseInt(document.getElementById("teamInteractionBaseline").value),
        social_isolation_detected: document.getElementById("isolationFlag").value,
      },
    },
  };
}

/**
 * Models to try — ordered by preference.
 */
const ALL_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

/**
 * Call the Gemini API for Profile Drift Analysis.
 * - On 404: tries the next model in the list.
 * - On 429: waits the retry delay, then tries the next model.
 * - On 400/403: stops immediately with a clear error.
 */
async function analyzeProfileDrift(employeeData, apiKey, preferredModel = "gemini-2.0-flash") {
  // Put preferred model first, then the rest
  const modelsToTry = [preferredModel, ...ALL_MODELS.filter(m => m !== preferredModel)];
  const maxRetries = 2; // total retry rounds across all models

  let lastError = null;
  let retryCount = 0;

  for (const model of modelsToTry) {
    try {
      console.log(`[WorkSight] Trying model: ${model}`);
      _updateLoadingText(`Connecting to ${model}…`);
      const result = await _callGemini(employeeData, apiKey, model);
      console.log(`[WorkSight] ✓ Success with: ${model}`);
      return result;
    } catch (err) {
      console.warn(`[WorkSight] ✗ ${model}:`, err.message);
      lastError = err;

      // 400 = bad/expired key → stop immediately
      if (err.status === 400) {
        throw new Error(
          "Your API key is invalid or expired.\n\n" +
          "Fix: Go to https://aistudio.google.com/apikey → Create a new key → Paste it in Settings."
        );
      }

      // 403 = restricted key → stop immediately
      if (err.status === 403) {
        throw new Error(
          "Your API key is restricted and cannot access the Gemini API.\n\n" +
          "Fix: Go to https://aistudio.google.com/apikey → Check key restrictions → Or create a new unrestricted key."
        );
      }

      // 429 = rate limit → wait and try next model
      if (err.status === 429 && retryCount < maxRetries) {
        retryCount++;
        const waitSec = err.retryDelay || 30;
        console.log(`[WorkSight] Rate limited. Waiting ${waitSec}s before trying next model…`);
        await _countdownWait(waitSec);
        continue; // try next model
      }

      // 404 = model not found → try next model immediately
      if (err.status === 404) {
        continue;
      }

      // Any other error → stop
      throw err;
    }
  }

  // If we exhausted all models due to 429, do one final retry on the preferred model
  if (lastError?.status === 429) {
    console.log(`[WorkSight] Final retry on ${preferredModel}…`);
    _updateLoadingText(`Final retry on ${preferredModel}…`);
    try {
      return await _callGemini(employeeData, apiKey, preferredModel);
    } catch (finalErr) {
      throw new Error(
        "Rate limit exceeded on all models.\n\n" +
        "Your free-tier daily quota may be exhausted. Options:\n" +
        "1. Wait 1–2 minutes and try again (click Analyze ONCE)\n" +
        "2. Create a new key in a NEW project at https://aistudio.google.com/apikey\n" +
        "3. Enable billing on your Google Cloud project to remove limits"
      );
    }
  }

  throw new Error(
    `All models unavailable. Last error: ${lastError?.message || "Unknown"}\n\n` +
    "Create a new API key at https://aistudio.google.com/apikey"
  );
}

/**
 * Show a countdown in the loading overlay.
 */
async function _countdownWait(seconds) {
  for (let i = seconds; i > 0; i--) {
    _updateLoadingText(`Rate limited — retrying in ${i}s…`);
    await new Promise(r => setTimeout(r, 1000));
  }
}

/**
 * Update the loading overlay text.
 */
function _updateLoadingText(msg) {
  const el = document.querySelector(".loader-center p");
  if (el) el.textContent = msg;
}

/**
 * Internal: make a single Gemini API call.
 * Throws an error object with a .status property for the caller to handle.
 */
async function _callGemini(employeeData, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const userMessage = `Analyze the following employee data for Profile Drift and Burnout Risk. Return ONLY valid JSON with no markdown fences or additional text.\n\nEmployee Data:\n${JSON.stringify(employeeData, null, 2)}`;

  const payload = {
    system_instruction: {
      parts: [{ text: WORKSIGHT_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    // Parse retry delay from response if available
    let retryDelay = 30;
    const delayMatch = errBody.match(/retry in (\d+)/i);
    if (delayMatch) retryDelay = parseInt(delayMatch[1]) + 2;

    const err = new Error(`Gemini ${response.status} [${model}]: ${errBody.slice(0, 150)}`);
    err.status = response.status;
    err.retryDelay = retryDelay;
    throw err;
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse Gemini response as JSON: " + cleaned.slice(0, 200));
  }
}
