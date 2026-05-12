/* ── Vörðr — script.js ─────────────────────────────────── */

(function () {
  'use strict';

  /* ── Custom Cursor ──────────────────────────────────── */
  const cursorDot  = document.createElement('div');
  const cursorRing = document.createElement('div');
  cursorDot.className  = 'cursor';
  cursorRing.className = 'cursor-ring';
  document.body.append(cursorDot, cursorRing);

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorDot.style.width  = '14px';
      cursorDot.style.height = '14px';
      cursorRing.style.width  = '48px';
      cursorRing.style.height = '48px';
      cursorRing.style.borderColor = 'var(--gold)';
    });
    el.addEventListener('mouseleave', () => {
      cursorDot.style.width  = '8px';
      cursorDot.style.height = '8px';
      cursorRing.style.width  = '32px';
      cursorRing.style.height = '32px';
      cursorRing.style.borderColor = 'var(--gold)';
    });
  });

  /* ── Reading Progress ───────────────────────────────── */
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  document.body.prepend(progressBar);

  const progressEl = document.getElementById('progress');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct  = docH > 0 ? (scrollTop / docH) * 100 : 0;
    progressBar.style.width = pct + '%';
    if (progressEl) progressEl.value = pct;
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ── Scroll Reveal for Paragraphs ───────────────────── */
  const paragraphs = document.querySelectorAll('.story p');

  paragraphs.forEach(p => p.classList.add('hidden-para'));

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.remove('hidden-para');
        e.target.classList.add('visible-para');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  paragraphs.forEach((p, i) => {
    p.style.transitionDelay = (i % 3) * 0.06 + 's';
    revealObs.observe(p);
  });

  /* ── Theme Toggle ───────────────────────────────────── */
  const themeBtn = document.getElementById('themeToggle');
  const saved    = localStorage.getItem('vordr-theme') || 'dark';
  document.body.setAttribute('data-theme', saved);
  themeBtn.textContent = saved === 'dark' ? 'Modo Claro' : 'Modo Escuro';

  themeBtn.addEventListener('click', () => {
    const curr = document.body.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('vordr-theme', next);
    themeBtn.textContent = next === 'dark' ? 'Modo Claro' : 'Modo Escuro';
  });

  /* ── Text-to-Speech ─────────────────────────────────── */
  const listenBtn = document.getElementById('listenBtn');
  let   utterance = null;
  let   speaking  = false;
  let   paused    = false;

  // Audio bar
  const audioBar = document.createElement('div');
  audioBar.className = 'audio-bar';
  audioBar.innerHTML = `
    <span class="audio-dot"></span>
    <span class="track-name">Vörðr — A História</span>
    <button class="btn" id="stopBtn">◼ Parar</button>
  `;
  document.body.appendChild(audioBar);

  function showAudioBar() { audioBar.classList.add('visible'); }
  function hideAudioBar() { audioBar.classList.remove('visible'); }

  document.getElementById('stopBtn').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    speaking = false; paused = false;
    listenBtn.textContent = '▶ Ouvir';
    listenBtn.classList.remove('active');
    hideAudioBar();
    highlightPara(null);
  });

  // Collect text per paragraph for highlighting
  const storyParas = Array.from(document.querySelectorAll('.story p'));

  function highlightPara(el) {
    storyParas.forEach(p => p.style.color = '');
    if (el) {
      el.style.color = 'var(--gold)';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function readStory() {
    const fullText = storyParas.map(p => p.innerText).join('\n\n');
    utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.88;
    utterance.pitch = 0.9;

    // Try to find a Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt')) || voices[0];
    if (ptVoice) utterance.voice = ptVoice;

    // Highlight paragraphs as reading progresses (word boundary)
    let charIndex = 0;
    let paraStarts = [];
    let offset = 0;
    storyParas.forEach(p => {
      paraStarts.push(offset);
      offset += p.innerText.length + 2;
    });

    utterance.onboundary = e => {
      if (e.name !== 'word') return;
      charIndex = e.charIndex;
      for (let i = paraStarts.length - 1; i >= 0; i--) {
        if (charIndex >= paraStarts[i]) {
          highlightPara(storyParas[i]);
          break;
        }
      }
    };

    utterance.onend = () => {
      speaking = false; paused = false;
      listenBtn.textContent = '▶ Ouvir';
      listenBtn.classList.remove('active');
      hideAudioBar();
      highlightPara(null);
    };

    window.speechSynthesis.speak(utterance);
  }

  listenBtn.addEventListener('click', () => {
    if (!speaking && !paused) {
      window.speechSynthesis.cancel();
      speaking = true;
      listenBtn.textContent = '‖ Pausar';
      listenBtn.classList.add('active');
      showAudioBar();
      readStory();
    } else if (speaking && !paused) {
      window.speechSynthesis.pause();
      paused = true; speaking = false;
      listenBtn.textContent = '▶ Continuar';
      listenBtn.classList.remove('active');
    } else if (paused) {
      window.speechSynthesis.resume();
      paused = false; speaking = true;
      listenBtn.textContent = '‖ Pausar';
      listenBtn.classList.add('active');
    }
  });

  // Load voices async
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  /* ── Top Button ─────────────────────────────────────── */
  const topBtn = document.getElementById('topBtn');
  if (topBtn) {
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── Tooltip on highlighted terms (safe TreeWalker) ── */
  const glossary = {
    'Célula 7':   'Compartimento de contenção onde N-7 foi criado.',
    'N-7':        'Designação de laboratório. Mais tarde: Vörðr.',
    'Vörðr':      'Nórdico antigo: "O Guardião". Nome escolhido pela rua, não pelos cientistas.',
    'Rua 2':      'A cidade que ele escolheu proteger.',
    'Justiceiro': 'O único humano que não recuou.',
  };

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  // Build one combined regex with all terms (longest first to avoid partial matches)
  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
  const combinedRegex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

  function wrapTermsInNode(textNode) {
    const text = textNode.nodeValue;
    if (!combinedRegex.test(text)) return;
    combinedRegex.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0, match;

    while ((match = combinedRegex.exec(text)) !== null) {
      // Text before the match
      if (match.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      // The matched term
      const span = document.createElement('span');
      span.className = 'glossary-term';
      span.dataset.tip = glossary[match[1]];
      span.style.cssText = 'border-bottom:1px dotted var(--gold-dim);';
      span.textContent = match[1];
      frag.appendChild(span);
      last = match.index + match[1].length;
    }

    // Remaining text
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }

    textNode.parentNode.replaceChild(frag, textNode);
  }

  // Walk only text nodes inside .story, skipping existing elements
  const walker = document.createTreeWalker(
    document.querySelector('.story'),
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip if inside an already-processed span or an em/strong
        const parent = node.parentElement;
        if (parent && (parent.classList.contains('glossary-term') ||
            parent.tagName === 'EM' || parent.tagName === 'STRONG')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  // Process collected nodes (don't mutate DOM while walking)
  textNodes.forEach(wrapTermsInNode);

  document.querySelectorAll('.glossary-term').forEach(el => {
    el.addEventListener('mouseenter', () => {
      tooltip.textContent = el.dataset.tip;
      tooltip.style.opacity = '1';
    });
    el.addEventListener('mousemove', e => {
      tooltip.style.left = (e.clientX + 16) + 'px';
      tooltip.style.top  = (e.clientY - 10) + 'px';
    });
    el.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });

  /* ── Parallax on hero background text ───────────────── */
  const heroBefore = document.querySelector('.story-hero');
  if (heroBefore) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.3;
      heroBefore.style.setProperty('--parallax-y', y + 'px');
    }, { passive: true });
  }

  /* ── Ambient particles (subtle) ─────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;opacity:.35;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 38; i++) {
    particles.push({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      r: Math.random() * 1.2 + .2,
      vx: (Math.random() - .5) * .15,
      vy: (Math.random() - .5) * .15,
      o: Math.random() * .5 + .1,
      gold: Math.random() > .6,
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    const isDark = document.body.getAttribute('data-theme') !== 'light';

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      if (p.gold) {
        ctx.fillStyle = isDark
          ? `rgba(255, 215, 0, ${p.o * 0.75})`
          : `rgba(160, 110, 20, ${p.o * .5})`;
      } else {
        ctx.fillStyle = isDark
          ? `rgba(100, 220, 255, ${p.o * .7})`
          : `rgba(30, 100, 160, ${p.o * .4})`;
      }
      ctx.fill();
    });
    requestAnimationFrame(drawParticles);
  }
  drawParticles();

  /* ── Easter egg: Konami on story title ──────────────── */
  const titleEl = document.querySelector('.hero-title');
  if (titleEl) {
    titleEl.addEventListener('dblclick', () => {
      titleEl.style.textShadow = '0 0 40px var(--gold), 0 0 80px var(--gold), 0 0 160px var(--ice)';
      setTimeout(() => titleEl.style.textShadow = '', 2000);
    });
  }

})();