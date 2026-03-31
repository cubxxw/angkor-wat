/* ============================================================
   《护城河不是为了防御》书籍网站 - 交互脚本
   ============================================================ */

/* ============================================================
   日出动效 Canvas
   ============================================================ */
(function initSunrise() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let startTime = null;
  const DURATION = 8000; // 8秒日出动画

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // 吴哥五塔轮廓点（归一化坐标，相对宽高）
  function drawTemple(ctx, W, H, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const baseY = H * 0.88;
    const cx = W / 2;
    const scale = Math.min(W, H) * 0.0012;

    function drawTower(x, bottomY, w, h, hasCap) {
      // 塔身
      ctx.beginPath();
      ctx.rect(x - w / 2, bottomY - h, w, h);
      ctx.fill();
      // 塔顶
      if (hasCap) {
        const cw = w * 0.7;
        const ch = h * 0.3;
        ctx.beginPath();
        ctx.rect(x - cw / 2, bottomY - h - ch, cw, ch);
        ctx.fill();
        // 顶尖
        const tw = cw * 0.5;
        const th = ch * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - tw / 2, bottomY - h - ch - th);
        ctx.lineTo(x + tw / 2, bottomY - h - ch - th);
        ctx.lineTo(x + cw / 2, bottomY - h - ch);
        ctx.lineTo(x - cw / 2, bottomY - h - ch);
        ctx.closePath();
        ctx.fill();
        // 塔尖
        ctx.beginPath();
        ctx.moveTo(x, bottomY - h - ch - th - th * 0.8);
        ctx.lineTo(x - tw / 4, bottomY - h - ch - th);
        ctx.lineTo(x + tw / 4, bottomY - h - ch - th);
        ctx.closePath();
        ctx.fill();
      }
    }

    const mainH = H * 0.42;
    const mainW = H * 0.11;
    const sideH = H * 0.28;
    const sideW = H * 0.075;
    const outerH = H * 0.18;
    const outerW = H * 0.055;
    const spacing = W * 0.1;

    ctx.fillStyle = '#080604';
    // 底座平台
    ctx.fillRect(cx - W * 0.28, baseY - H * 0.06, W * 0.56, H * 0.06);
    // 外侧两塔
    drawTower(cx - spacing * 1.9, baseY, outerW * 160 * scale / scale, outerH, true);
    drawTower(cx + spacing * 1.9, baseY, outerW * 160 * scale / scale, outerH, true);
    // 内侧两塔
    drawTower(cx - spacing * 0.9, baseY, sideW * 160 * scale / scale, sideH, true);
    drawTower(cx + spacing * 0.9, baseY, sideW * 160 * scale / scale, sideH, true);
    // 中央主塔
    drawTower(cx, baseY, mainW * 130 * scale / scale, mainH, true);

    ctx.restore();
  }

  // 粒子系统
  const particles = [];
  function initParticles() {
    particles.length = 0;
    const count = Math.min(60, Math.floor(W * H / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: H * 0.5 + Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 1.5 + 0.3,
        opacity: 0,
        maxOpacity: Math.random() * 0.5 + 0.1,
        life: Math.random(),
        speed: Math.random() * 0.005 + 0.002,
      });
    }
  }
  initParticles();
  window.addEventListener('resize', initParticles);

  function drawParticles(ctx, progress) {
    if (progress < 0.3) return;
    const fade = Math.min(1, (progress - 0.3) / 0.3);
    const sunX = W / 2;
    const sunY = H * (0.72 - progress * 0.25);

    particles.forEach(p => {
      p.life += p.speed;
      if (p.life > 1) {
        p.life = 0;
        p.x = sunX + (Math.random() - 0.5) * W * 0.4;
        p.y = sunY + Math.random() * H * 0.3;
        p.opacity = 0;
      }
      const lifeFade = p.life < 0.2 ? p.life / 0.2 : p.life > 0.7 ? 1 - (p.life - 0.7) / 0.3 : 1;
      p.opacity = p.maxOpacity * lifeFade * fade;
      p.x += p.vx;
      p.y += p.vy;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      grad.addColorStop(0, `rgba(240, 192, 64, ${p.opacity})`);
      grad.addColorStop(1, `rgba(212, 160, 23, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(1, elapsed / DURATION);

    ctx.clearRect(0, 0, W, H);

    // 天空背景渐变
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    if (progress < 0.3) {
      // 黎明前
      const t = progress / 0.3;
      skyGrad.addColorStop(0, `rgb(${lerp(8,18,t)}, ${lerp(6,12,t)}, ${lerp(5,8,t)})`);
      skyGrad.addColorStop(0.6, `rgb(${lerp(10,25,t)}, ${lerp(8,16,t)}, ${lerp(5,8,t)})`);
      skyGrad.addColorStop(1, `rgb(${lerp(12,35,t)}, ${lerp(9,20,t)}, ${lerp(5,8,t)})`);
    } else if (progress < 0.6) {
      // 黎明破晓
      const t = (progress - 0.3) / 0.3;
      skyGrad.addColorStop(0, `rgb(${lerp(18,30,t)}, ${lerp(12,20,t)}, ${lerp(8,15,t)})`);
      skyGrad.addColorStop(0.4, `rgb(${lerp(25,80,t)}, ${lerp(16,40,t)}, ${lerp(8,15,t)})`);
      skyGrad.addColorStop(0.7, `rgb(${lerp(35,140,t)}, ${lerp(20,80,t)}, ${lerp(8,20,t)})`);
      skyGrad.addColorStop(1, `rgb(${lerp(35,180,t)}, ${lerp(20,100,t)}, ${lerp(8,25,t)})`);
    } else {
      // 日出
      const t = (progress - 0.6) / 0.4;
      skyGrad.addColorStop(0, `rgb(${lerp(30,15,t)}, ${lerp(20,12,t)}, ${lerp(15,8,t)})`);
      skyGrad.addColorStop(0.3, `rgb(${lerp(80,50,t)}, ${lerp(40,30,t)}, ${lerp(15,15,t)})`);
      skyGrad.addColorStop(0.6, `rgb(${lerp(140,200,t)}, ${lerp(80,130,t)}, ${lerp(20,40,t)})`);
      skyGrad.addColorStop(1, `rgb(${lerp(180,240,t)}, ${lerp(100,160,t)}, ${lerp(25,50,t)})`);
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // 太阳光晕
    if (progress > 0.2) {
      const sunProgress = Math.min(1, (progress - 0.2) / 0.8);
      const sunX = W / 2;
      const sunY = H * (0.72 - sunProgress * 0.25);
      const sunRadius = Math.min(W, H) * (0.06 + sunProgress * 0.1);

      // 外层大光晕
      const outerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 5);
      outerGlow.addColorStop(0, `rgba(240, 192, 64, ${0.25 * sunProgress})`);
      outerGlow.addColorStop(0.3, `rgba(200, 112, 26, ${0.15 * sunProgress})`);
      outerGlow.addColorStop(0.7, `rgba(139, 69, 19, ${0.08 * sunProgress})`);
      outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, W, H);

      // 内层光核
      const innerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
      innerGlow.addColorStop(0, `rgba(253, 240, 192, ${Math.min(0.9, sunProgress * 1.2)})`);
      innerGlow.addColorStop(0.3, `rgba(240, 192, 64, ${sunProgress * 0.8})`);
      innerGlow.addColorStop(0.7, `rgba(200, 112, 26, ${sunProgress * 0.5})`);
      innerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = innerGlow;
      ctx.fillRect(0, 0, W, H);

      // 光柱（穿过主塔）
      if (progress > 0.5) {
        const beamProgress = (progress - 0.5) / 0.5;
        ctx.save();
        ctx.globalAlpha = 0.06 * beamProgress;
        const beamGrad = ctx.createLinearGradient(sunX, sunY, sunX, H);
        beamGrad.addColorStop(0, 'rgba(253,240,192,1)');
        beamGrad.addColorStop(1, 'rgba(200,112,26,0)');
        ctx.fillStyle = beamGrad;
        const bw = W * 0.04;
        ctx.beginPath();
        ctx.moveTo(sunX - bw, sunY);
        ctx.lineTo(sunX + bw, sunY);
        ctx.lineTo(sunX + bw * 3, H);
        ctx.lineTo(sunX - bw * 3, H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 水面倒影（底部）
    if (progress > 0.15) {
      const reflectAlpha = Math.min(0.3, (progress - 0.15) / 0.6 * 0.3);
      const reflectGrad = ctx.createLinearGradient(0, H * 0.82, 0, H);
      reflectGrad.addColorStop(0, `rgba(212, 160, 23, 0)`);
      reflectGrad.addColorStop(0.5, `rgba(212, 160, 23, ${reflectAlpha * 0.4})`);
      reflectGrad.addColorStop(1, `rgba(139, 69, 19, ${reflectAlpha * 0.2})`);
      ctx.fillStyle = reflectGrad;
      ctx.fillRect(0, H * 0.82, W, H * 0.18);
    }

    // 粒子
    drawParticles(ctx, progress);

    // 神庙剪影
    drawTemple(ctx, W, H, 1);

    // 前景深色过渡
    const fgGrad = ctx.createLinearGradient(0, H * 0.88, 0, H);
    fgGrad.addColorStop(0, 'rgba(8,6,4,0)');
    fgGrad.addColorStop(1, 'rgba(8,6,4,1)');
    ctx.fillStyle = fgGrad;
    ctx.fillRect(0, H * 0.88, W, H * 0.12);

    requestAnimationFrame(draw);
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  requestAnimationFrame(draw);
})();

/* ============================================================
   引言逐字显示
   ============================================================ */
(function initPrefaceAnimation() {
  const quoteEl = document.getElementById('preface-quote-text');
  if (!quoteEl) return;

  const text = quoteEl.textContent.trim();
  quoteEl.textContent = '';

  let chars = [];
  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'preface-char';
    span.textContent = text[i] === '\n' ? '' : text[i];
    if (text[i] === '\n') {
      quoteEl.appendChild(document.createElement('br'));
    } else {
      quoteEl.appendChild(span);
      chars.push(span);
    }
  }

  let started = false;
  let charIndex = 0;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        animateChars();
      }
    });
  }, { threshold: 0.3 });

  observer.observe(quoteEl);

  function animateChars() {
    if (charIndex >= chars.length) return;
    chars[charIndex].classList.add('visible');
    charIndex++;
    const delay = chars[charIndex - 1]?.textContent === '。' ||
                  chars[charIndex - 1]?.textContent === '，' ||
                  chars[charIndex - 1]?.textContent === '，' ? 120 : 45;
    setTimeout(animateChars, delay);
  }
})();

/* ============================================================
   IntersectionObserver 通用淡入
   ============================================================ */
(function initScrollAnimations() {
  const targets = document.querySelectorAll('.fade-up, .fade-in, .slide-left, .chapter-hero');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible', 'in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();

/* ============================================================
   顶部导航：滚动后出现 + 当前章节高亮
   ============================================================ */
(function initNav() {
  const nav = document.getElementById('nav');
  const navItems = document.querySelectorAll('.nav-item');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const currentChapterEl = document.getElementById('current-chapter');

  const sections = Array.from(document.querySelectorAll('section[id]'));

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });

  function update() {
    ticking = false;
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(100, (scrollY / docH) * 100);

    // 顶部进度条
    if (progressBar) progressBar.style.width = progress + '%';

    // 右侧进度线
    if (progressFill) progressFill.style.height = progress + '%';

    // 导航显示/隐藏
    if (nav) {
      if (scrollY > window.innerHeight * 0.8) {
        nav.classList.add('visible');
      } else {
        nav.classList.remove('visible');
      }
    }

    // 当前章节
    let currentId = '';
    sections.forEach(section => {
      if (section.offsetTop <= scrollY + 100) {
        currentId = section.id;
      }
    });

    navItems.forEach(item => {
      const target = item.getAttribute('data-target');
      item.classList.toggle('active', target === currentId);
    });

    if (currentChapterEl) {
      const currentSection = sections.find(s => s.id === currentId);
      if (currentSection) {
        const titleEl = currentSection.querySelector('.chapter-title, .section-title');
        currentChapterEl.textContent = titleEl ? titleEl.textContent : '';
      }
    }
  }

  // 导航点击平滑滚动
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   画廊 Tab 过滤
   ============================================================ */
(function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const items = document.querySelectorAll('.gallery-item');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      items.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-group') === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
})();

/* ============================================================
   Lightbox
   ============================================================ */
(function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');
  if (!lightbox) return;

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-item-caption');
      if (img) {
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCaption.textContent = caption ? caption.textContent : '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
})();

/* ============================================================
   视差滚动（章节头图）
   ============================================================ */
(function initParallax() {
  const heroImgs = document.querySelectorAll('.chapter-hero-img');
  if (!heroImgs.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        heroImgs.forEach(img => {
          const parent = img.closest('.chapter-hero');
          if (!parent) return;
          const rect = parent.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          const offset = (rect.top / window.innerHeight) * 20;
          img.style.transform = `scale(1.08) translateY(${offset}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  });
})();

/* ============================================================
   护城河水波动效
   ============================================================ */
(function initWaterWave() {
  const waterDividers = document.querySelectorAll('.water-divider canvas');
  waterDividers.forEach(canvas => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight || 60;
    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(212, 160, 23, 0.3)';
      ctx.lineWidth = 1;

      for (let line = 0; line < 3; line++) {
        ctx.beginPath();
        const yBase = H * (0.3 + line * 0.2);
        const amp = 3 - line * 0.8;
        const freq = 0.015 + line * 0.005;
        const speed = (1 - line * 0.2) * 0.02;

        for (let x = 0; x <= W; x += 2) {
          const y = yBase + Math.sin(x * freq + t * speed) * amp + Math.sin(x * freq * 2.3 + t * speed * 1.5) * amp * 0.4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      t++;
      requestAnimationFrame(draw);
    }
    draw();
  });
})();
