import { ZODIAC_SIGNS } from '../chartCalculator.js';

/**
 * Renders the Interactive Multi-Step Setup Page for MemoryStore iframe modal.
 */
export function renderSetupPage({ userId = '', installationId = '', existingConfig = {}, queryGeminiKey = '', hasAiKey = false }) {
    const signsOptions = ZODIAC_SIGNS.map(s => `<option value="${s.name}">${s.name} (${s.sanskrit})</option>`).join('');

    const prefilledGeminiKey = existingConfig.gemini_api_key || queryGeminiKey || '';
    const isAiKeyAlreadyAvailable = Boolean(hasAiKey || prefilledGeminiKey);

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
      padding: 20px;
      line-height: 1.5;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 480px;
    }
    .header {
      text-align: center;
      margin-bottom: 18px;
    }
    .logo-icon {
      font-size: 28px;
      margin-bottom: 4px;
      display: inline-block;
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 19px;
      font-weight: 700;
      color: #fafafa;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 12px;
      color: #a1a1aa;
      margin-top: 2px;
    }

    /* Progress Bar */
    .progress-container {
      margin-bottom: 20px;
    }
    .progress-track {
      height: 4px;
      background: #27272a;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-fill {
      height: 100%;
      width: 33.33%;
      background: linear-gradient(90deg, #9333ea, #a855f7);
      transition: width 0.3s ease;
    }
    .step-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #71717a;
      font-weight: 500;
    }
    .step-label.active {
      color: #c084fc;
      font-weight: 600;
    }

    /* Wizard Step Cards */
    .step-card {
      display: none;
      animation: fadeIn 0.25s ease forwards;
    }
    .step-card.active {
      display: block;
    }

    .transparency-banner {
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%);
      border: 1px solid rgba(168, 85, 247, 0.25);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 18px;
    }
    .transparency-title {
      font-size: 12px;
      font-weight: 600;
      color: #c084fc;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .transparency-text {
      font-size: 12px;
      color: #d4d4d8;
      line-height: 1.4;
    }

    .form-group {
      margin-bottom: 16px;
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
      font-size: 13px;
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
      margin-bottom: 10px;
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

    /* What you get vs what is unavailable */
    .disclosure-box {
      background: #121214;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 12px;
      margin-top: 10px;
      font-size: 12px;
    }
    .disclosure-header {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .disclosure-section {
      margin-bottom: 8px;
    }
    .disclosure-section:last-child {
      margin-bottom: 0;
    }
    .avail-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
      color: #e4e4e7;
    }
    .avail-icon {
      color: #4ade80;
      font-size: 12px;
      line-height: 1.4;
    }
    .unavail-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
      color: #a1a1aa;
    }
    .unavail-icon {
      color: #f87171;
      font-size: 12px;
      line-height: 1.4;
    }

    /* AI Key Status Badges */
    .ai-detected-card {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      margin-bottom: 16px;
    }
    .ai-detected-title {
      font-size: 13px;
      font-weight: 600;
      color: #4ade80;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .ai-detected-desc {
      font-size: 12px;
      color: #a1a1aa;
    }

    .btn-row {
      display: flex;
      gap: 10px;
      margin-top: 18px;
    }
    .btn-primary {
      flex: 1;
      background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
      color: #ffffff;
      border: none;
      border-radius: 9px;
      padding: 11px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.95; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-secondary {
      background: #27272a;
      color: #d4d4d8;
      border: 1px solid #3f3f46;
      border-radius: 9px;
      padding: 11px 18px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-secondary:hover { background: #3f3f46; }

    /* Success Card */
    .success-card {
      display: none;
      background: #18181b;
      border: 1px solid #22c55e;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }
    .success-icon { font-size: 36px; margin-bottom: 8px; }
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
    
    <div class="header">
      <div class="logo-icon">🪐</div>
      <h1>Kundli Astrology Analyzer</h1>
      <p class="subtitle">Personalize astrology videos to your Vedic chart</p>
    </div>

    <!-- Progress Indicator -->
    <div id="progressContainer" class="progress-container">
      <div class="progress-track">
        <div id="progressFill" class="progress-fill"></div>
      </div>
      <div class="step-labels">
        <span id="stepLabel1" class="step-label active">1. Birth & Time</span>
        <span id="stepLabel2" class="step-label">2. City & Rashi</span>
        <span id="stepLabel3" class="step-label">3. AI Engine</span>
      </div>
    </div>

    <form id="wizardForm">
      <input type="hidden" id="userId" value="${userId}">
      <input type="hidden" id="installationId" value="${installationId}">

      <!-- ================= STEP 1: Date & Time ================= -->
      <div id="stepCard1" class="step-card active">
        <div class="transparency-banner">
          <div class="transparency-title">
            <span>🛡️</span> Step 1 of 3: Birth Details
          </div>
          <p class="transparency-text">
            Astrology reels discuss transit shifts. We compute your Vedic chart so you know if a reel affects your life areas.
          </p>
        </div>

        <div class="form-group">
          <label for="dob">Date of Birth <span style="color:#ef4444;">*</span></label>
          <input type="date" id="dob" required value="${existingConfig.dob || '1998-07-22'}">
        </div>

        <div class="form-group">
          <label>Birth Time</label>
          <label class="toggle-row">
            <input type="checkbox" id="hasExactTime" ${existingConfig.has_exact_time !== false ? 'checked' : ''}>
            <span class="toggle-label">I know my exact birth time</span>
          </label>

          <div id="timeFieldContainer">
            <input type="time" id="tob" value="${existingConfig.tob || '14:30'}">
          </div>

          <!-- Trade-off Disclosure for Unknown Birth Time -->
          <div id="unknownTimeDisclosure" class="disclosure-box" style="display: none;">
            <div class="disclosure-header" style="color: #c084fc;">
              ✨ Chandra Kundali (Moon Chart) Mode
            </div>
            
            <div class="disclosure-section">
              <div style="font-size: 11px; font-weight: 600; color: #4ade80; margin-bottom: 4px; text-transform: uppercase;">
                ✓ What you will get:
              </div>
              <div class="avail-item">
                <span class="avail-icon">●</span>
                <span><strong>Planetary Transit Analysis (Gochar):</strong> Vedic astrology traditionally evaluates transits from the Moon sign.</span>
              </div>
              <div class="avail-item">
                <span class="avail-icon">●</span>
                <span><strong>Video Claims Verification:</strong> Relevance scoring for transits (Saturn, Jupiter, Rahu/Ketu).</span>
              </div>
              <div class="avail-item">
                <span class="avail-icon">●</span>
                <span><strong>Custom Remedies:</strong> Moon-based astrological & practical actions.</span>
              </div>
            </div>

            <div class="disclosure-section" style="margin-top: 8px; border-top: 1px solid #27272a; pt-2;">
              <div style="font-size: 11px; font-weight: 600; color: #f87171; margin-bottom: 4px; text-transform: uppercase;">
                ⚠️ What cannot be generated without time:
              </div>
              <div class="unavail-item">
                <span class="unavail-icon">✕</span>
                <span><strong>Ascendant (Lagna / 1st House):</strong> Lagna changes every 2 hours; cannot pinpoint rising house.</span>
              </div>
              <div class="unavail-item">
                <span class="unavail-icon">✕</span>
                <span><strong>Minute-level Navamsha (D9):</strong> Requires exact minute timing.</span>
              </div>
              <div class="unavail-item">
                <span class="unavail-icon">✕</span>
                <span><strong>Micro Dasha Sub-periods:</strong> Only general Mahadashas will be referenced.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <button type="button" class="btn-primary" onclick="goToStep(2)">
            Continue to Step 2 →
          </button>
        </div>
      </div>

      <!-- ================= STEP 2: Place & Rashi ================= -->
      <div id="stepCard2" class="step-card">
        <div class="transparency-banner">
          <div class="transparency-title">
            <span>🌍</span> Step 2 of 3: Location & Moon Sign
          </div>
          <p class="transparency-text">
            Geographic coordinates calibrate the local Sidereal horizon and cross-verify your Moon sign.
          </p>
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

        <div class="btn-row">
          <button type="button" class="btn-secondary" onclick="goToStep(1)">← Back</button>
          <button type="button" class="btn-primary" onclick="goToStep(3)">Continue to Step 3 →</button>
        </div>
      </div>

      <!-- ================= STEP 3: Gemini AI Engine ================= -->
      <div id="stepCard3" class="step-card">
        <div class="transparency-banner">
          <div class="transparency-title">
            <span>⚡</span> Step 3 of 3: AI Video Synthesis
          </div>
          <p class="transparency-text">
            Google Gemini powers the synthesis comparing reel transcripts against your natal placements.
          </p>
        </div>

        <div id="aiDetectionContainer">
          ${isAiKeyAlreadyAvailable ? `
            <div class="ai-detected-card">
              <div class="ai-detected-title">
                <span>✓</span> Gemini AI Connected from MemoryStore
              </div>
              <p class="ai-detected-desc">
                Your MemoryStore AI credentials will be used automatically to analyze saved astrology reels.
              </p>
            </div>
          ` : `
            <div class="form-group">
              <label for="geminiApiKey">
                Gemini AI API Key
                <span class="label-hint">(Get free from <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#c084fc;">Google AI Studio</a>)</span>
              </label>
              <input type="text" id="geminiApiKey" placeholder="AIzaSy..." value="${prefilledGeminiKey}">
              <p style="font-size: 11px; color: #71717a; margin-top: 4px;">
                Leave blank if your MemoryStore account already has an AI key configured.
              </p>
            </div>
          `}
        </div>

        <div class="btn-row">
          <button type="button" class="btn-secondary" onclick="goToStep(2)">← Back</button>
          <button type="submit" id="submitBtn" class="btn-primary">
            🪐 Save & Generate Chart
          </button>
        </div>
      </div>
    </form>

    <!-- ================= SUCCESS CARD ================= -->
    <div id="successCard" class="success-card">
      <div class="success-icon">✨</div>
      <h2 style="font-size: 17px; margin-bottom: 6px;">Chart Saved & Verified!</h2>
      <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 14px;">
        Your Vedic birth chart has been generated and connected to MemoryStore.
      </p>

      <div id="chartSummaryBadges" style="margin-bottom: 16px;"></div>

      <p style="font-size: 11px; color: #71717a;">
        Closing setup modal and returning to MemoryStore...
      </p>
    </div>

  </div>

  <script>
    let currentStep = 1;
    const hasExactTimeToggle = document.getElementById('hasExactTime');
    const timeFieldContainer = document.getElementById('timeFieldContainer');
    const unknownTimeDisclosure = document.getElementById('unknownTimeDisclosure');
    const progressFill = document.getElementById('progressFill');
    const form = document.getElementById('wizardForm');
    const submitBtn = document.getElementById('submitBtn');
    const successCard = document.getElementById('successCard');
    const badgesContainer = document.getElementById('chartSummaryBadges');
    const progressContainer = document.getElementById('progressContainer');

    function updateTimeFields() {
      if (hasExactTimeToggle.checked) {
        timeFieldContainer.style.display = 'block';
        unknownTimeDisclosure.style.display = 'none';
      } else {
        timeFieldContainer.style.display = 'none';
        unknownTimeDisclosure.style.display = 'block';
      }
    }

    hasExactTimeToggle.addEventListener('change', updateTimeFields);
    updateTimeFields();

    function goToStep(step) {
      if (step === 2 && !document.getElementById('dob').value) {
        alert('Please enter your Date of Birth to proceed.');
        return;
      }

      currentStep = step;
      document.querySelectorAll('.step-card').forEach((card, idx) => {
        card.classList.toggle('active', idx + 1 === step);
      });

      document.querySelectorAll('.step-label').forEach((label, idx) => {
        label.classList.toggle('active', idx + 1 === step);
      });

      progressFill.style.width = (step / 3 * 100) + '%';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.innerText = 'Calculating Chart & Saving...';

      const geminiInput = document.getElementById('geminiApiKey');
      const payload = {
        userId: document.getElementById('userId').value || 'usr_direct',
        installationId: document.getElementById('installationId').value || '',
        dob: document.getElementById('dob').value,
        tob: hasExactTimeToggle.checked ? document.getElementById('tob').value : '12:00',
        hasExactTime: hasExactTimeToggle.checked,
        placeName: document.getElementById('placeName').value,
        knownMoonSign: document.getElementById('knownMoonSign').value || null,
        geminiApiKey: geminiInput ? (geminiInput.value.trim() || null) : null
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
          submitBtn.innerText = '🪐 Save & Generate Chart';
          return;
        }

        // Render badges
        badgesContainer.innerHTML = \`
          <span class="badge">Lagna: \${data.lagna}</span>
          <span class="badge">Moon: \${data.moonSign}</span>
          <span class="badge">Sun: \${data.sunSign}</span>
        \`;

        form.style.display = 'none';
        progressContainer.style.display = 'none';
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
        submitBtn.innerText = '🪐 Save & Generate Chart';
      }
    });
  </script>
</body>
</html>`;
}
