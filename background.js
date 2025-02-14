// Updated background.js with search count limit and resume feature
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startSearching") {
        chrome.storage.local.get(["searchLines", "currentIndex", "stopSearch", "searchCount"], function (data) {
            if (data.stopSearch) return;
            if (data.searchLines && data.searchLines.length > 0) {
                let currentIndex = data.currentIndex || 0;
                let searchCount = data.searchCount || 0;
                executeSearch(data.searchLines, currentIndex, searchCount);
            }
        });
    }
});

function executeSearch(lines, index, count) {
    if (count >= 30 || index >= lines.length) {
        chrome.storage.local.set({ stopSearch: true, searchCount: 0 });
        return;
    }
    
    chrome.storage.local.get("stopSearch", function (data) {
        if (data.stopSearch) return;

        let searchText = lines[index].trim();
        if (searchText === "") {
            chrome.storage.local.set({ currentIndex: index + 1, searchCount: count });
            executeSearch(lines, index + 1, count);
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0) return;
            let tabId = tabs[0].id;

            typeSearchQuery(tabId, searchText, 0, function () {
                setTimeout(() => {
                    chrome.storage.local.get("stopSearch", function (data) {
                        if (!data.stopSearch) {
                            chrome.storage.local.set({ currentIndex: index + 1, searchCount: count + 1 });
                            executeSearch(lines, index + 1, count + 1);
                        }
                    });
                }, 10000);
            });
        });
    });
}
