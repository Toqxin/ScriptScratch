chrome.runtime.onInstalled.addListener(() => {
  chrome.history.search({ text: '', maxResults: 10 }, function(data) {
    data.forEach(function(page) {
    });
  });

  chrome.contextMenus.create({
    id: "addNote",
    title: "Add Note ScriptScratch®",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addNote") {
    chrome.tabs.sendMessage(tab.id, { action: "addNote" });
  }
});

let dailyActiveTime = 0;
let sessionStartTime = null;
let lastResetDate = null;

function resetDailyTime() {
  dailyActiveTime = 0;
  chrome.storage.local.set({ dailyActiveTime: dailyActiveTime });
}

function checkForDailyReset() {
  const now = new Date();
  const today = now.toDateString();
  
  if (lastResetDate !== today) {
    resetDailyTime();
    lastResetDate = today;
    chrome.storage.local.set({ lastResetDate: lastResetDate });
  }
}

function trackActiveTime() {
  if (sessionStartTime !== null) {
    const elapsed = Date.now() - sessionStartTime;
    dailyActiveTime += elapsed;
    sessionStartTime = Date.now();
    chrome.storage.local.set({ dailyActiveTime: dailyActiveTime });
  }
}

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['dailyActiveTime', 'lastResetDate'], (result) => {
    dailyActiveTime = result.dailyActiveTime || 0;
    lastResetDate = result.lastResetDate || new Date().toDateString();
    sessionStartTime = Date.now();
    checkForDailyReset();
  });
});

setInterval(() => {
  if (sessionStartTime === null) {
    sessionStartTime = Date.now();
  }
  trackActiveTime();
  checkForDailyReset();
}, 1000);

chrome.runtime.onSuspend.addListener(() => {
  if (sessionStartTime !== null) {
    trackActiveTime();
    sessionStartTime = null;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDailyActiveTime") {
    trackActiveTime();
    const hours = Math.floor(dailyActiveTime / (1000 * 60 * 60));
    const minutes = Math.floor((dailyActiveTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((dailyActiveTime % (1000 * 60)) / 1000);
    sendResponse({ hours: hours, minutes: minutes, seconds: seconds });
  }
});

