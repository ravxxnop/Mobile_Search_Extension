chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startSearch") {
        startAutoSearch();
    }
});

async function startAutoSearch() {
    let data = await chrome.storage.local.get(["searchLines", "lastIndex"]);
    let searchLines = data.searchLines || [];
    let lastIndex = data.lastIndex || 0;

    if (lastIndex >= searchLines.length) {
        alert("All searches completed!");
        return;
    }

    let searchCount = 0;
    while (lastIndex < searchLines.length && searchCount < 30) {
        let query = searchLines[lastIndex];
        await performSearch(query);
        lastIndex++;
        searchCount++;

        await chrome.storage.local.set({ lastIndex: lastIndex });
    }

    if (searchCount >= 30) {
        alert("Session limit reached (30 searches). Restart extension to continue.");
    }
}

async function performSearch(query) {
    await typeInOmnibox(query);
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 सेकंड वेट
    await clearOmnibox();
}

async function typeInOmnibox(query) {
    let words = query.split(" ");
    let tab = await getActiveTab();

    for (let i = 0; i < words.length; i++) {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: insertOmniboxText,
            args: [words.slice(0, i + 1).join(" ")]
        });
        await new Promise(resolve => setTimeout(resolve, 6000 / words.length)); // टाइपराइटर इफेक्ट
    }

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pressEnter
    });
}

async function clearOmnibox() {
    let tab = await getActiveTab();
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: insertOmniboxText,
        args: [""]
    });
    await new Promise(resolve => setTimeout(resolve, 6000)); // 6 सेकंड का वेट
}

async function getActiveTab() {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

function insertOmniboxText(query) {
    let searchBox = document.querySelector("input[type='text'], input[type='search']");
    if (searchBox) {
        searchBox.value = query;
        searchBox.focus();
    }
}

function pressEnter() {
    let activeElement = document.activeElement;
    if (activeElement) {
        let event = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true });
        activeElement.dispatchEvent(event);
    }
        }
