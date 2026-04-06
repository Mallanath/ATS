chrome.runtime.onMessage.addListener(function(request, sender) {
    chrome.tabs.update(sender.tab.id, {url: request.redirect});
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.tabs.create({ url: "https://www.joinrelay.app/blocker-installed" });
    }

    chrome.runtime.setUninstallURL("https://www.joinrelay.app/blocker-uninstalled");
  });
  