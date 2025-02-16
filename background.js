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
        if (data.stopSearch || (data.searchCount || 0) >= 30) return;

        if (index >= lines.length) {
            index = 0; // Restart search from beginning
        }

        let searchText = lines[index].trim();
        if (searchText === "") {
            executeSearch(lines, index + 1);
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0) return;
            let tabId = tabs[0].id;

            typeSearchQuery(tabId, searchText, 0, function () {
                setTimeout(function () {
                    let nextIndex = index + 1;
                    let nextSearchCount = (data.searchCount || 0) + 1;

                    if (nextIndex >= lines.length) {
                        nextIndex = 0; // Loop back to start
                    }

                    chrome.storage.local.set({
                        currentIndex: nextIndex,
                        searchCount: nextSearchCount
                    }, function () {
                        executeSearch(lines, nextIndex);
                    });
                }, 10000);
            });
        });
    });
}

function typeSearchQuery(tabId, text, charIndex, callback) {
    chrome.storage.local.get("stopSearch", function (data) {
        if (data.stopSearch) return;

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
