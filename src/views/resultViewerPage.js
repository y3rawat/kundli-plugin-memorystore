/**
 * Renders the Interactive Result Viewer Page for MemoryStore iframe modal
 * with full HTML escaping for security.
 */

function decodeHtmlEntities(str) {
    if (!str) return '';
    return String(str)
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
            try { return String.fromCodePoint(parseInt(code, 16)); } catch { return ''; }
        })
        .replace(/&#([0-9]+);/g, (_, code) => {
            try { return String.fromCodePoint(parseInt(code, 10)); } catch { return ''; }
        })
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const decoded = decodeHtmlEntities(String(str));
    return decoded
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function renderResultViewerPage({ analysis, profile }) {
    if (!analysis) {
        return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Result Not Found</title></head>
<body style="background:#09090b;color:#f4f4f5;font-family:sans-serif;text-align:center;padding:40px;">
  <h2>Analysis Not Found</h2>
  <p style="color:#71717a;">This result may still be processing or has expired.</p>
</body>
</html>`;
    }

    const topic = escapeHtml(analysis.topic || 'Astrological Transit & Chart Analysis');
    const videoClaims = Array.isArray(analysis.videoClaims) ? analysis.videoClaims : [];
    const personalizedImpact = escapeHtml(analysis.personalizedImpact || '');
    const affectedHouses = Array.isArray(analysis.affectedHouses) ? analysis.affectedHouses : [];
    const remedies = Array.isArray(analysis.remedies) ? analysis.remedies : [];
    const matchScore = Number(analysis.matchScore) || 85;
    const verdict = escapeHtml(analysis.verdict || 'Moderate Relevance');
    const takeaway = escapeHtml(analysis.actionableTakeaway || '');

    const isChandraKundali = profile?.has_exact_time === false || profile?.chartMode === 'chandra_kundali' || profile?.chart?.chartMode === 'chandra_kundali';

    const lagna = escapeHtml(profile?.lagna?.sign || profile?.chart?.ascendant?.signName || 'Ascendant');
    const moonSign = escapeHtml(profile?.moon_sign?.sign || profile?.moonSign || 'Moon');
    const sunSign = escapeHtml(profile?.sun_sign?.sign || profile?.sunSign || 'Sun');

    const chartStripHtml = isChandraKundali ? `
      <span style="color:#c084fc;">Mode: <strong>Chandra Kundali (Moon Reference)</strong></span>
      <span>•</span>
      <span>Moon (Rashi): <strong>${moonSign}</strong></span>
      <span>•</span>
      <span>Sun: <strong>${sunSign}</strong></span>
    ` : `
      <span>Lagna: <strong>${lagna}</strong></span>
      <span>•</span>
      <span>Moon: <strong>${moonSign}</strong></span>
      <span>•</span>
      <span>Sun: <strong>${sunSign}</strong></span>
    `;

    const claimsListHtml = videoClaims.map(c => `<li>${escapeHtml(c)}</li>`).join('');
    const remediesListHtml = remedies.map(r => `
      <div class="remedy-item">
        <span class="remedy-icon">✦</span>
        <span>${escapeHtml(r)}</span>
      </div>
    `).join('');

    const housesHtml = affectedHouses.map(h => `
      <div class="house-badge">
        <span class="house-number">House ${escapeHtml(h.house)}</span>
        <span class="house-theme">${escapeHtml(h.theme || '')}</span>
        <span class="house-effect">${escapeHtml(h.effect || 'Active')}</span>
      </div>
    `).join('');

    // Generate North Indian SVG Kundli
    const svgKundli = generateNorthIndianKundliSvg(profile?.chart?.houses || profile?.houses || {});

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic}</title>
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
      line-height: 1.6;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 24px;
      border-bottom: 1px solid #27272a;
      padding-bottom: 16px;
    }
    .badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .score-badge {
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.4);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .verdict-badge {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      font-weight: 700;
      color: #fafafa;
      margin-bottom: 6px;
    }
    .user-chart-strip {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #a1a1aa;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .user-chart-strip span strong {
      color: #e4e4e7;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .claims-list {
      padding-left: 20px;
      color: #d4d4d8;
      font-size: 13px;
    }
    .claims-list li {
      margin-bottom: 6px;
    }
    .impact-text {
      font-size: 14px;
      color: #e4e4e7;
      line-height: 1.7;
    }
    .houses-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .house-badge {
      background: #27272a;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .house-number {
      color: #c084fc;
      font-weight: 600;
    }
    .house-theme {
      color: #d4d4d8;
    }
    .house-effect {
      background: rgba(168, 85, 247, 0.2);
      color: #e9d5ff;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 10px;
    }
    .remedy-item {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      font-size: 13px;
      color: #d4d4d8;
      align-items: flex-start;
    }
    .remedy-icon {
      color: #fbbf24;
      font-size: 14px;
    }
    .takeaway-banner {
      background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
      border: 1px solid rgba(234, 179, 8, 0.3);
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 14px;
      color: #fef08a;
      font-weight: 500;
    }
    .kundli-container {
      text-align: center;
      padding: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge-row">
        <span class="score-badge">${matchScore}% Chart Relevance</span>
        <span class="verdict-badge">${verdict}</span>
      </div>
      <h1>${topic}</h1>
      <div class="user-chart-strip">
        ${chartStripHtml}
      </div>
    </div>

    <!-- Takeaway -->
    ${takeaway ? `
    <div class="takeaway-banner" style="margin-bottom: 20px;">
      💡 <strong>Key Takeaway:</strong> ${takeaway}
    </div>` : ''}

    <!-- Personalized Synthesis -->
    <div class="card">
      <div class="card-title">
        <span>✨</span> Personalized Transit Impact
      </div>
      <p class="impact-text">${personalizedImpact.replace(/\n/g, '<br><br>')}</p>

      ${housesHtml ? `
      <div style="margin-top: 16px;">
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 600;">Active Houses</span>
        <div class="houses-grid">${housesHtml}</div>
      </div>` : ''}
    </div>

    <!-- Kundli Visual -->
    <div class="card">
      <div class="card-title">
        <span>🪐</span> ${isChandraKundali ? 'Chandra Kundali (Moon as 1st House Reference)' : 'Natal Birth Chart (North Indian Lagna Kundli)'}
      </div>
      <div class="kundli-container">
        ${svgKundli}
      </div>
    </div>

    <!-- Video Claims -->
    ${claimsListHtml ? `
    <div class="card">
      <div class="card-title">
        <span>📹</span> What the Video Claimed
      </div>
      <ul class="claims-list">${claimsListHtml}</ul>
    </div>` : ''}

    <!-- Remedies -->
    ${remediesListHtml ? `
    <div class="card">
      <div class="card-title">
        <span>🌿</span> Astrological & Practical Remedies
      </div>
      ${remediesListHtml}
    </div>` : ''}

    <!-- Interactive AI Astrologer Discussion Section -->
    <div class="card" style="border: 1px solid rgba(168, 85, 247, 0.3); background: linear-gradient(180deg, #131316 0%, #0d0d10 100%);">
      <div class="card-title" style="color: #c084fc;">
        <span>💬</span> Discuss This Analysis with Astrology AI
      </div>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 16px;">
        Have questions about this video or how your <strong style="color:#f4f4f5;">${lagna} Lagna</strong> is impacted? Ask Gemini below for personalized insights.
      </p>

      <!-- Quick Prompt Chips -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        <button type="button" class="quick-chip" onclick="askQuickPrompt('How will this planetary transit affect my career and finances?')">💼 Career & Finances</button>
        <button type="button" class="quick-chip" onclick="askQuickPrompt('Can you explain why House 1 and House 9 are activated?')">🪐 Explain Activated Houses</button>
        <button type="button" class="quick-chip" onclick="askQuickPrompt('What specific daily remedies or mantras should I follow?')">✨ Personalized Remedies</button>
      </div>

      <!-- Chat Thread -->
      <div id="chat-thread" style="display: flex; flex-direction: column; gap: 12px; max-height: 360px; overflow-y: auto; margin-bottom: 16px; padding: 4px;">
        <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); padding: 12px 14px; border-radius: 12px; font-size: 13px; color: #e4e4e7; line-height: 1.5;">
          🙏 Namaste! I have reviewed this video against your <strong>${lagna} Lagna</strong> and <strong>${moonSign} Moon</strong> chart. How can I assist you with this analysis?
        </div>
      </div>

      <!-- Input Form -->
      <form id="chat-form" onsubmit="handleSendMessage(event)" style="display: flex; gap: 8px;">
        <input
          type="text"
          id="chat-input"
          placeholder="Ask a question about this transit or your chart..."
          style="flex: 1; background: #1c1c20; border: 1px solid #27272a; border-radius: 10px; padding: 10px 14px; color: #f4f4f5; font-size: 13px; outline: none; transition: border-color 0.2s;"
          onfocus="this.style.borderColor='#a855f7'"
          onblur="this.style.borderColor='#27272a'"
        />
        <button
          type="submit"
          id="chat-submit-btn"
          style="background: linear-gradient(135deg, #a855f7, #7c3aed); border: none; border-radius: 10px; padding: 10px 18px; color: #ffffff; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;"
        >
          Ask
        </button>
      </form>
    </div>
  </div>

  <style>
    .quick-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d4d4d8;
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quick-chip:hover {
      background: rgba(168, 85, 247, 0.15);
      border-color: rgba(168, 85, 247, 0.3);
      color: #c084fc;
    }
  </style>

  <script>
    const resultId = "${escapeHtml(resultId || '')}";
    const conversationHistory = [];

    function askQuickPrompt(text) {
      const input = document.getElementById('chat-input');
      input.value = text;
      handleSendMessage();
    }

    async function handleSendMessage(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('chat-input');
      const submitBtn = document.getElementById('chat-submit-btn');
      const thread = document.getElementById('chat-thread');
      const text = (input.value || '').trim();
      if (!text) return;

      input.value = '';
      submitBtn.disabled = true;
      submitBtn.innerText = 'Thinking...';

      // Append user bubble
      const userBubble = document.createElement('div');
      userBubble.style.cssText = 'background: #27272a; padding: 10px 14px; border-radius: 12px; font-size: 13px; color: #f4f4f5; line-height: 1.5; align-self: flex-end; max-width: 85%;';
      userBubble.innerText = text;
      thread.appendChild(userBubble);
      thread.scrollTop = thread.scrollHeight;

      conversationHistory.push({ role: 'user', content: text });

      // Append loading indicator
      const loadingBubble = document.createElement('div');
      loadingBubble.style.cssText = 'background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); padding: 10px 14px; border-radius: 12px; font-size: 13px; color: #a1a1aa; line-height: 1.5; align-self: flex-start; max-width: 85%;';
      loadingBubble.innerHTML = '<span style="display:inline-block; animation: pulse 1s infinite;">✦ Consulting chart & transit context...</span>';
      thread.appendChild(loadingBubble);
      thread.scrollTop = thread.scrollHeight;

      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resultId,
            message: text,
            conversationHistory
          })
        });

        const data = await resp.json();
        const reply = data.reply || data.error || 'Could not generate answer at this time.';

        loadingBubble.style.color = '#e4e4e7';
        loadingBubble.innerHTML = reply.replace(/\\n/g, '<br/>');
        conversationHistory.push({ role: 'assistant', content: reply });
      } catch (err) {
        loadingBubble.style.color = '#f87171';
        loadingBubble.innerText = 'Connection error. Please try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Ask';
        thread.scrollTop = thread.scrollHeight;
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Helper to render North Indian Kundli chart as an SVG.
 */
function generateNorthIndianKundliSvg(houses) {
    const getPlanetsInHouse = (num) => {
        const h = houses[num] || houses[String(num)];
        if (!h || !Array.isArray(h.planets) || h.planets.length === 0) return '';
        return h.planets.map(p => escapeHtml(p)).join(' ');
    };

    const getSignNum = (num) => {
        const h = houses[num] || houses[String(num)];
        return h?.signNumber || num;
    };

    return `
    <svg viewBox="0 0 300 300" width="100%" style="max-width: 320px; background: #121214; border: 1px solid #27272a; border-radius: 8px;">
      <!-- Outer Square -->
      <rect x="10" y="10" width="280" height="280" fill="none" stroke="#71717a" stroke-width="1.5" />
      
      <!-- Diagonals -->
      <line x1="10" y1="10" x2="290" y2="290" stroke="#71717a" stroke-width="1" />
      <line x1="10" y1="290" x2="290" y2="10" stroke="#71717a" stroke-width="1" />
      
      <!-- Inner Diamond -->
      <polygon points="150,10 290,150 150,290 10,150" fill="none" stroke="#a855f7" stroke-width="1.5" />
      
      <!-- House 1 (Top Center) -->
      <text x="150" y="70" fill="#c084fc" font-size="10" font-weight="bold" text-anchor="middle">H1 (${getSignNum(1)})</text>
      <text x="150" y="90" fill="#f4f4f5" font-size="11" font-weight="600" text-anchor="middle">${getPlanetsInHouse(1)}</text>
      
      <!-- House 2 (Top Left Corner) -->
      <text x="80" y="45" fill="#a1a1aa" font-size="9" text-anchor="middle">H2 (${getSignNum(2)})</text>
      <text x="80" y="60" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(2)}</text>
      
      <!-- House 3 (Top Left Outer) -->
      <text x="45" y="80" fill="#a1a1aa" font-size="9" text-anchor="middle">H3 (${getSignNum(3)})</text>
      <text x="45" y="95" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(3)}</text>
      
      <!-- House 4 (Left Center) -->
      <text x="70" y="150" fill="#c084fc" font-size="10" font-weight="bold" text-anchor="middle">H4 (${getSignNum(4)})</text>
      <text x="70" y="170" fill="#f4f4f5" font-size="11" font-weight="600" text-anchor="middle">${getPlanetsInHouse(4)}</text>
      
      <!-- House 5 (Bottom Left Outer) -->
      <text x="45" y="220" fill="#a1a1aa" font-size="9" text-anchor="middle">H5 (${getSignNum(5)})</text>
      <text x="45" y="235" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(5)}</text>
      
      <!-- House 6 (Bottom Left Corner) -->
      <text x="80" y="255" fill="#a1a1aa" font-size="9" text-anchor="middle">H6 (${getSignNum(6)})</text>
      <text x="80" y="270" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(6)}</text>
      
      <!-- House 7 (Bottom Center) -->
      <text x="150" y="230" fill="#c084fc" font-size="10" font-weight="bold" text-anchor="middle">H7 (${getSignNum(7)})</text>
      <text x="150" y="250" fill="#f4f4f5" font-size="11" font-weight="600" text-anchor="middle">${getPlanetsInHouse(7)}</text>
      
      <!-- House 8 (Bottom Right Corner) -->
      <text x="220" y="255" fill="#a1a1aa" font-size="9" text-anchor="middle">H8 (${getSignNum(8)})</text>
      <text x="220" y="270" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(8)}</text>
      
      <!-- House 9 (Bottom Right Outer) -->
      <text x="255" y="220" fill="#a1a1aa" font-size="9" text-anchor="middle">H9 (${getSignNum(9)})</text>
      <text x="255" y="235" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(9)}</text>
      
      <!-- House 10 (Right Center) -->
      <text x="230" y="150" fill="#c084fc" font-size="10" font-weight="bold" text-anchor="middle">H10 (${getSignNum(10)})</text>
      <text x="230" y="170" fill="#f4f4f5" font-size="11" font-weight="600" text-anchor="middle">${getPlanetsInHouse(10)}</text>
      
      <!-- House 11 (Top Right Outer) -->
      <text x="255" y="80" fill="#a1a1aa" font-size="9" text-anchor="middle">H11 (${getSignNum(11)})</text>
      <text x="255" y="95" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(11)}</text>
      
      <!-- House 12 (Top Right Corner) -->
      <text x="220" y="45" fill="#a1a1aa" font-size="9" text-anchor="middle">H12 (${getSignNum(12)})</text>
      <text x="220" y="60" fill="#f4f4f5" font-size="10" text-anchor="middle">${getPlanetsInHouse(12)}</text>
    </svg>
    `;
}
