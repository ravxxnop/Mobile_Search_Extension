document.getElementById('startButton').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert("Please upload a TXT file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        const lines = event.target.result.split('\n').filter(line => line.trim() !== "");

        // स्क्रिप्ट सेव करने के लिए यूज़र से पूछें
        let saveConfirm = confirm("क्या आप इस स्क्रिप्ट को सेव करना चाहते हैं?");
        if (saveConfirm) {
            chrome.storage.local.set({ savedScript: lines });
            alert("स्क्रिप्ट सेव हो गई!");
        }

        chrome.storage.local.set({ searchLines: lines, currentIndex: 0, stopSearch: false, searchCount: 0, searchedQueries: [] }, function () {
            chrome.runtime.sendMessage({ action: "startSearching" });
        });
    };
    reader.readAsText(file);
});

document.getElementById('stopButton').addEventListener('click', function () {
    chrome.storage.local.set({ stopSearch: true });
});

// सेव की गई स्क्रिप्ट को लोड करने का ऑप्शन
document.getElementById('loadScriptButton').addEventListener('click', function () {
    chrome.storage.local.get(["savedScript"], function (data) {
        if (data.savedScript) {
            alert("Loaded script:\n" + data.savedScript.join("\n"));
        } else {
            alert("No script saved.");
        }
    });
});
