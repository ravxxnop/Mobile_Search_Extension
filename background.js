chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["searchLines", "currentIndex", "stopSearch", "searchCount", "searchedQueries"], function (data) {
        chrome.storage.local.set({
            searchLines: data.searchLines || [],
            currentIndex: data.currentIndex || 0,
            stopSearch: data.stopSearch || false,
            searchCount: data.searchCount || 0,
            searchedQueries: data.searchedQueries || []
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startSearching") {
        chrome.storage.local.get(["searchLines", "currentIndex", "stopSearch", "searchCount", "searchedQueries"], function (data) {
            if (data.stopSearch || (data.searchCount || 0) >= 30) return;
            if (data.searchLines && data.searchLines.length > 0) {
                executeSearch(data.searchLines, data.currentIndex, data.searchedQueries);
            }
        });
    } else if (message.action === "loadScript") {
        chrome.storage.local.get(["searchLines", "currentIndex"], function (data) {
            sendResponse({ script: data.searchLines || [], currentIndex: data.currentIndex || 0 });
        });
        return true;
    }
});

function executeSearch(lines, index, searchedQueries) {
    chrome.storage.local.get(["stopSearch", "searchCount", "searchedQueries"], function (data) {
        if (data.stopSearch || index >= lines.length || (data.searchCount || 0) >= 30) return;

        let searchText = lines[index].trim();

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
                            searchedQueries.push(searchText);
                            chrome.storage.local.set({ 
                                currentIndex: index + 1, 
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
