document.getElementById('save').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['lib/html2pdf.bundle.min.js']
    }, () => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['contentScript.js']
      });
    });
  });
});

// Listen for messages from content script (floating button)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LINKEDIN_SAVE_RESUME') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['lib/html2pdf.bundle.min.js']
      }, () => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['contentScript.js']
        });
      });
    });
  }
});