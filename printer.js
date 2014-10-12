var requestButton = document.getElementById("requestPermission");



requestButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({type: 'print', lines: ["first line", "second line", "", "", ""]});
});
