chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "startSearching") {
        chrome.storage.local.get(["searchLines", "currentIndex", "stopSearch", "searchCount"], function (data) {
            if (data.searchLines && !data.stopSearch) {
                executeSearch(data.searchLines, data.currentIndex || 0);
            }
        });
    }
});

function executeSearch(lines, index) {
    chrome.storage.local.get(["stopSearch", "searchCount"], function (data) {
        let stopSearch = data.stopSearch || false;
        let searchCount = data.searchCount || 0;

        if (stopSearch || searchCount >= 30) return;

        if (index >= lines.length) {
            index = 0;
        }

        let searchText = lines[index].trim();
        if (searchText === "") {
            executeSearch(lines, index + 1);
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0) return;
            let tab = tabs[0];

            if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) {
                console.log("Invalid tab detected. Cannot search on chrome:// or edge:// pages.");
                return;
            }

            let tabId = tab.id;
            typeSearchQuery(tabId, searchText, 0, function () {
                setTimeout(function () {
                    chrome.storage.local.set({
                        currentIndex: index + 1, 
                        searchCount: searchCount + 1
                    }, function () {
                        executeSearch(lines, index + 1);
                    });
                }, 10000);
            });
        });
    });
}

function typeSearchQuery(tabId, text, charIndex, callback) {
    chrome.storage.local.get("stopSearch", function (data) {
        let stopSearch = data.stopSearch || false;
        if (stopSearch) return;

        if (charIndex >= text.length) {
            setTimeout(() => {
                chrome.scripting.executeScript({ target: { tabId: tabId }, func: searchGoogle });
                setTimeout(callback, 6000);
            }, 6000);
            return;
        }

        let partialText = text.substring(0, charIndex + 1);
        chrome.scripting.executeScript({ target: { tabId: tabId }, func: updateSearchField, args: [partialText] });

        setTimeout(() => {
            typeSearchQuery(tabId, text, charIndex + 1, callback);
        }, 600);
    });
}

function updateSearchField(text) {
    let searchBox = document.querySelector("input[name='q'], textarea[name='q']");
    if (searchBox) {
        searchBox.value = text;
        searchBox.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

function searchGoogle() {
    let searchBox = document.querySelector("input[name='q'], textarea[name='q']");
    if (searchBox) {
        let form = searchBox.closest("form");
        if (form) form.submit();
    }
}
