/**
 * ==============================================================================
 * RE-LIGHT | HALAMAN PEMBUKA (FIRSTSCREEN.HTML)
 * ==============================================================================
 * Mengatur tampilan awal ruang gelap, sinkronisasi konten & suhu cahaya,
 * interaksi sakelar Re-Light, serta transisi halus menuju index.html.
 * ==============================================================================
 */

let introCurrentTheme = 'tungsten';
let introParticleRgb = '242, 154, 82';
let isIntroTransitioning = false;
let introAudioCtx = null;

document.addEventListener('DOMContentLoaded', () => {
    initIntroTheme();
    initIntroContent();
    initIntroInteractions();
    initIntroParticleCanvas();
    safeIntroCreateIcons();

    requestAnimationFrame(() => {
        document.body.classList.add('intro-ready');
    });
});

// Pastikan halaman kembali normal jika pengunjung menekan tombol Back browser
window.addEventListener('pageshow', (event) => {
    if (event.persisted || isIntroTransitioning) {
        isIntroTransitioning = false;
        document.body.classList.remove('is-igniting');
        document.body.classList.add('intro-ready');
        const btn = document.getElementById('enterStudioBtn');
        if (btn) btn.disabled = false;
    }
});

function safeIntroCreateIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function initIntroTheme() {
    const preTheme = document.documentElement.getAttribute('data-initial-theme');
    let initial = preTheme || 'tungsten';
    try {
        const stored = sessionStorage.getItem('relight_theme');
        if (stored && ['tungsten', 'studio', 'noir'].includes(stored)) {
            initial = stored;
        }
    } catch (e) {
        // Fallback ke default tungsten
    }
    setIntroLighting(initial);
}

function setIntroLighting(theme, btnEl) {
    if (!['tungsten', 'studio', 'noir'].includes(theme)) return;
    introCurrentTheme = theme;

    document.body.setAttribute('data-lighting', theme);
    document.querySelectorAll('.light-option').forEach(b => b.classList.remove('active'));
    if (btnEl) {
        btnEl.classList.add('active');
    } else {
        const target = document.querySelector(`.light-option[data-theme="${theme}"]`);
        if (target) target.classList.add('active');
    }

    const rgbMap = {
        tungsten: '242, 154, 82',
        studio: '232, 228, 220',
        noir: '194, 189, 178'
    };
    introParticleRgb = rgbMap[theme] || rgbMap.tungsten;

    try {
        sessionStorage.setItem('relight_theme', theme);
    } catch (e) {
        // Abaikan jika sessionStorage tidak tersedia
    }
}

function initIntroContent() {
    const teks = window.dataTeksUtama || {};
    const profil = window.dataProfil || {};

    setIntroText('introBrandTitle', teks.namaBrand || 'Re-Light');
    setIntroText('introBrandEdition', teks.edisiBrand || 'Portfolio');
    setIntroText('introMetaBadge', (teks.badgeKecil || 'Arsip Visual').trim());
    setIntroText('introCreatorName', profil.nama || 'Raifan');

    if (teks.deskripsiPengantar) {
        setIntroText('introQuoteDisplay', teks.deskripsiPengantar);
    }

    const designCount = Array.isArray(window.dataKaryaDesain) ? window.dataKaryaDesain.length : 0;
    const sketchCount = Array.isArray(window.dataKaryaSketsa) ? window.dataKaryaSketsa.length : 0;
    const photoCount = Array.isArray(window.dataKaryaFotografi) ? window.dataKaryaFotografi.length : 0;
    const totalCount = designCount + sketchCount + photoCount;

    if (totalCount > 0) {
        setIntroText(
            'introArchiveSummary',
            `${designCount} Desain • ${sketchCount} Sketsa • ${photoCount} Fotografi • Catatan & Musik`
        );
    }
}

function setIntroText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
        el.innerText = value;
    }
}

