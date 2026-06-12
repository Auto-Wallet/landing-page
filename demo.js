/* ============================================================
   AUTO WALLET — "The Signing Machine"
   • custom cursor + magnetic buttons
   • hero flow-field canvas
   • self-clicking Confirm machine
   • scramble headings + scroll reveals + count-ups
   • whitelist playground (rule builder + live feed)
   • easter egg: Konami code / 7 cat clicks → MEOW MODE
   ============================================================ */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- toast ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (msg, ms = 3200) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  };

  /* ---------- nav scroll state + progress bar ---------- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = max > 0 ? (window.scrollY / max) * 100 + '%' : '0%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      ring.style.transform = `translate(${rx - 19}px, ${ry - 19}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', (e) => {
      ring.classList.toggle('hot', !!e.target.closest('a, button, label.dim'));
    }, { passive: true });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.22}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- hero flow-field canvas ---------- */
  const canvas = document.getElementById('field');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, particles;
    let pointer = { x: -9999, y: -9999 };
    const DENSITY = 9000;

    const limeOf = () =>
      getComputedStyle(document.body).getPropertyValue('--lime').trim() || '#c6ff4a';

    const resize = () => {
      const hero = canvas.parentElement;
      w = canvas.width = hero.clientWidth;
      h = canvas.height = hero.clientHeight;
      const n = Math.min(220, Math.floor((w * h) / DENSITY));
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0, vy: 0,
        speed: 0.4 + Math.random() * 0.8,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    canvas.parentElement.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    }, { passive: true });
    canvas.parentElement.addEventListener('pointerleave', () => {
      pointer = { x: -9999, y: -9999 };
    });

    let t = 0;
    const tick = () => {
      t += 0.0022;
      ctx.clearRect(0, 0, w, h);
      const color = limeOf();
      for (const p of particles) {
        // pseudo flow field from layered sines
        const a = Math.sin(p.x * 0.0016 + t * 3) + Math.cos(p.y * 0.0019 - t * 2);
        const angle = a * Math.PI;
        p.vx += Math.cos(angle) * 0.035 * p.speed;
        p.vy += Math.sin(angle) * 0.035 * p.speed;

        // pointer repulsion
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 16000) {
          const f = (16000 - d2) / 16000;
          p.vx += (dx / Math.sqrt(d2 + 1)) * f * 1.4;
          p.vy += (dy / Math.sqrt(d2 + 1)) * f * 1.4;
        }

        p.vx *= 0.94; p.vy *= 0.94;
        const px = p.x, py = p.y;
        p.x += p.vx; p.y += p.vy;

        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;

        const jumped = Math.abs(p.x - px) > 50 || Math.abs(p.y - py) > 50;
        if (!jumped) {
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.34;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ---------- the machine: self-clicking Confirm ---------- */
  const confirmBtn = document.getElementById('confirmBtn');
  const ghostCursor = document.getElementById('ghostCursor');
  const stamp = document.getElementById('stamp');
  const savedCount = document.getElementById('savedCount');
  const machineTitle = document.getElementById('machineTitle');
  const machineMethod = document.getElementById('machineMethod');
  const machineValue = document.getElementById('machineValue');

  const MACHINE_TXS = [
    ['app.uniswap.org wants a signature', 'execute()', '0.20 ETH'],
    ['app.aave.com wants a signature', 'supply()', '1.10 ETH'],
    ['app.uniswap.org wants a signature', 'approve()', '0 ETH'],
    ['stake.lido.fi wants a signature', 'submit()', '0.45 ETH'],
    ['app.curve.finance wants a signature', 'exchange()', '0.08 ETH'],
  ];
  let saved = 0, machineIdx = 0, humanTookOver = false;

  const machineCycle = () => {
    if (!confirmBtn || humanTookOver) return;
    // paw descends and "clicks"
    ghostCursor.classList.add('tap');
    setTimeout(() => {
      confirmBtn.classList.add('pressed');
      stamp.classList.add('on');
      saved += 1;
      savedCount.textContent = saved;
      setTimeout(() => {
        confirmBtn.classList.remove('pressed');
        ghostCursor.classList.remove('tap');
      }, 180);
      setTimeout(() => {
        stamp.classList.remove('on');
        machineIdx = (machineIdx + 1) % MACHINE_TXS.length;
        const [title, method, value] = MACHINE_TXS[machineIdx];
        machineTitle.textContent = title;
        machineMethod.textContent = method;
        machineValue.textContent = value;
      }, 1100);
    }, 200);
  };
  if (confirmBtn && !reduceMotion) {
    setInterval(machineCycle, 2600);
    setTimeout(machineCycle, 1400);
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      humanTookOver = true;
      stamp.textContent = 'NICE. WE GOT IT FROM HERE.';
      stamp.classList.add('on');
      setTimeout(() => {
        stamp.classList.remove('on');
        setTimeout(() => { stamp.textContent = 'AUTO-SIGNED'; humanTookOver = false; }, 600);
      }, 1600);
      showToast('That was your last manual Confirm. We take it from here. 🐾');
    });
  }

  /* ---------- scroll reveals (staggered) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const groups = new Map(); // parent -> running index for stagger
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      const parent = el.parentElement;
      const idx = (groups.get(parent) || 0);
      groups.set(parent, idx + 1);
      el.style.setProperty('--d', `${Math.min(idx * 0.08, 0.4)}s`);
      el.classList.add('in');
      io.unobserve(el);
    }
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));

  /* ---------- scramble headings ---------- */
  const SCRAMBLE_CHARS = '#%&@$△▮◆01<>/';
  const scramble = (el) => {
    const target = el.dataset.text || el.textContent;
    let frame = 0;
    const total = Math.max(14, target.length);
    const step = () => {
      frame++;
      const progress = frame / total;
      el.textContent = target
        .split('')
        .map((ch, i) => {
          if (ch === ' ' || i / target.length < progress) return ch;
          return SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        })
        .join('');
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    step();
  };
  if (!reduceMotion) {
    const ioScramble = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        scramble(entry.target);
        ioScramble.unobserve(entry.target);
      }
    }, { threshold: 0.4 });
    document.querySelectorAll('.scramble').forEach((el) => ioScramble.observe(el));
  }

  /* ---------- stat count-ups ---------- */
  const ioCount = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      ioCount.unobserve(el);
      const end = parseInt(el.dataset.count, 10);
      const t0 = performance.now();
      const dur = 1400;
      const stepUp = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(stepUp);
      };
      requestAnimationFrame(stepUp);
    }
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach((el) => ioCount.observe(el));

  /* ---------- tilt cards ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- playground: whitelist rule engine ---------- */
  const feedList = document.getElementById('feedList');
  if (feedList) {
    const RULE = {
      domain: 'app.uniswap.org',
      contract: '0x68b3…4a51',
      method: '0x3593564c',
    };
    const dims = {
      domain: document.getElementById('dimDomain'),
      contract: document.getElementById('dimContract'),
      method: document.getElementById('dimMethod'),
    };
    const ruleStatus = document.getElementById('ruleStatus');
    const feedHint = document.getElementById('feedHint');
    const scoreAuto = document.getElementById('scoreAuto');
    const scoreHeld = document.getElementById('scoreHeld');
    const scoreClicks = document.getElementById('scoreClicks');
    let nAuto = 0, nHeld = 0, nClicks = 0;

    const bump = (el) => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    };

    const DOMAINS = ['app.uniswap.org', 'app.uniswap.org', 'app.uniswap.org', 'app.aave.com', 'free-airdrop.xyz'];
    const CONTRACTS = [
      ['0x68b3…4a51', 'UniversalRouter'],
      ['0x68b3…4a51', 'UniversalRouter'],
      ['0x7d2a…9e03', 'Pool'],
    ];
    const METHODS = [
      ['execute()', '0x3593564c'],
      ['execute()', '0x3593564c'],
      ['approve()', '0x095ea7b3'],
      ['claim()', '0x4e71d92d'],
    ];
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];

    const updateRuleUI = () => {
      const any = dims.domain.checked || dims.contract.checked || dims.method.checked;
      ruleStatus.textContent = any ? 'ARMED' : 'DISARMED';
      ruleStatus.classList.toggle('off', !any);
      feedHint.textContent = any
        ? 'rule armed — matching txs sign themselves'
        : 'no rule — everything needs you. exhausting, right?';
    };
    Object.values(dims).forEach((cb) => cb.addEventListener('change', updateRuleUI));
    updateRuleUI();

    const matches = (tx) => {
      const any = dims.domain.checked || dims.contract.checked || dims.method.checked;
      if (!any) return false;
      if (dims.domain.checked && tx.domain !== RULE.domain) return false;
      if (dims.contract.checked && tx.contract[0] !== RULE.contract) return false;
      if (dims.method.checked && tx.method[1] !== RULE.method) return false;
      return true;
    };

    const spawnTx = () => {
      const tx = {
        domain: pick(DOMAINS),
        contract: pick(CONTRACTS),
        method: pick(METHODS),
        value: (Math.random() * 0.4).toFixed(2),
      };

      const el = document.createElement('div');
      el.className = 'tx';
      el.innerHTML = `
        <div class="tx-domain">${tx.domain}</div>
        <div class="tx-detail">${tx.method[0]} ${tx.method[1]} · ${tx.contract[0]} ${tx.contract[1]} · ${tx.value} ETH</div>
        <span class="tx-verdict wait">checking…</span>`;
      feedList.prepend(el);

      // verdict after a beat
      setTimeout(() => {
        const verdict = el.querySelector('.tx-verdict');
        if (!verdict) return;
        if (matches(tx)) {
          const ms = 80 + ((Math.random() * 140) | 0);
          verdict.textContent = `AUTO-SIGNED · ${ms}ms`;
          verdict.className = 'tx-verdict auto';
          el.classList.add('signed');
          nAuto++; scoreAuto.textContent = nAuto; bump(scoreAuto);
        } else {
          verdict.remove();
          const btn = document.createElement('button');
          btn.className = 'tx-approve';
          btn.textContent = 'NEEDS YOU — APPROVE';
          el.classList.add('blocked');
          el.appendChild(btn);
          nHeld++; scoreHeld.textContent = nHeld; bump(scoreHeld);
          btn.addEventListener('click', () => {
            const span = document.createElement('span');
            span.className = 'tx-verdict human';
            span.textContent = 'SIGNED BY HUMAN · 4.2s';
            btn.replaceWith(span);
            el.classList.remove('blocked');
            nClicks++; scoreClicks.textContent = nClicks; bump(scoreClicks);
          });
        }
      }, 500 + Math.random() * 400);

      // cap feed length
      const items = feedList.querySelectorAll('.tx');
      if (items.length > 6) {
        const last = items[items.length - 1];
        last.classList.add('out');
        setTimeout(() => last.remove(), 420);
      }
    };

    // only run the feed while visible
    let feedTimer = null;
    const ioFeed = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !feedTimer) {
        spawnTx();
        feedTimer = setInterval(spawnTx, 2200);
      } else if (!entry.isIntersecting && feedTimer) {
        clearInterval(feedTimer);
        feedTimer = null;
      }
    }, { threshold: 0.2 });
    ioFeed.observe(feedList);
  }

  /* ============================================================
     EASTER EGG — MEOW MODE
     Konami code (↑↑↓↓←→←→BA) or 7 clicks on the cat logo.
     ============================================================ */
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiPos = 0;
  let catClicks = 0;
  let meow = false;
  let nyanTimer = null;

  const confirmWordText = document.getElementById('confirmWordText');
  const ctaConfirm = document.getElementById('ctaConfirm');

  const spawnNyan = () => {
    const top = 12 + Math.random() * 60;
    const cat = document.createElement('img');
    cat.src = 'public/icons/cat-transparent.png';
    cat.className = 'nyan-cat';
    cat.style.top = top + 'vh';
    cat.alt = '';
    const trail = document.createElement('div');
    trail.className = 'nyan-trail';
    trail.style.top = `calc(${top}vh + 26px)`;
    trail.style.left = '0';
    document.body.append(trail, cat);
    setTimeout(() => { cat.remove(); trail.remove(); }, 5200);
  };

  const setMeow = (on) => {
    meow = on;
    document.body.classList.toggle('meow', on);
    if (confirmWordText) confirmWordText.textContent = on ? 'Meow.' : 'Confirm.';
    if (ctaConfirm) ctaConfirm.textContent = on ? 'Meow' : 'Confirm';
    if (on) {
      showToast('🐱 MEOW MODE UNLOCKED — the cat signs everything now. (repeat the code to undo)');
      spawnNyan();
      if (!reduceMotion) nyanTimer = setInterval(spawnNyan, 4500);
    } else {
      clearInterval(nyanTimer);
      nyanTimer = null;
      showToast('Meow mode off. The cat went back to signing quietly.');
    }
  };

  window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[konamiPos]) {
      konamiPos++;
      if (konamiPos === KONAMI.length) {
        konamiPos = 0;
        setMeow(!meow);
      }
    } else {
      konamiPos = key === KONAMI[0] ? 1 : 0;
    }
  });

  const brandCat = document.getElementById('brandCat');
  if (brandCat) {
    brandCat.addEventListener('click', () => {
      catClicks++;
      if (catClicks === 4) showToast('…the cat is noticing you. keep going.');
      if (catClicks >= 7) {
        catClicks = 0;
        setMeow(!meow);
      }
    });
  }

  // paw prints follow the cursor in meow mode
  if (finePointer) {
    let lastPaw = 0;
    window.addEventListener('pointermove', (e) => {
      if (!meow || reduceMotion) return;
      const now = performance.now();
      if (now - lastPaw < 90) return;
      lastPaw = now;
      const paw = document.createElement('span');
      paw.className = 'paw-print';
      paw.textContent = '🐾';
      paw.style.left = (e.clientX + 8) + 'px';
      paw.style.top = (e.clientY + 10) + 'px';
      paw.style.setProperty('--rot', ((Math.random() * 60) - 30) + 'deg');
      document.body.appendChild(paw);
      setTimeout(() => paw.remove(), 1200);
    }, { passive: true });
  }
})();
