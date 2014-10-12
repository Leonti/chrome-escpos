document.addEventListener("hello", function(data) {
    chrome.runtime.sendMessage("test");
    alert("Message received!");
})
