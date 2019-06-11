/**
 Create a panel, and add listeners for panel show/hide events.
 */
try {
    chrome.devtools.panels.create(
        "pttools",
        "/icons/icon.png",
        "/html/pt_dev.html"
    );
} catch (e) {
}
