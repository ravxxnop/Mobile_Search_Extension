// Auto-resume on browser restart
chrome.runtime.onStartup.addListener(() => autoResumeSearch());
chrome.runtime.onInstalled.addListener(() => autoResumeSearch());

function autoResumeSearch() {
    chrome.storage.local.get(["searchLines", "currentIndex", "stopSearch"], (data) => {
        if (data.searchLines && !data.stopSearch) {
            console.log("Auto-resuming from index:", data.currentIndex);
            executeSearch(data.searchLines, data.currentIndex || 0);
        }
    });
}

// Message Listener
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startSearching") {
        chrome.storage.local.get(["searchLines", "currentIndex", "stopSearch"], (data) => {
            if (data.searchLines && !data.stopSearch) {
                executeSearch(data.searchLines, data.currentIndex || 0);
            }
        });
    }
});

function executeSearch(lines, index) {
    chrome.storage.local.get(["stopSearch", "searchCount"], (data) => {
        if (data.stopSearch || (data.searchCount || 0) >= 30) return;
        if (lines.length === 0) return console.log("No search terms!");
        
        index = index >= lines.length ? 0 : index;
        let searchText = lines[index].trim();
        if (!searchText) return executeSearch(lines, index + 1);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length) return console.log("No active tab");
            let tabId = tabs[0].id;

            typeSearchQuery(tabId, searchText, 0, () => {
                setTimeout(() => {
                    let nextIndex = (index + 1) % lines.length;
                    chrome.storage.local.set({
                        currentIndex: nextIndex,
                        searchCount: (data.searchCount || 0) + 1
                    }, () => executeSearch(lines, nextIndex));
                }, 10000);
            });
        });
    });
}

function typeSearchQuery(tabId, text, charIndex, callback) {
    chrome.storage.local.get("stopSearch", (data) => {
        if (data.stopSearch) return;

        if (charIndex >= text.length) {
            setTimeout(() => {
                chrome.storage.local.get("stopSearch", (stopData) => {
                    if (stopData.stopSearch) return;
                    chrome.scripting.executeScript({ target: { tabId }, func: searchGoogle });
                    setTimeout(callback, 6000);
                });
            }, 6000);
            return;
        }

        chrome.scripting.executeScript({
            target: { tabId },
            func: updateSearchField,
            args: [text.substring(0, charIndex + 1)]
        });

        setTimeout(() => typeSearchQuery(tabId, text, charIndex + 1, callback), 600);
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
