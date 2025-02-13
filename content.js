// Block WebRTC fingerprinting
Object.defineProperty(navigator, 'mediaDevices', {
    get: () => ({
        getUserMedia: () => Promise.reject(new Error("WebRTC blocked")),
        enumerateDevices: () => Promise.resolve([])
    })
});

console.log("Mobile Search Spoofer Activated");
