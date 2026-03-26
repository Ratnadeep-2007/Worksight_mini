/**
 * WorkSight – Sample Employee Data
 * Pre-loaded "Alex" demo scenario
 */

const SAMPLE_EMPLOYEES = {
  alex: {
    name: "Alex Chen",
    role: "High-Focus Developer",
    baseline: {
      bigFive: {
        openness: 72,
        conscientiousness: 88,
        extraversion: 30,
        agreeableness: 78,
        neuroticism: 22,
      },
      cognitiveScore: 91,
      interviewSentiment: "Very Positive",
      initialEngagement: 94,
    },
    operational: {
      meetingsPerWeek: 26,
      meetingsBaseline: 10,
      backToBackPct: 70,
      avgLoginTime: "08:00",
      avgLogoutTime: "22:30",
      lateNightLogins: 14,
      weekendLogins: 8,
      taskCompletionCurrent: 48,
      taskCompletionBaseline: 88,
      avgTaskTime: 7.5,
    },
    communication: {
      msgFrequency: 14,
      msgFrequencyBaseline: 38,
      responseLatency: 55,
      responseLatencyBaseline: 8,
      teamInteractionScore: 28,
      teamInteractionBaseline: 80,
      isolationFlag: "Yes",
    },
  },
};

/**
 * Load a sample employee's data into all form fields.
 */
function loadSampleEmployee(key = "alex") {
  const emp = SAMPLE_EMPLOYEES[key];
  if (!emp) return;

  // Employee info
  document.getElementById("employeeName").value = emp.name;
  document.getElementById("employeeRole").value = emp.role;

  // Big Five sliders
  const traits = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
  traits.forEach((t) => {
    const slider = document.getElementById(t);
    slider.value = emp.baseline.bigFive[t];
    document.getElementById(`val-${t}`).textContent = emp.baseline.bigFive[t];
  });

  // Cognitive & Engagement
  document.getElementById("cognitiveScore").value = emp.baseline.cognitiveScore;
  document.getElementById("interviewSentiment").value = emp.baseline.interviewSentiment;
  document.getElementById("initialEngagement").value = emp.baseline.initialEngagement;

  // Operational
  document.getElementById("meetingsPerWeek").value = emp.operational.meetingsPerWeek;
  document.getElementById("meetingsBaseline").value = emp.operational.meetingsBaseline;
  document.getElementById("backToBackPct").value = emp.operational.backToBackPct;
  document.getElementById("avgLoginTime").value = emp.operational.avgLoginTime;
  document.getElementById("avgLogoutTime").value = emp.operational.avgLogoutTime;
  document.getElementById("lateNightLogins").value = emp.operational.lateNightLogins;
  document.getElementById("weekendLogins").value = emp.operational.weekendLogins;
  document.getElementById("taskCompletionCurrent").value = emp.operational.taskCompletionCurrent;
  document.getElementById("taskCompletionBaseline").value = emp.operational.taskCompletionBaseline;
  document.getElementById("avgTaskTime").value = emp.operational.avgTaskTime;

  // Communication
  document.getElementById("msgFrequency").value = emp.communication.msgFrequency;
  document.getElementById("msgFrequencyBaseline").value = emp.communication.msgFrequencyBaseline;
  document.getElementById("responseLatency").value = emp.communication.responseLatency;
  document.getElementById("responseLatencyBaseline").value = emp.communication.responseLatencyBaseline;
  document.getElementById("teamInteractionScore").value = emp.communication.teamInteractionScore;
  document.getElementById("teamInteractionBaseline").value = emp.communication.teamInteractionBaseline;
  document.getElementById("isolationFlag").value = emp.communication.isolationFlag;
}
