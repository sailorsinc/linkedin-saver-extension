// background.js
// Listen for messages from content script (floating button)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LINKEDIN_SAVE_RESUME') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: scrapeAndDownloadPDF
      });
    });
  }
});

// Scraping logic (copied from popup.js)
function scrapeAndDownloadPDF() {
  const getText = (selector) => {
    const el = document.querySelector(selector);
    return el ? el.innerText.trim() : "";
  };

  const extractListItems = (sectionHeaderText) => {
    const sections = Array.from(document.querySelectorAll('section'));
    const target = sections.find(s => s.innerText.toLowerCase().includes(sectionHeaderText.toLowerCase()));
    if (!target) return [];
    return Array.from(target.querySelectorAll('li')).map(li => li.innerText.trim());
  };

  const name = getText('h1');
  const headline = getText('.text-body-medium.break-words');
  const location = getText('.text-body-small.inline.t-black--light.break-words');

  const aboutSection = Array.from(document.querySelectorAll('section')).find(section =>
    section.innerText.trim().toLowerCase().startsWith("about")
  );
  const about = aboutSection ? aboutSection.innerText.replace(/^about/i, '').trim() : "";

  const experiences = extractListItems('experience');
  const education = extractListItems('education');

  const content = `
    <h1>${name || "No Name"}</h1>
    <h3>${headline || ""}</h3>
    <p><strong>Location:</strong> ${location || ""}</p>
    <hr/>
    <h2>About</h2>
    <p>${about || ""}</p>
    <hr/>
    <h2>Experience</h2>
    <ul>${experiences.map(e => `<li>${e}</li>`).join('')}</ul>
    <hr/>
    <h2>Education</h2>
    <ul>${education.map(e => `<li>${e}</li>`).join('')}</ul>
  `;

  // Download as HTML file (can be changed to PDF with a library)
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name ? name.replace(/\s+/g, '_') : 'profile'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
