document.getElementById('save').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: scrapeAndDownloadPDF
    });
  });
});

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

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${name || "LinkedIn"} Resume</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #0073b1; }
          h2 { margin-top: 30px; color: #333; }
          ul { padding-left: 20px; }
          li { margin-bottom: 10px; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();

  // Wait for DOM to load, then print to PDF
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}