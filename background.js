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
    } else if (message.action === "saveScriptPrompt") {
        let userConsent = confirm("क्या आप इस स्क्रिप्ट को सेव करना चाहते हैं?");
        if (userConsent) {
            chrome.storage.local.set({ savedScript: message.script });
            alert("स्क्रिप्ट सेव हो गई!");
        }
    } else if (message.action === "loadScript") {
        chrome.storage.local.get(["savedScript"], function (data) {
            sendResponse({ script: data.savedScript || "" });
        });
        return true;
    }
});

function executeSearch(lines, index, searchedQueries) {
    chrome.storage.local.get(["stopSearch", "searchCount", "searchedQueries"], function (data) {
        if (data.stopSearch || index >= lines.length || (data.searchCount || 0) >= 30) return;

        let searchText = lines[index].trim();

        if (searchedQueries.includes(searchText) || searchText === "") {
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

function typeSearchQuery(tabId, text, charIndex, callback) {
    chrome.storage.local.get("stopSearch", function (data) {
        if (data.stopSearch) return;

        if (charIndex >= text.length) {
            setTimeout(() => {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: searchGoogle
                });
                setTimeout(() => {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: clearSearchField
                    });
                    callback();
                }, 6000);
            }, 6000);
            return;
        }

        let partialText = text.substring(0, charIndex + 1);
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: updateSearchField,
            args: [partialText]
        });

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

function clearSearchField() {
    let searchBox = document.querySelector("input[name='q'], textarea[name='q']");
    if (searchBox) {
        searchBox.value = "";
        searchBox.dispatchEvent(new Event('input', { bubbles: true }));
    }
}