function initIntroInteractions() {
    const stage = document.getElementById('introStage');
    const enterBtn = document.getElementById('enterStudioBtn');

    // Efek kilau cahaya mengikuti kursor pada kartu tombol & stage
    document.addEventListener('mousemove', (e) => {
        const sheen = e.target.closest('.interactive-sheen');
        if (sheen) {
            const rect = sheen.getBoundingClientRect();
            sheen.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            sheen.style.setProperty('--my', `${e.clientY - rect.top}px`);
        }

        if (stage) {
            const rect = stage.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            stage.style.setProperty('--sx', `${Math.max(0, Math.min(100, x)).toFixed(1)}%`);
            stage.style.setProperty('--sy', `${Math.max(0, Math.min(100, y)).toFixed(1)}%`);
        }
    }, { passive: true });

    // Saat kursor mendekat / fokus pada tombol sakelar, filamen bohlam ikut menghangat
    if (enterBtn && stage) {
        const activateHover = () => stage.classList.add('is-cta-hovered');
        const deactivateHover = () => stage.classList.remove('is-cta-hovered');

        enterBtn.addEventListener('mouseenter', activateHover);
        enterBtn.addEventListener('mouseleave', deactivateHover);
        enterBtn.addEventListener('focus', activateHover);
        enterBtn.addEventListener('blur', deactivateHover);
    }

    // Dukungan keyboard: tekan Enter atau Spasi untuk menyalakan cahaya & masuk
    window.addEventListener('keydown', (e) => {
        if (isIntroTransitioning) return;

        const activeEl = document.activeElement;
        const isOnLightingBtn = activeEl && activeEl.classList.contains('light-option');

        if ((e.key === 'Enter' || e.key === ' ') && !isOnLightingBtn) {
            e.preventDefault();
            enterMainPortfolio();
        }
    });
}

function enterMainPortfolio() {
    if (isIntroTransitioning) return;
    isIntroTransitioning = true;

    const btn = document.getElementById('enterStudioBtn');
    if (btn) btn.disabled = true;

    playLightSwitchSound();

    try {
        sessionStorage.setItem('relight_intro_entered', String(Date.now()));
        sessionStorage.setItem('relight_theme', introCurrentTheme);
        sessionStorage.setItem('relight_show_tutorial', '1');
    } catch (e) {
        // Fallback tetap aman menggunakan query parameter
    }

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('is-igniting');

    const targetUrl = `index.html?entered=1&theme=${encodeURIComponent(introCurrentTheme)}`;
    const delayMs = reducedMotion ? 40 : 540;

    setTimeout(() => {
        window.location.href = targetUrl;
    }, delayMs);
}

/**
 * Efek suara klik sakelar lampu mekanik lembut (100% Offline via Web Audio API)
 */
function playLightSwitchSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!introAudioCtx) {
            introAudioCtx = new AudioContext();
        }
        if (introAudioCtx.state === 'suspended') {
            introAudioCtx.resume();
        }

        const now = introAudioCtx.currentTime;
        const osc = introAudioCtx.createOscillator();
        const gain = introAudioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.045);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(introAudioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.055);
    } catch (e) {
        // Hening jika audio diblokir oleh kebijakan browser
    }
}

/**
 * Kanvas Partikel Cahaya Ruang Gelap (Menyamai Mesin Motion Graphics Utama)
 */
function initIntroParticleCanvas() {
    const canvas = document.getElementById('introMotionCanvas');
    if (!canvas) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const pointer = { x: width * 0.5, y: height * 0.45, active: false };
    window.addEventListener('mousemove', (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.active = true;
    }, { passive: true });

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });

    const count = Math.min(44, Math.max(20, Math.floor(width / 34)));
    const motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.1 + 0.6,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.28 + 0.07),
        alpha: Math.random() * 0.42 + 0.12,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.018 + 0.008
    }));

    function animate() {
        if (!document.hidden) {
            ctx.clearRect(0, 0, width, height);
            const speedBoost = isIntroTransitioning ? 2.4 : 1;

            for (let i = 0; i < motes.length; i++) {
                const m = motes[i];
                m.phase += m.speed * speedBoost;
                m.x += (m.vx + Math.sin(m.phase) * 0.11) * speedBoost;
                m.y += m.vy * speedBoost;

                if (pointer.active && !isIntroTransitioning) {
                    const dx = m.x - pointer.x;
                    const dy = m.y - pointer.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 18000 && distSq > 1) {
                        const force = (1 - distSq / 18000) * 0.42;
                        m.x += (dx / Math.sqrt(distSq)) * force;
                        m.y += (dy / Math.sqrt(distSq)) * force;
                    }
                }

                if (m.y < -10) {
                    m.y = height + 10;
                    m.x = Math.random() * width;
                }
                if (m.x < -10) m.x = width + 10;
                if (m.x > width + 10) m.x = -10;

                const twinkle = m.alpha * (0.65 + 0.35 * Math.sin(m.phase * 1.4));
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${introParticleRgb}, ${twinkle.toFixed(3)})`;
                ctx.fill();

                if (m.r > 1.75) {
                    ctx.beginPath();
                    ctx.arc(m.x, m.y, m.r * 3.1, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${introParticleRgb}, ${(twinkle * 0.14).toFixed(3)})`;
                    ctx.fill();
                }
            }
        }

        window.requestAnimationFrame(animate);
    }

    window.requestAnimationFrame(animate);
}
