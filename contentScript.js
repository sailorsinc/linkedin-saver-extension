// contentScript.js
// Injects a floating 'Save as Resume' button on LinkedIn connection profile pages

(function() {
    // Helper: Check if current page is a LinkedIn profile (simple check)
    function isLinkedInProfilePage() {
        // LinkedIn profile URLs typically look like: https://www.linkedin.com/in/username/
        return /^https:\/\/www\.linkedin\.com\/in\//.test(window.location.href);
    }

    // Prevent duplicate button
    if (document.getElementById('linkedin-save-resume-btn')) return;

    if (isLinkedInProfilePage()) {
        // Create button
        const btn = document.createElement('button');
        btn.id = 'linkedin-save-resume-btn';
        btn.innerText = 'Save as Resume';
        btn.style.position = 'fixed';
        btn.style.top = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = '9999';
        btn.style.padding = '12px 20px';
        btn.style.background = '#0073b1';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        btn.style.fontSize = '16px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        btn.style.transition = 'background 0.2s';
        btn.onmouseover = () => btn.style.background = '#005983';
        btn.onmouseout = () => btn.style.background = '#0073b1';

        btn.onclick = function() {
            // Scrape and generate PDF using html2pdf.js
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

            // Extract experience details
            function extractExperienceDetails() {
                const experienceSection = Array.from(document.querySelectorAll('section')).find(section =>
                    section.innerText.trim().toLowerCase().includes('experience')
                );
                if (!experienceSection) return [];
                // Each experience may be in a li or nested divs
                const items = Array.from(experienceSection.querySelectorAll('li, .pvs-entity__path-node'));
                return items.map(item => {
                    // Try to extract title, company, date, location
                    const title = item.querySelector('span[aria-hidden="true"]')?.innerText || '';
                    const company = item.querySelector('.t-14.t-normal')?.innerText || '';
                    const date = item.querySelector('.t-14.t-normal.t-black--light')?.innerText || '';
                    const location = item.querySelector('.t-14.t-normal.t-black--light[aria-hidden="true"]')?.innerText || '';
                    return { title, company, date, location };
                }).filter(exp => exp.title || exp.company);
            }

            // Extract education details
            function extractEducationDetails() {
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
            }

            const name = getText('h1');
            const headline = getText('.text-body-medium.break-words');
            const location = getText('.text-body-small.inline.t-black--light.break-words');

            const aboutSection = Array.from(document.querySelectorAll('section')).find(section =>
                section.innerText.trim().toLowerCase().startsWith("about")
            );
            const about = aboutSection ? aboutSection.innerText.replace(/^about/i, '').trim() : "";

            const experiences = extractExperienceDetails();
            const education = extractEducationDetails();

            // Format for PDF
            const experienceHtml = experiences.length ? `<ul>${experiences.map(exp =>
                `<li><strong>${exp.title}</strong> at ${exp.company}<br>${exp.date}${exp.location ? ' | ' + exp.location : ''}</li>`
            ).join('')}</ul>` : '<p>N/A</p>';

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
        };

        document.body.appendChild(btn);
    }
})();
