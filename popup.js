const DEFAULT_LIMIT = 5;
const LAST_DEBUG_RESET_KEY = "lastDebugResetAt";

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function setMessage(text, isError = false) {
  const messageEl = document.getElementById("message");
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#7a1f1f" : "#1f5f2a";
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "Never";

  return new Date(timestamp).toLocaleString();
}

function getTrackedVideoCount(dailyData) {
  return Object.values(dailyData || {}).reduce((total, dayData) => {
    if (!dayData || !Array.isArray(dayData.viewedVideoIds)) return total;
    return total + dayData.viewedVideoIds.length;
  }, 0);
}

async function render() {
  const data = await chrome.storage.local.get([
    "dailyLimit",
    "dailyData",
    "debugEnabled",
    "lastDebugResetAt"
  ]);

  const limit = Number.isInteger(data.dailyLimit) ? data.dailyLimit : 5;
  const today = getTodayKey();
  const count = data.dailyData?.[today]?.count || 0;
  const debugEnabled = data.debugEnabled === true;
  const debugInfoEl = document.getElementById("debugInfo");

  document.getElementById("limit").value = limit;
  document.getElementById("debug").checked = debugEnabled;
  document.getElementById("reset").disabled = !debugEnabled;
  document.getElementById("status").textContent =
    `Today: ${count} / ${limit} videos watched. Debug logging is ${
      debugEnabled ? "on" : "off"
    }.`;
  debugInfoEl.textContent = debugEnabled
    ? `Last reset: ${formatTimestamp(data.lastDebugResetAt)}`
    : "";
}

document.getElementById("save").addEventListener("click", async () => {
  const input = document.getElementById("limit");
  const debugInput = document.getElementById("debug");
  const value = parseInt(input.value, 10);

  if (!Number.isInteger(value) || value < 1) {
    setMessage("Please enter a whole number greater than 0.", true);
    return;
  }

  await chrome.storage.local.set({
    dailyLimit: value,
    debugEnabled: debugInput.checked
  });
  await render();
  setMessage("Settings saved.");
});

document.getElementById("reset").addEventListener("click", async () => {
  const debugEnabled = document.getElementById("debug").checked;

  if (!debugEnabled) {
    setMessage("Enable debug logging before resetting extension data.", true);
    return;
  }

  try {
    const existing = await chrome.storage.local.get(["dailyData"]);
    const clearedVideoCount = getTrackedVideoCount(existing.dailyData);
    const resetAt = new Date().toISOString();

    await chrome.storage.local.set({
      dailyLimit: DEFAULT_LIMIT,
      dailyData: {},
      debugEnabled: true,
      [LAST_DEBUG_RESET_KEY]: resetAt
    });

    await render();
    setMessage(
      `Extension data reset. Cleared ${clearedVideoCount} tracked video(s).`
    );
  } catch (error) {
    console.error("Reset failed:", error);
    setMessage("Reset failed. Check the popup console for details.", true);
  }
});

chrome.storage.onChanged.addListener(() => {
  render();
});

render();
