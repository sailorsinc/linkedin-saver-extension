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
            // Send message to extension background/popup
            chrome.runtime.sendMessage({ type: 'LINKEDIN_SAVE_RESUME' });
        };

        document.body.appendChild(btn);
    }
})();
