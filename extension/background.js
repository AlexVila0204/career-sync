chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { type: "career-sync:toggle" }).catch(() => {});
});
