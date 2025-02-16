document.addEventListener('DOMContentLoaded', function () {
    // ✅ Check if a saved script exists
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

        // ✅ Save script permanently as "saved.txt"
        chrome.storage.local.set({ 
            savedScript: lines, 
            searchLines: lines, 
            currentIndex: 0, 
            savedFileContent: event.target.result 
        }, function () {
            alert("Script saved as 'saved.txt'! No need to upload again.");
            chrome.runtime.sendMessage({ action: "startSearching" });
        });
    };
    reader.readAsText(file);
});

document.getElementById('stopButton').addEventListener('click', function () {
    chrome.storage.local.set({ stopSearch: true });
});

document.getElementById('loadScriptButton').addEventListener('click', function () {
    chrome.storage.local.get(["savedScript", "savedFileContent", "currentIndex"], function (data) {
        if (data.savedScript && data.savedScript.length > 0) {
            let resumeIndex = data.currentIndex ?? 0;
            console.log(`Resuming from search #${resumeIndex + 1}`);

            // ✅ Recreate "saved.txt" and load into file input
            const blob = new Blob([data.savedFileContent], { type: "text/plain" });
            const file = new File([blob], "saved.txt", { type: "text/plain" });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            document.getElementById('fileInput').files = dataTransfer.files;

            alert("Saved script (saved.txt) loaded successfully!");

            // ✅ Resume search from last saved point
            chrome.storage.local.set({
                stopSearch: false,
                searchLines: data.savedScript,
                currentIndex: resumeIndex
            }, function () {
                chrome.runtime.sendMessage({ action: "startSearching" });
            });

        } else {
            alert("No saved script found. Please upload a new file.");
        }
    });
});
