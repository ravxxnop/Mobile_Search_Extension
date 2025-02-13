chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
        "id": 1,
        "priority": 1,
        "action": {
            "type": "modifyHeaders",
            "requestHeaders": [
                { "header": "User-Agent", "operation": "set", "value": "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36" },
                { "header": "Sec-CH-UA-Mobile", "operation": "set", "value": "?1" }
            ]
        },
        "condition": { "urlFilter": "*", "resourceTypes": ["main_frame", "sub_frame"] }
    }],
    removeRuleIds: [1]
});
