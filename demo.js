/* ============================================================
   Auto Wallet — Landing page interactivity
   • nav scroll state
   • whitelist demo: toggle 3 dimensions, classify a tx stream
   ============================================================ */

(() => {
  // ---------- Nav scroll state ----------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Whitelist demo ----------
  const stream = document.getElementById('stream');
  const cntAuto = document.getElementById('cnt-auto');
  const cntManual = document.getElementById('cnt-manual');
  if (!stream) return;

  // Toggle state: which dimensions are "on" in the active rule
  const rule = {
    domain: true,    // app.uniswap.org
    contract: true,  // 0x68b3...2D45 (UniversalRouter)
    method: false,   // 0x3593564c execute()
  };

  // Rule reference values
  const RULE_DOMAIN = 'app.uniswap.org';
  const RULE_CONTRACT = '0x68b3...2D45';
  const RULE_METHOD = '0x3593564c';
  const GAS_CAP = 500000;
  const VALUE_CAP_ETH = 0.1;

  // Wire toggles
  document.querySelectorAll('.dim').forEach(el => {
    const key = el.dataset.dim;
    const tg = el.querySelector('.tg');
    el.addEventListener('click', () => {
      rule[key] = !rule[key];
      el.classList.toggle('on', rule[key]);
      tg.classList.toggle('on', rule[key]);
    });
  });

  // Synthetic tx generator. Each entry has the 5 fields auto-wallet evaluates.
  const POOL = [
    { host: 'app.uniswap.org',   to: '0x68b3...2D45', method: '0x3593564c', methodLabel: 'execute',         gas: 240000,  value: 0.04, kind: 'swap' },
    { host: 'app.uniswap.org',   to: '0x68b3...2D45', method: '0x3593564c', methodLabel: 'execute',         gas: 180000,  value: 0,    kind: 'swap' },
    { host: 'app.uniswap.org',   to: '0xA0b8...eB48', method: '0x095ea7b3', methodLabel: 'approve',         gas: 52000,   value: 0,    kind: 'approve' },
    { host: 'app.uniswap.org',   to: '0x68b3...2D45', method: '0x24856bc3', methodLabel: 'executeBatch',    gas: 320000,  value: 0.02, kind: 'swap' },
    { host: 'opensea.io',        to: '0x1E00...3fEa', method: '0xfb0f3ee1', methodLabel: 'fulfillOrder',    gas: 410000,  value: 0.85, kind: 'nft' },
    { host: 'app.aave.com',      to: '0x87870...A1', method: '0x617ba037', methodLabel: 'supply',          gas: 290000,  value: 0,    kind: 'lend' },
    { host: 'app.uniswap.org',   to: '0x68b3...2D45', method: '0x3593564c', methodLabel: 'execute',         gas: 220000,  value: 0.005, kind: 'swap' },
    { host: 'unknown-dex.xyz',   to: '0xBA5e...d34F', method: '0x38ed1739', methodLabel: 'swapExactTokens', gas: 380000,  value: 0,    kind: 'swap' },
    { host: 'app.uniswap.org',   to: '0xA0b8...eB48', method: '0x095ea7b3', methodLabel: 'approve',         gas: 48000,   value: 0,    kind: 'approve' },
    { host: 'app.uniswap.org',   to: '0x68b3...2D45', method: '0x3593564c', methodLabel: 'execute',         gas: 195000,  value: 0,    kind: 'swap' },
    { host: 'app.uniswap.org',   to: '0x68b3...2D45', method: '0x24856bc3', methodLabel: 'executeBatch',    gas: 720000,  value: 0,    kind: 'swap' }, // gas cap violation
    { host: 'app.uniswap.org',   to: '0x68b3...2D45', method: '0x3593564c', methodLabel: 'execute',         gas: 260000,  value: 0.35, kind: 'swap' }, // value cap violation
  ];

  // Classify against current rule
  function classify(tx) {
    const reasons = [];
    if (rule.domain   && tx.host   !== RULE_DOMAIN)   reasons.push('origin');
    if (rule.contract && tx.to     !== RULE_CONTRACT) reasons.push('contract');
    if (rule.method   && tx.method !== RULE_METHOD)   reasons.push('method');
    // Safety net always applied — even matching rules must pass caps
    if (reasons.length === 0) {
      if (tx.gas > GAS_CAP)       reasons.push('gas>500k');
      if (tx.value > VALUE_CAP_ETH) reasons.push('value>0.1');
    }
    return { auto: reasons.length === 0, reasons };
  }

  // Icon library for tx kinds
  const KIND_ICONS = {
    swap:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3"/></svg>',
    approve: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    nft:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
    lend:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v6H3zM3 15h18v6H3z"/></svg>',
  };

  let auto = 0, manual = 0;
  let queueIdx = 0;
  const MAX_VISIBLE = 5;

  function renderTx() {
    // Cycle through the pool with slight randomness
    const tx = POOL[queueIdx % POOL.length];
    queueIdx++;
    const verdict = classify(tx);

    const row = document.createElement('div');
    row.className = 'tx ' + (verdict.auto ? 'auto' : 'manual');
    row.innerHTML = `
      <div class="tx-icon">${KIND_ICONS[tx.kind] || KIND_ICONS.swap}</div>
      <div class="tx-body">
        <div class="tx-line1">
          <span class="host">${tx.host}</span>
          <span class="arrow">→</span>
          <span class="method">${tx.methodLabel}()</span>
        </div>
        <div class="tx-line2">
          to ${tx.to} · gas ${tx.gas.toLocaleString()}${tx.value ? ' · ' + tx.value + ' ETH' : ''}
        </div>
      </div>
      <div class="tx-verdict">
        ${verdict.auto ? '⚡ Auto' : '✋ Manual'}
        ${!verdict.auto && verdict.reasons.length ? `<div style="font-size:9px;color:var(--ink-3);margin-top:2px;font-weight:600">${verdict.reasons[0]}</div>` : ''}
      </div>
    `;
    stream.prepend(row);

    if (verdict.auto) auto++;
    else manual++;
    cntAuto.textContent = auto;
    cntManual.textContent = manual;

    // Trim
    while (stream.children.length > MAX_VISIBLE) {
      const last = stream.lastElementChild;
      last.style.transition = 'opacity .25s ease, transform .25s ease';
      last.style.opacity = '0';
      last.style.transform = 'translateY(8px)';
      setTimeout(() => last.remove(), 260);
      break;
    }
  }

  // Seed a few rows then loop
  renderTx();
  setTimeout(renderTx, 400);
  setTimeout(renderTx, 850);

  let timer = setInterval(renderTx, 1800);

  // Pause when tab hidden — be polite
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInterval(timer); timer = null; }
    else if (!timer) { timer = setInterval(renderTx, 1800); }
  });
})();
