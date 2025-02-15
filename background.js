chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ searchLines: [], currentIndex: 0, stopSearch: false, searchCount: 0, searchedQueries: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startSearching") {
        chrome.storage.local.get(["searchLines", "currentIndex", "stopSearch", "searchCount", "searchedQueries"], function (data) {
            if (data.stopSearch || (data.searchCount || 0) >= 30) return;
            if (data.searchLines && data.searchLines.length > 0) {
                executeSearch(data.searchLines, data.currentIndex, data.searchedQueries);
            }
        });
    }
});

function executeSearch(lines, index, searchedQueries) {
    chrome.storage.local.get(["stopSearch", "searchCount", "searchedQueries"], function (data) {
        if (data.stopSearch || index >= lines.length || (data.searchCount || 0) >= 30) return;

        let searchText = lines[index].trim();

        // अगर यह सर्च पहले हो चुकी है तो स्किप करें
        if (searchedQueries.includes(searchText)) {
            chrome.storage.local.set({ currentIndex: index + 1 }, function () {
                executeSearch(lines, index + 1, searchedQueries);
            });
            return;
        }

        if (searchText === "") {
            chrome.storage.local.set({ currentIndex: index + 1 }, function () {
                executeSearch(lines, index + 1, searchedQueries);
            });
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0) return;
            let tabId = tabs[0].id;

            typeSearchQuery(tabId, searchText, 0, function () {
                setTimeout(() => {
                    chrome.storage.local.get(["stopSearch", "searchCount", "searchedQueries"], function (data) {
                        if (!data.stopSearch) {
                            searchedQueries.push(searchText); // सर्च को रिकॉर्ड करें
                            chrome.storage.local.set({ 
                                currentIndex: index + 1, // सही से currentIndex सेव होगा
                                searchCount: (data.searchCount || 0) + 1,
                                searchedQueries: searchedQueries
                            }, function () {
                                executeSearch(lines, index + 1, searchedQueries);
                            });
                        }
                    });
                }, 10000);
            });
        });
    });
}
