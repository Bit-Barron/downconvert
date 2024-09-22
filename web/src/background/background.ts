let currentTabId: number | null = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTabId = activeInfo.tabId;
  chrome.runtime.sendMessage({ type: "TAB_CHANGED", tabId: currentTabId });
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (currentTabId !== null && details.tabId === currentTabId) {
      chrome.storage.local.get(currentTabId.toString(), (result) => {
        const tabImages = result[currentTabId!.toString()] || [];
        tabImages.push(details);
        chrome.storage.local.set({ [currentTabId!.toString()]: tabImages });
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (currentTabId !== null && details.tabId === currentTabId) {
      chrome.storage.local.get(currentTabId.toString(), (result) => {
        const tabImages = result[currentTabId!.toString()] || [];
        tabImages.push(details);
        chrome.storage.local.set({ [currentTabId!.toString()]: tabImages });
      });
    }
  },
  { urls: ["<all_urls>"] },
  []
);
