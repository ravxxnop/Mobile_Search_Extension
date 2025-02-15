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

        let saveConfirm = confirm("क्या आप इस स्क्रिप्ट को सेव करना चाहते हैं?");
        if (saveConfirm) {
            chrome.storage.local.set({ savedScript: lines, searchLines: lines, currentIndex: 0 });
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

document.getElementById('loadScriptButton').addEventListener('click', function () {
    chrome.storage.local.get(["savedScript", "currentIndex"], function (data) {
        if (data.savedScript && data.savedScript.length > 0) {
            const fileContent = data.savedScript.join("\n");
            const blob = new Blob([fileContent], { type: "text/plain" });
            const file = new File([blob], "saved_script.txt", { type: "text/plain" });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            document.getElementById('fileInput').files = dataTransfer.files;

            alert(`Script loaded successfully! Resuming from search #${(data.currentIndex || 0) + 1}`);
            chrome.storage.local.set({ stopSearch: false }, function () {
                chrome.runtime.sendMessage({ action: "startSearching" });
            });
        } else {
            alert("No script saved.");
        }
    });
});
