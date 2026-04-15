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

async function render() {
  const data = await chrome.storage.local.get([
    "dailyLimit",
    "dailyData",
    "debugEnabled"
  ]);

  const limit = Number.isInteger(data.dailyLimit) ? data.dailyLimit : 5;
  const today = getTodayKey();
  const count = data.dailyData?.[today]?.count || 0;
  const debugEnabled = data.debugEnabled === true;

  document.getElementById("limit").value = limit;
  document.getElementById("debug").checked = debugEnabled;
  document.getElementById("reset").disabled = !debugEnabled;
  document.getElementById("status").textContent =
    `Today: ${count} / ${limit} videos watched. Debug logging is ${
      debugEnabled ? "on" : "off"
    }.`;
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

  const confirmed = window.confirm(
    "Reset the extension back to its default state for debugging?"
  );

  if (!confirmed) return;

  const response = await chrome.runtime.sendMessage({ type: "RESET_DEBUG_STATE" });

  if (!response?.ok) {
    setMessage("Reset failed. Check the service worker console for details.", true);
    return;
  }

  await render();
  setMessage("Extension data reset. Limit restored to default and watch history cleared.");
});

chrome.storage.onChanged.addListener(() => {
  render();
});

render();
