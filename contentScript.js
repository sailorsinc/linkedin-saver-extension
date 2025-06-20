// This script should be injected via scripting API on user click — no host permissions needed

(async function() {
  async function waitForLinkedInContent() {
    // Scroll to bottom to load dynamic content
    window.scrollTo(0, document.body.scrollHeight);

    // Poll for .pvs-list__item elements (robust for experience)
    const maxRetries = 30;
    const interval = 500; // ms
    let retries = 0;

    while (retries < maxRetries) {
      if (document.querySelector('.pvs-list__item')) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
      retries++;
    }
  }

  // Simulate human-like scrolling with events
  async function scrollPageToLoadAllContent() {
    const scrollStep = 150;
    const delay = 600;
    let current = 0;
    const max = document.body.scrollHeight;
    while (current < max) {
      window.scrollTo(0, current);
      // Simulate wheel and scroll events
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new WheelEvent('wheel', {deltaY: scrollStep}));
      await new Promise(resolve => setTimeout(resolve, delay));
      current += scrollStep;
    }
    // Scroll back to top
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Prompt user to scroll manually
  alert('Please scroll through the entire Experience section to load all entries, then click OK to save the profile as PDF.');

  // await scrollPageToLoadAllContent();
  await waitForLinkedInContent();

  const getText = (selector) => {
    const el = document.querySelector(selector);
    return el ? el.innerText.trim() : "";
  };

  const extractExperienceDetails = () => {
    const experienceSection = Array.from(document.querySelectorAll('section')).find(section =>
      section.innerText.trim().toLowerCase().startsWith('experience')
    );
    if (!experienceSection) {
      console.warn('No experience section found');
      return [];
    }
    // Recursively find all nested divs with some text (lower threshold for debugging)
    const allDivs = Array.from(experienceSection.querySelectorAll('div'));
    const items = allDivs.filter(div => {
      const text = div.innerText.trim();
      return text.length > 10 && !div.className.includes('anchor');
    });
    // Log first 5 divs for debugging
    items.slice(0, 5).forEach((div, idx) => {
      console.log(`Div ${idx + 1} text:`, div.innerText.trim());
    });
    console.log('Experience nested divs with text > 10 chars:', items.length);
    if (items.length === 0) {
      // Fallback: extract all text from the experience section
      const fallbackText = experienceSection.innerText.trim();
      if (fallbackText.length > 0) {
        return [`<div style='color:orange;'>Fallback: All experience section text:<br><pre>${fallbackText}</pre></div>`];
      }
      return ['<span style="color:red;">No experience entries found in nested divs or section.</span>'];
    }
    return items.map(item => {
      Array.from(item.querySelectorAll('button, svg, img')).forEach(el => el.remove());
      let lines = item.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      lines = lines.filter((line, idx, arr) => idx === 0 || line !== arr[idx - 1]);
      return `<div style="margin-bottom:12px;white-space:pre-line;">${lines.join('\n')}</div>`;
    });
  };

  const extractEducationDetails = () => {
    const educationSection = Array.from(document.querySelectorAll('section')).find(section =>
      section.innerText.trim().toLowerCase().includes('education')
    );
    if (!educationSection) return [];
    const items = Array.from(educationSection.querySelectorAll('li, .pvs-entity__path-node'));
    return items.map(item => {
      const school = item.querySelector('span[aria-hidden="true"]')?.innerText || '';
      const degree = item.querySelector('.t-14.t-normal')?.innerText || '';
      const date = item.querySelector('.t-14.t-normal.t-black--light')?.innerText || '';
      return { school, degree, date };
    }).filter(edu => edu.school);
  };

  const name = getText('h1');
  const headline = getText('.text-body-medium.break-words');
  const location = getText('.text-body-small.inline.t-black--light.break-words');

  const aboutSection = Array.from(document.querySelectorAll('section')).find(section =>
    section.innerText.trim().toLowerCase().startsWith("about")
  );
  const about = aboutSection ? aboutSection.innerText.replace(/^about/i, '').trim() : "";

  const experiences = extractExperienceDetails();
  const experienceHtml = experiences.length ? experiences.join('') : '<p style="color:red;">No experience details found. (Check LinkedIn DOM or try again after scrolling the page.)</p>';

  const education = extractEducationDetails();
  const educationHtml = education.length ? `<ul>${education.map(edu =>
    `<li><strong>${edu.school}</strong>${edu.degree ? ' - ' + edu.degree : ''}<br>${edu.date}</li>`
  ).join('')}</ul>` : '<p>N/A</p>';

  const content = `
    <h1>${name || "No Name"}</h1>
    <h3>${headline || ""}</h3>
    <p><strong>Location:</strong> ${location || ""}</p>
    <hr/>
    <h2>About</h2>
    <p>${about || "N/A"}</p>
    <h2>Experience</h2>
    ${experienceHtml}
    <h2>Education</h2>
    ${educationHtml}
  `;

  const container = document.createElement('div');
  container.innerHTML = content;
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.padding = '40px';
  document.body.appendChild(container);

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
})();
