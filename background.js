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

// Scraping logic (uses html2pdf.js for automatic PDF download)
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
    <p>${about || "N/A"}</p>
    <h2>Experience</h2>
    <ul>${experiences.map(exp => `<li>${exp}</li>`).join('')}</ul>
    <h2>Education</h2>
    <ul>${education.map(edu => `<li>${edu}</li>`).join('')}</ul>
  `;

  // Create a container for html2pdf
  const container = document.createElement('div');
  container.innerHTML = content;
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.padding = '40px';
  document.body.appendChild(container);

  // Use html2pdf to generate and download PDF
  html2pdf()
    .set({
      margin: 0.5,
      filename: `${name ? name.replace(/\s+/g, '_') : 'profile'}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    })
    .from(container)
    .save()
    .then(() => {
      document.body.removeChild(container);
    });
}
