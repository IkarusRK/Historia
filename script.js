  (function(){
    'use strict';

    /* ── Cursor ──────────────────────────────────── */
    const dot  = document.getElementById('cur-dot');
    const ring = document.getElementById('cur-ring');
    let mx=0,my=0,rx=0,ry=0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx+'px'; dot.style.top = my+'px';
    });
    (function anim(){
      rx += (mx-rx)*.11; ry += (my-ry)*.11;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      requestAnimationFrame(anim);
    })();

    document.querySelectorAll('a,button,.btn').forEach(el=>{
      el.addEventListener('mouseenter',()=>{
        dot.style.width='12px'; dot.style.height='12px';
        ring.style.width='44px'; ring.style.height='44px';
      });
      el.addEventListener('mouseleave',()=>{
        dot.style.width='6px'; dot.style.height='6px';
        ring.style.width='28px'; ring.style.height='28px';
      });
    });

    /* ── Reading bar ─────────────────────────────── */
    const readbar = document.getElementById('readbar');
    const prog    = document.getElementById('prog');
    window.addEventListener('scroll', ()=>{
      const pct = window.scrollY/(document.documentElement.scrollHeight-window.innerHeight)*100;
      readbar.style.width = pct+'%';
      if(prog) prog.value = pct;
    },{passive:true});

    /* ── Scroll reveal ───────────────────────────── */
    const paras = Array.from(document.querySelectorAll('.story p'));
    paras.forEach(p=>p.classList.add('para-hidden'));
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.remove('para-hidden');
          e.target.classList.add('para-show');
          obs.unobserve(e.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -30px 0px'});
    paras.forEach((p,i)=>{ p.style.transitionDelay=(i%3)*.07+'s'; obs.observe(p); });

    /* ── Theme ───────────────────────────────────── */
    const themeBtn = document.getElementById('themeBtn');
    const saved = localStorage.getItem('bn-theme')||'dark';
    document.body.setAttribute('data-theme', saved);
    themeBtn.textContent = saved==='dark'?'Modo Claro':'Modo Escuro';
    themeBtn.addEventListener('click',()=>{
      const c = document.body.getAttribute('data-theme');
      const n = c==='dark'?'light':'dark';
      document.body.setAttribute('data-theme',n);
      localStorage.setItem('bn-theme',n);
      themeBtn.textContent = n==='dark'?'Modo Claro':'Modo Escuro';
    });

    /* ── TTS ─────────────────────────────────────── */
    const listenBtn = document.getElementById('listenBtn');
    const audiobar  = document.getElementById('audiobar');
    const stopBtn   = document.getElementById('stopBtn');
    let speaking=false, paused=false, utt=null;

    function showBar(){ audiobar.classList.add('show'); }
    function hideBar(){ audiobar.classList.remove('show'); }

    function highlight(el){
      paras.forEach(p=>{ p.style.color=''; p.style.opacity=''; });
      if(el){ el.style.color='var(--red)'; el.scrollIntoView({behavior:'smooth',block:'center'}); }
    }

    function read(){
      const text = paras.map(p=>p.innerText).join('\n\n');
      utt = new SpeechSynthesisUtterance(text);
      utt.lang='pt-BR'; utt.rate=0.87; utt.pitch=0.85;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v=>v.lang.startsWith('pt'))||voices[0];
      if(v) utt.voice=v;

      let starts=[], offset=0;
      paras.forEach(p=>{ starts.push(offset); offset+=p.innerText.length+2; });

      utt.onboundary = e=>{
        if(e.name!=='word') return;
        for(let i=starts.length-1;i>=0;i--){
          if(e.charIndex>=starts[i]){ highlight(paras[i]); break; }
        }
      };
      utt.onend = ()=>{
        speaking=false; paused=false;
        listenBtn.textContent='▶ Ouvir';
        listenBtn.classList.remove('on');
        hideBar(); highlight(null);
      };
      window.speechSynthesis.speak(utt);
    }

    listenBtn.addEventListener('click',()=>{
      if(!speaking&&!paused){
        window.speechSynthesis.cancel();
        speaking=true;
        listenBtn.textContent='‖ Pausar';
        listenBtn.classList.add('on');
        showBar(); read();
      } else if(speaking&&!paused){
        window.speechSynthesis.pause();
        paused=true; speaking=false;
        listenBtn.textContent='▶ Continuar';
        listenBtn.classList.remove('on');
      } else {
        window.speechSynthesis.resume();
        paused=false; speaking=true;
        listenBtn.textContent='‖ Pausar';
        listenBtn.classList.add('on');
      }
    });

    stopBtn.addEventListener('click',()=>{
      window.speechSynthesis.cancel();
      speaking=false; paused=false;
      listenBtn.textContent='▶ Ouvir';
      listenBtn.classList.remove('on');
      hideBar(); highlight(null);
    });

    if(window.speechSynthesis.onvoiceschanged!==undefined)
      window.speechSynthesis.onvoiceschanged=()=>window.speechSynthesis.getVoices();

    /* ── Top btn ─────────────────────────────────── */
    document.getElementById('topBtn').addEventListener('click',
      ()=>window.scrollTo({top:0,behavior:'smooth'}));

    /* ── Glossary (safe TreeWalker) ──────────────── */
    const glossary = {
      'Clara':       'O último farol de Matheus. Sua morte definiu o Justiceiro.',
      'Matheus':     'Nome civil do Justiceiro. Matheus Lins — o homem antes da missão.',
      'Blacknoir':   'O codinome. Escolhido pela rua, não por ele.',
      'Rua 2':       'A cidade. Mais que crime — entidades, zumbis, o inexplicável.',
      'Vörðr':       'O lobo nórdico mutante. Parceiro. Guardião.',
      'Justiceiro':  'O executor. Onde a lei para, ele começa.',
    };

    const tooltip = document.getElementById('tooltip');
    const terms   = Object.keys(glossary).sort((a,b)=>b.length-a.length);
    const regex   = new RegExp(
      `(${terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`, 'g'
    );

    function wrapNode(node){
      const txt = node.nodeValue;
      if(!regex.test(txt)) return;
      regex.lastIndex=0;
      const frag = document.createDocumentFragment();
      let last=0, m;
      while((m=regex.exec(txt))!==null){
        if(m.index>last) frag.appendChild(document.createTextNode(txt.slice(last,m.index)));
        const sp = document.createElement('span');
        sp.className='glossary-term';
        sp.dataset.tip=glossary[m[1]];
        sp.textContent=m[1];
        frag.appendChild(sp);
        last=m.index+m[1].length;
      }
      if(last<txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
      node.parentNode.replaceChild(frag,node);
    }

    const walker = document.createTreeWalker(
      document.getElementById('story'),
      NodeFilter.SHOW_TEXT,
      { acceptNode(n){
          const p=n.parentElement;
          if(p&&(p.classList.contains('glossary-term')||p.tagName==='EM'||p.tagName==='STRONG'))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
      }}
    );
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapNode);

    document.querySelectorAll('.glossary-term').forEach(el=>{
      el.addEventListener('mouseenter',()=>{
        tooltip.textContent=el.dataset.tip; tooltip.style.opacity='1';
      });
      el.addEventListener('mousemove',e=>{
        tooltip.style.left=(e.clientX+16)+'px';
        tooltip.style.top=(e.clientY-10)+'px';
      });
      el.addEventListener('mouseleave',()=>{ tooltip.style.opacity='0'; });
    });

    /* ── Particles ───────────────────────────────── */
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let W,H;
    function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
    resize(); window.addEventListener('resize',resize);

    const pts = Array.from({length:35},()=>({
      x:Math.random()*1920, y:Math.random()*1080,
      r:Math.random()*.9+.2,
      vx:(Math.random()-.5)*.12, vy:(Math.random()-.5)*.12,
      o:Math.random()*.4+.08,
      red:Math.random()>.5
    }));

    (function drawPts(){
      ctx.clearRect(0,0,W,H);
      const dark = document.body.getAttribute('data-theme')!=='light';
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = p.red
          ? (dark?`rgba(192,57,43,${p.o})`:`rgba(155,44,31,${p.o*.5})`)
          : (dark?`rgba(232,228,220,${p.o*.3})`:`rgba(26,22,18,${p.o*.2})`);
        ctx.fill();
      });
      requestAnimationFrame(drawPts);
    })();

  })();