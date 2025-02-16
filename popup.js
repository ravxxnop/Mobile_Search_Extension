document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get(["savedScript", "currentIndex"], function (data) {
        if (data.savedScript && data.savedScript.length > 0) {
            document.getElementById('loadScriptButton').disabled = false;
        }
    });
});

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

        chrome.storage.local.set({ savedScript: lines, searchLines: lines, currentIndex: 0 }, function () {
            alert("Script saved permanently! No need to upload again.");
            chrome.runtime.sendMessage({ action: "startSearching" });
        });
    };
    reader.readAsText(file);
});

document.getElementById('stopButton').addEventListener('click', function () {
    chrome.storage.local.set({ stopSearch: true });
});

document.getElementById('loadScriptButton').addEventListener('click', function () {
    chrome.storage.local.get(["savedScript", "currentIndex"], function (data) {
        if (data.savedScript && data.savedScript.length > 0) {
            let resumeIndex = data.currentIndex ?? 0;
            console.log(`Resuming from search #${resumeIndex + 1}`);

            chrome.storage.local.set({
                stopSearch: false,
                searchLines: data.savedScript,
                currentIndex: resumeIndex
            }, function () {
                alert("Script loaded successfully! Resuming search.");
                chrome.runtime.sendMessage({ action: "startSearching" });
            });

        } else {
            alert("No saved script found. Please upload a new file.");
        }
    });
});
