import { ZODIAC_SIGNS } from '../chartCalculator.js';

/**
 * Renders the HTML Setup Page for the Astrology Plugin iframe.
 */
export function renderSetupPage({ userId = '', installationId = '', existingConfig = {} }) {
    const signsOptions = ZODIAC_SIGNS.map(s => `<option value="${s.name}">${s.name} (${s.sanskrit})</option>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Astrology & Kundli Plugin Setup</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo-icon {
      font-size: 32px;
      margin-bottom: 8px;
      display: inline-block;
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 700;
      color: #fafafa;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 13px;
      color: #a1a1aa;
      margin-top: 4px;
    }
    .transparency-banner {
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%);
      border: 1px solid rgba(168, 85, 247, 0.25);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    .transparency-title {
      font-size: 12px;
      font-weight: 600;
      color: #c084fc;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .transparency-text {
      font-size: 12px;
      color: #d4d4d8;
    }
    .form-group {
      margin-bottom: 18px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #e4e4e7;
      margin-bottom: 6px;
    }
    .label-hint {
      font-size: 11px;
      color: #71717a;
      font-weight: 400;
    }
    input[type="text"], input[type="date"], input[type="time"], select {
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 12px;
      color: #f4f4f5;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, select:focus {
      border-color: #a855f7;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      margin-bottom: 12px;
      cursor: pointer;
    }
    .toggle-row input {
      accent-color: #a855f7;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .toggle-label {
      font-size: 13px;
      color: #d4d4d8;
      cursor: pointer;
    }
    .info-note {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      color: #a1a1aa;
      margin-top: 6px;
    }
    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
      transition: opacity 0.2s, transform 0.1s;
    }
    .btn-submit:hover {
      opacity: 0.95;
    }
    .btn-submit:active {
      transform: scale(0.99);
    }
    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .success-card {
      display: none;
      background: #18181b;
      border: 1px solid #22c55e;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }
    .success-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .badge {
      display: inline-block;
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 12px;
      margin: 4px;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div class="container">
    <div id="setupFormSection">
      <div class="header">
        <div class="logo-icon">🪐</div>
        <h1>Kundli Astrology Analyzer</h1>
        <p class="subtitle">Personalize astrology videos to your birth chart</p>
      </div>

      <div class="transparency-banner">
        <div class="transparency-title">
          <span>🛡️</span> Why we need your details
        </div>
        <p class="transparency-text">
          Astrology reels discuss general transits (e.g. Saturn in 8th house). To know whether a reel actually affects your career, relationships, or health, we calculate your Vedic natal chart (Lahiri Ayanamsa).
        </p>
      </div>

      <form id="setupForm">
        <input type="hidden" id="userId" value="${userId}">
        <input type="hidden" id="installationId" value="${installationId}">

        <div class="form-group">
          <label for="dob">Date of Birth <span style="color:#ef4444;">*</span></label>
          <input type="date" id="dob" required value="${existingConfig.dob || '1998-07-22'}">
        </div>

        <div class="form-group">
          <label>Birth Time</label>
          <label class="toggle-row">
            <input type="checkbox" id="hasExactTime" ${existingConfig.has_exact_time !== false ? 'checked' : ''}>
            <span class="toggle-label">I know my birth time</span>
          </label>

          <div id="timeFieldContainer">
            <input type="time" id="tob" value="${existingConfig.tob || '14:30'}">
          </div>

          <div id="timeIndependentNote" class="info-note" style="display: none;">
            ✨ <strong>No problem:</strong> We will generate your <em>Chandra Kundali</em> (Moon Chart). In Vedic astrology, planetary transits are traditionally evaluated from your Moon sign.
          </div>
        </div>

        <div class="form-group">
          <label for="placeName">City & Country of Birth</label>
          <input type="text" id="placeName" placeholder="e.g. New Delhi, India" value="${existingConfig.place_name || 'New Delhi, India'}">
        </div>

        <div class="form-group">
          <label for="knownMoonSign">
            Known Moon Sign (Chandra Rashi)
            <span class="label-hint">(Optional — for cross-checking)</span>
          </label>
          <select id="knownMoonSign">
            <option value="">Auto-calculate from date/time</option>
            ${signsOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="geminiApiKey">
            Gemini AI API Key
            <span class="label-hint">(Optional — leave blank to use MemoryStore key)</span>
          </label>
          <input type="text" id="geminiApiKey" placeholder="AIzaSy..." value="${existingConfig.gemini_api_key || ''}">
        </div>

        <button type="submit" id="submitBtn" class="btn-submit">
          Save & Generate Chart
        </button>
      </form>
    </div>

    <div id="successCard" class="success-card">
      <div class="success-icon">✨</div>
      <h2 style="font-size: 18px; margin-bottom: 6px;">Chart Saved & Verified!</h2>
      <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 16px;">
        Your Vedic birth chart has been generated and connected to MemoryStore.
      </p>

      <div id="chartSummaryBadges" style="margin-bottom: 18px;"></div>

      <p style="font-size: 12px; color: #71717a;">
        Closing setup modal and returning to MemoryStore...
      </p>
    </div>
  </div>

  <script>
    const hasExactTimeToggle = document.getElementById('hasExactTime');
    const timeFieldContainer = document.getElementById('timeFieldContainer');
    const timeIndependentNote = document.getElementById('timeIndependentNote');
    const form = document.getElementById('setupForm');
    const submitBtn = document.getElementById('submitBtn');
    const setupSection = document.getElementById('setupFormSection');
    const successCard = document.getElementById('successCard');
    const badgesContainer = document.getElementById('chartSummaryBadges');

    function updateTimeFields() {
      if (hasExactTimeToggle.checked) {
        timeFieldContainer.style.display = 'block';
        timeIndependentNote.style.display = 'none';
      } else {
        timeFieldContainer.style.display = 'none';
        timeIndependentNote.style.display = 'block';
      }
    }

    hasExactTimeToggle.addEventListener('change', updateTimeFields);
    updateTimeFields();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.innerText = 'Calculating Chart & Saving...';

      const payload = {
        userId: document.getElementById('userId').value || 'usr_direct',
        installationId: document.getElementById('installationId').value || '',
        dob: document.getElementById('dob').value,
        tob: document.getElementById('tob').value,
        hasExactTime: hasExactTimeToggle.checked,
        placeName: document.getElementById('placeName').value,
        knownMoonSign: document.getElementById('knownMoonSign').value || null,
        geminiApiKey: document.getElementById('geminiApiKey').value || null
      };

      try {
        const response = await fetch('/api/setup-chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          alert(data.message || 'Could not calculate chart');
          submitBtn.disabled = false;
          submitBtn.innerText = 'Save & Generate Chart';
          return;
        }

        // Render badges
        badgesContainer.innerHTML = \`
          <span class="badge">Lagna: \${data.lagna}</span>
          <span class="badge">Moon: \${data.moonSign}</span>
          <span class="badge">Sun: \${data.sunSign}</span>
        \`;

        setupSection.style.display = 'none';
        successCard.style.display = 'block';

        // Post message to MemoryStore parent window
        const configToStore = {
          profile_id: data.profileId,
          dob: data.dob,
          has_exact_time: data.hasExactTime,
          moon_sign: data.moonSign,
          sun_sign: data.sunSign,
          place_name: data.placeName
        };

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'memorystore:plugin_config',
            config: configToStore
          }, '*');
        }

      } catch (err) {
        alert('Network error: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = 'Save & Generate Chart';
      }
    });
  </script>
</body>
</html>`;
}
