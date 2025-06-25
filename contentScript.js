// This script should be injected via scripting API on user click — no host permissions needed

(async function() {
  // Wait for DOMContentLoaded if not already loaded
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }

  // Auto-expand all "See more" buttons
  document.querySelectorAll('button').forEach(btn => {
    if (btn.innerText.toLowerCase().includes('see more')) btn.click();
  });

  // Extract profile photo
  const photoUrl = document.querySelector('.pv-top-card-profile-picture img')?.src || '';

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

  // Prompt user to scroll manually and wait for confirmation
  alert(
    'IMPORTANT: Please manually scroll through the entire LinkedIn profile, especially the Experience and Education sections, to ensure all entries are loaded. Expand any multi-role companies and click "See more" as needed. Then click OK to continue.'
  );

  // await scrollPageToLoadAllContent();
  await waitForLinkedInContent();

  // Debug overlay
  const debugOverlay = document.createElement('div');
  debugOverlay.style.position = 'fixed';
  debugOverlay.style.top = '0';
  debugOverlay.style.left = '0';
  debugOverlay.style.width = '100vw';
  debugOverlay.style.background = 'rgba(255,255,0,0.95)';
  debugOverlay.style.color = '#222';
  debugOverlay.style.fontSize = '16px';
  debugOverlay.style.zIndex = 1000000;
  debugOverlay.style.padding = '8px 16px';
  debugOverlay.style.borderBottom = '2px solid #0073b1';
  debugOverlay.textContent = 'LinkedIn Saver: Extracting profile...';
  document.body.appendChild(debugOverlay);

  function setDebug(msg) {
    debugOverlay.textContent = 'LinkedIn Saver: ' + msg;
  }

  const getText = (selector) => {
    const el = document.querySelector(selector);
    const val = el ? el.innerText.trim() : "";
    setDebug(`Extracted [${selector}]: ${val ? val.slice(0, 40) : '[empty]'}`);
    return val;
  };

  const extractExperienceDetails = () => {
    // Find the Experience section
    const experienceSection = Array.from(document.querySelectorAll('section')).find(section =>
      section.innerText.trim().toLowerCase().startsWith('experience')
    );
    if (!experienceSection) {
      setDebug('No experience section found');
      return [];
    }

    // Select all deeply nested experience items
    const allDivs = Array.from(experienceSection.querySelectorAll('.pvs-list__item'));
    const items = allDivs.map(div => {
      // Remove interactive elements for clean text
      Array.from(div.querySelectorAll('button, svg, img')).forEach(el => el.remove());
      const lines = div.innerText.split('\n').map(line => line.trim()).filter(Boolean);

      // Heuristics to capture job title, company and dates, handling multi-role entries
      let title = '', company = '', dates = '';
      if (lines.length >= 3) {
        [title, company, ...rest] = lines;
        dates = rest.join(' ');
      } else if (lines.length === 2) {
        [title, company] = lines;
      } else if (lines.length === 1) {
        [title] = lines;
      }

      // Fallbacks: try to filter out lines that look like location or description
      // Only keep first 3 non-empty lines as a last resort
      if (!title && lines.length) title = lines[0];
      if (!company && lines.length > 1) company = lines[1];
      if (!dates && lines.length > 2) dates = lines.slice(2).join(' ');

      return {
        title: title || '',
        company: company || '',
        dates: dates || ''
      };
    }).filter(item => item.title && item.company);

    setDebug(`Structured ${items.length} experience items`);
    return items;
  };

  const extractEducationDetails = () => {
    const educationSection = Array.from(document.querySelectorAll('section')).find(section =>
      section.innerText.trim().toLowerCase().includes('education')
    );
    if (!educationSection) {
      setDebug('No education section found');
      return [];
    }
    const items = Array.from(educationSection.querySelectorAll('li, .pvs-entity__path-node'));
    if (items.length === 0) {
      setDebug('No education entries found in section.');
    }
    return items.map(item => {
      const school = item.querySelector('span[aria-hidden="true"]')?.innerText || '';
      const degree = item.querySelector('.t-14.t-normal')?.innerText || '';
      const date = item.querySelector('.t-14.t-normal.t-black--light')?.innerText || '';
      setDebug(`Education entry: ${school} ${degree}`);
      return { school, degree, date };
    }).filter(edu => edu.school);
  };

  let name = getText('h1');
  let headline = getText('.text-body-medium.break-words');
  let location = getText('.text-body-small.inline.t-black--light.break-words');

  const aboutSection = Array.from(document.querySelectorAll('section')).find(section =>
    section.innerText.trim().toLowerCase().startsWith("about")
  );
  let about = aboutSection ? aboutSection.innerText.replace(/^about/i, '').trim() : "";
  setDebug('About: ' + (about ? about.slice(0, 40) : '[empty]'));

  // Remove duplicate experience entries before rendering
  let experienceData = extractExperienceDetails();
  let experienceHtml = experienceData.map(exp => `
    <div style="margin-bottom: 18px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
      <div style="display:flex; justify-content:space-between;">
        <div style="font-weight: bold; font-size: 16px;">${exp.title}</div>
        <div style="font-size: 13px; color: #888;">${exp.dates}</div>
      </div>
      <div style="color: #333;"><em>${exp.company}</em></div>
    </div>
  `).join('');

  let education = extractEducationDetails();
  let educationHtml = education.length ? education.map(edu => `
    <div style="margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between;">
        <strong>${edu.school}</strong>
        <span style="font-size:13px;color:#666;">${edu.date}</span>
      </div>
      ${edu.degree ? `<div>${edu.degree}</div>` : ''}
    </div>
  `).join('') : '<p style="color:red;">No education details found.</p>';

  // Fallback: If all main fields are empty, dump the body text
  let fallback = false;
  if (!name && !headline && !about && !experienceHtml && !educationHtml) {
    fallback = true;
    setDebug('Fallback: No main fields found, dumping body text.');
    name = 'Profile Extraction Failed';
    headline = '';
    about = '';
    experienceHtml = `<pre style='color:red;'>${document.body.innerText.slice(0, 2000)}</pre>`;
    educationHtml = '';
  }

  const content = `
  <div style="display: flex; flex-direction: row; gap: 40px; max-width: 1000px; margin: auto;">
    <div style="flex: 1; min-width: 260px;">
      ${photoUrl ? `<img src="${photoUrl}" alt="Profile Photo" style="width:120px;height:120px;border-radius:50%;margin-bottom:20px;">` : ''}
      <h1 style="margin: 0 0 10px; font-size: 2rem; font-weight: bold;">${name || "No Name"}</h1>
      <h3 style="margin: 0 0 10px; color: #444; font-weight: 500;">${headline || ""}</h3>
      <p style="margin: 0 0 10px; color: #555;"><strong>Location:</strong> ${location || ""}</p>
      <h2 style="margin-top: 30px; font-size: 1.3rem;">About</h2>
      <p style="color: #333; margin-bottom: 30px;">${about || "N/A"}</p>
    </div>
    <div style="flex: 2; min-width: 340px;">
      <h2 style="font-size: 1.3rem; margin-bottom: 10px;">Experience</h2>
      ${experienceHtml || '<p style="color:red;">No experience details found.</p>'}
      <h2 style="margin-top: 30px; font-size: 1.3rem; margin-bottom: 10px;">Education</h2>
      ${educationHtml || '<p style="color:red;">No education details found.</p>'}
      ${fallback ? '<div style="color:red;">[Fallback: Dumped body text]</div>' : ''}
    </div>
  </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = content;
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.padding = '40px';
  container.style.border = '2px dashed #0073b1';
  container.style.background = '#fff';
  container.style.position = 'static';
  container.style.maxWidth = '800px';
  container.style.margin = '40px auto';
  container.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
  container.style.display = 'block';
  document.body.appendChild(container);

  setDebug('Extraction complete. Preview shown.');

  // Show a confirmation popup before generating the PDF
  if (!confirm('Ready to save the profile as PDF?')) {
    document.body.removeChild(container);
    document.body.removeChild(debugOverlay);
    return;
  }

  if (typeof html2pdf === 'undefined') {
    alert('PDF library (html2pdf) is not loaded. Please try again.');
    document.body.removeChild(container);
    document.body.removeChild(debugOverlay);
    return;
  }

  // Hide all other body children except the container
  const originalDisplay = [];
  Array.from(document.body.children).forEach(child => {
    if (child !== container && child !== debugOverlay) {
      originalDisplay.push([child, child.style.display]);
      child.style.display = 'none';
    }
  });

  // Force reflow
  container.offsetHeight;
  container.scrollIntoView({behavior: 'auto', block: 'center'});

  setDebug('Generating PDF...');
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
      // Restore all hidden elements
      originalDisplay.forEach(([child, display]) => { child.style.display = display; });
      document.body.removeChild(container);
      document.body.removeChild(debugOverlay);
    });
})();
