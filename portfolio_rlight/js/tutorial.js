/**
 * ==============================================================================
 * RE-LIGHT | TUTORIAL INTERAKTIF — LUMI SI PEMANDU CAHAYA ✨
 * ==============================================================================
 * Karakter: Lumi — makhluk cahaya kecil yang hidup di ruang gelap Re-Light.
 * Terinspirasi dari companion guide seperti Paimon (Genshin Impact), Lumi
 * memandu pengunjung baru menelusuri fitur-fitur menarik website ini.
 *
 * Trigger: Otomatis muncul setelah transisi dari firstscreen.html → index.html
 *          (pertama kali). Bisa diulang via tombol ✨ FAB di pojok kanan bawah.
 * ==============================================================================
 */
(function () {
    'use strict';

    /* ===== State ===== */
    let isActive = false;
    let stepIdx = 0;
    let overlayEl = null;
    let spotlightEl = null;
    let guideEl = null;
    let prevTargetEl = null;
    let _scrollRaf = 0;
    let _keyHandler = null;
    let _scrollHandler = null;
    let _resizeHandler = null;

    /* ===== Lumi Character SVG ===== */
    const LUMI_SVG = [
        '<svg class="lumi-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">',
        '<defs>',
        '<radialGradient id="lumiG" cx="50%" cy="50%" r="50%">',
        '<stop offset="0%" stop-color="#ffd29d" stop-opacity="0.5"/>',
        '<stop offset="100%" stop-color="#e38d4a" stop-opacity="0"/></radialGradient>',
        '<radialGradient id="lumiB" cx="40%" cy="35%" r="55%">',
        '<stop offset="0%" stop-color="#ffe8c8"/>',
        '<stop offset="55%" stop-color="#f2a65a"/>',
        '<stop offset="100%" stop-color="#e38d4a"/></radialGradient>',
        '<radialGradient id="lumiW" cx="50%" cy="50%" r="50%">',
        '<stop offset="0%" stop-color="#ffd29d" stop-opacity="0.6"/>',
        '<stop offset="100%" stop-color="#e38d4a" stop-opacity="0.08"/></radialGradient>',
        '</defs>',
        // Outer glow aura
        '<circle cx="60" cy="60" r="52" fill="url(#lumiG)"/>',
        // Wings
        '<ellipse class="lumi-wing-l" cx="24" cy="48" rx="18" ry="11" fill="url(#lumiW)"/>',
        '<ellipse class="lumi-wing-r" cx="96" cy="48" rx="18" ry="11" fill="url(#lumiW)"/>',
        // Body
        '<circle cx="60" cy="60" r="30" fill="url(#lumiB)"/>',
        // Body shine
        '<ellipse cx="50" cy="48" rx="14" ry="9" fill="rgba(255,255,255,0.22)" transform="rotate(-18 50 48)"/>',
        // Eyes
        '<ellipse cx="50" cy="56" rx="5.5" ry="6.5" fill="#2a1a10"/>',
        '<circle cx="52" cy="53.5" r="2.2" fill="white"/>',
        '<ellipse cx="70" cy="56" rx="5.5" ry="6.5" fill="#2a1a10"/>',
        '<circle cx="72" cy="53.5" r="2.2" fill="white"/>',
        // Smile
        '<path d="M52 68 Q60 76 68 68" stroke="#2a1a10" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
        // Blush
        '<ellipse cx="42" cy="64" rx="6" ry="3.5" fill="rgba(255,140,90,0.3)"/>',
        '<ellipse cx="78" cy="64" rx="6" ry="3.5" fill="rgba(255,140,90,0.3)"/>',
        // Antennae
        '<path d="M60 30 Q58 22 54 18" stroke="#ffd29d" stroke-width="2" stroke-linecap="round" fill="none"/>',
        '<circle cx="54" cy="18" r="3.5" fill="#ffd29d"/>',
        '<path d="M60 30 Q62 22 66 18" stroke="#ffd29d" stroke-width="2" stroke-linecap="round" fill="none"/>',
        '<circle cx="66" cy="18" r="3" fill="#ffd29d"/>',
        '</svg>'
    ].join('');

    /* ===== Tutorial Steps ===== */
    const STEPS = [
        {
            id: 'welcome',
            target: null,
            title: 'Hai, aku Lumi! ✨',
            text: 'Selamat datang di Re-Light, ruang kreatif milik Raifan! Aku si makhluk cahaya kecil yang tinggal di sini. Biar kutunjukkan fitur-fitur seru yang bisa kamu eksplorasi — siap? Yuk mulai!',
            position: 'center'
        },
        {
            id: 'navbar',
            target: '.nav-links',
            title: 'Navigasi Cepat 🧭',
            text: 'Ini bilah navigasi utama! Dari sini kamu bisa langsung loncat ke bagian Desain, Sketsa, Fotografi, Catatan, atau Musik hanya dengan satu klik. Praktis, kan?',
            position: 'bottom',
            beforeShow: function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        {
            id: 'lighting',
            target: '.lighting-control',
            title: 'Ubah Suasana Cahaya 💡',
            text: 'Coba ubah mood ruangan! Pilih Tungsten untuk kehangatan emas, Studio untuk cahaya netral, atau Noir untuk nuansa monokrom gelap. Klik dan rasakan perubahannya!',
            position: 'bottom'
        },
        {
            id: 'sketch',
            target: '.atelier-split-grid .atelier-panel:first-child',
            title: 'Eksperimen Sketsa ✎',
            text: 'Kanvas coretan bebas! Pilih pensil, kuas cahaya, atau penghapus. Ubah warna dan ukuran kuas, lalu gambar sesukamu. Hasilnya bisa disimpan sebagai PNG juga, lho!',
            position: 'right',
            beforeShow: function () {
                if (typeof window.filterCatalog === 'function' && window.currentFilter !== 'all') {
                    window.filterCatalog('all');
                }
            }
        },
        {
            id: 'camera',
            target: '.atelier-split-grid .atelier-panel:nth-child(2)',
            title: 'Simulasi Fotografi 📷',
            text: 'Bidikan kamera jalanan! Tekan "Cekrek!" untuk menjepret foto berikutnya. Atur aperture dan ganti filter film layaknya kamera analog asli. Seru!',
            position: 'left'
        },
        {
            id: 'music',
            target: '#music-section .section-header',
            title: 'Soundtrack Ruang Kreatif 🎵',
            text: 'Playlist Spotify yang menemani proses kreatif! Klik lagu di daftar koleksi untuk memutarnya langsung di pemutar embed. Cocok menemanimu menjelajah Re-Light.',
            position: 'top'
        },
        {
            id: 'farewell',
            target: null,
            title: 'Selamat Menjelajah! 🌟',
            text: 'Itu dia fitur-fitur seru di Re-Light! Sekarang giliran kamu eksplorasi sesukanya. Kalau butuh aku lagi, klik tombol ✨ di pojok kanan bawah, ya. Sampai jumpa dan selamat berkarya!',
            position: 'center',
            beforeShow: function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    ];

    /* ===== Public API ===== */

    /**
     * Cek apakah tutorial perlu ditampilkan otomatis
     * (dipanggil oleh main.js setelah animasi entrance selesai)
     */
    window.tutorialShouldAutoStart = function () {
        try {
            var trigger = sessionStorage.getItem('relight_show_tutorial');
            var done = localStorage.getItem('relight_tutorial_done');
            return trigger === '1' && !done;
        } catch (e) {
            return false;
        }
    };

    /**
     * Mulai tutorial (dipanggil otomatis atau via FAB)
     */
    window.startTutorial = function () {
        if (isActive) return;
        isActive = true;
        stepIdx = 0;

        try { sessionStorage.removeItem('relight_show_tutorial'); } catch (e) { /* abaikan */ }

        buildDOM();
        requestAnimationFrame(function () {
            overlayEl.classList.add('is-visible');
            showStep(0);
        });
    };

    /* ===== DOM Construction ===== */

    function buildDOM() {
        // Overlay — menangkap klik di area gelap
        overlayEl = document.createElement('div');
        overlayEl.className = 'tutorial-overlay';
        overlayEl.id = 'tutorialOverlay';

        // Spotlight — box-shadow membuat efek sorotan
        spotlightEl = document.createElement('div');
        spotlightEl.className = 'tutorial-spotlight';
        overlayEl.appendChild(spotlightEl);

        // Guide container (Lumi + Speech Bubble)
        guideEl = document.createElement('div');
        guideEl.className = 'tutorial-guide';
        guideEl.innerHTML = [
            '<div class="tutorial-lumi">' + LUMI_SVG + '</div>',
            '<div class="tutorial-bubble">',
            '  <div class="tutorial-bubble-header">',
            '    <span class="tutorial-bubble-label">✨ Lumi</span>',
            '    <button type="button" class="tutorial-skip-btn" id="tutSkipBtn">Lewati</button>',
            '  </div>',
            '  <h3 class="tutorial-bubble-title" id="tutTitle"></h3>',
            '  <p class="tutorial-bubble-text" id="tutText"></p>',
            '  <div class="tutorial-bubble-footer">',
            '    <div class="tutorial-dots" id="tutDots"></div>',
            '    <div class="tutorial-nav-btns">',
            '      <button type="button" class="tutorial-btn tutorial-prev" id="tutPrev">← Kembali</button>',
            '      <button type="button" class="tutorial-btn tutorial-next" id="tutNext">Lanjut →</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');
        overlayEl.appendChild(guideEl);

        document.body.appendChild(overlayEl);

        // Buat indikator langkah (dots)
        var dotsEl = document.getElementById('tutDots');
        for (var i = 0; i < STEPS.length; i++) {
            var dot = document.createElement('span');
            dot.className = 'tutorial-dot';
            dot.setAttribute('data-step', String(i));
            if (i === 0) dot.classList.add('active');
            dotsEl.appendChild(dot);
        }

        // Event Listeners
        document.getElementById('tutSkipBtn').onclick = function () { endTutorial(false); };
        document.getElementById('tutPrev').onclick = function () { goStep(stepIdx - 1); };
        document.getElementById('tutNext').onclick = function () { goStep(stepIdx + 1); };

        // Klik pada dot untuk loncat langsung ke langkah tertentu
        dotsEl.addEventListener('click', function (e) {
            var dot = e.target.closest('.tutorial-dot');
            if (dot) {
                var target = parseInt(dot.getAttribute('data-step'), 10);
                if (!isNaN(target)) goStep(target);
            }
        });

        // Klik pada area gelap overlay — tidak melakukan apa-apa
        overlayEl.addEventListener('click', function (e) {
            if (e.target === overlayEl) {
                // Biarkan — pengguna harus klik "Lanjut" atau "Lewati"
            }
        });

        // Keyboard handler
        _keyHandler = function (e) {
            if (!isActive) return;
            if (e.key === 'Escape') {
                e.preventDefault(); e.stopPropagation();
                endTutorial(false);
            } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                e.preventDefault(); e.stopPropagation();
                goStep(stepIdx + 1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault(); e.stopPropagation();
                goStep(stepIdx - 1);
            }
        };
        document.addEventListener('keydown', _keyHandler, true);

        // Scroll handler — reposisi spotlight saat scroll
        _scrollHandler = function () {
            if (!isActive) return;
            cancelAnimationFrame(_scrollRaf);
            _scrollRaf = requestAnimationFrame(function () { repositionCurrent(); });
        };
        window.addEventListener('scroll', _scrollHandler, { passive: true });

        // Resize handler
        _resizeHandler = function () {
            if (!isActive) return;
            repositionCurrent();
        };
        window.addEventListener('resize', _resizeHandler, { passive: true });
    }

    function destroyDOM() {
        if (_keyHandler) document.removeEventListener('keydown', _keyHandler, true);
        if (_scrollHandler) window.removeEventListener('scroll', _scrollHandler);
        if (_resizeHandler) window.removeEventListener('resize', _resizeHandler);
        _keyHandler = null;
        _scrollHandler = null;
        _resizeHandler = null;

        clearHighlight();

        if (overlayEl && overlayEl.parentNode) {
            overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
        spotlightEl = null;
        guideEl = null;
    }

    /* ===== Step Navigation ===== */

    function goStep(idx) {
        if (idx < 0) return;
        if (idx >= STEPS.length) {
            endTutorial(true);
            return;
        }
        stepIdx = idx;
        showStep(idx);
    }

    function showStep(idx) {
        var step = STEPS[idx];
        if (!step) return;

        // Update konten bubble
        var titleEl = document.getElementById('tutTitle');
        var textEl = document.getElementById('tutText');
        if (titleEl) titleEl.textContent = step.title;
        if (textEl) textEl.textContent = step.text;

        // Update tombol navigasi
        var prevBtn = document.getElementById('tutPrev');
        var nextBtn = document.getElementById('tutNext');
        if (prevBtn) prevBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
        if (nextBtn) nextBtn.textContent = idx === STEPS.length - 1 ? 'Selesai ✓' : 'Lanjut →';

        // Update dots
        var dots = document.querySelectorAll('.tutorial-dot');
        for (var i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('active', i === idx);
            dots[i].classList.toggle('done', i < idx);
        }

        // Jalankan beforeShow jika ada (misalnya scroll ke section)
        if (step.beforeShow) {
            step.beforeShow();
        }

        // Posisikan elemen dengan delay agar scroll selesai
        var delay = step.beforeShow ? 500 : 60;
        setTimeout(function () { positionElements(step); }, delay);
    }

    function endTutorial(completed) {
        if (!isActive) return;
        isActive = false;

        if (overlayEl) {
            overlayEl.classList.remove('is-visible');
            overlayEl.classList.add('is-leaving');
            setTimeout(function () { destroyDOM(); }, 380);
        } else {
            destroyDOM();
        }

        if (completed) {
            try { localStorage.setItem('relight_tutorial_done', '1'); } catch (e) { /* abaikan */ }
            if (typeof window.showToast === 'function') {
                window.showToast('Tutorial selesai! Klik ✨ di pojok kanan bawah untuk mengulang.');
            }
        }

        // Tampilkan FAB setelah tutorial selesai atau di-skip
        var fab = document.getElementById('tutorialFab');
        if (fab) fab.classList.add('is-visible');
    }

    /* ===== Positioning ===== */

    function repositionCurrent() {
        var step = STEPS[stepIdx];
        if (!step || !step.target) return;
        var target = document.querySelector(step.target);
        if (target) {
            positionWithTarget(target, step);
        }
    }

    function positionElements(step) {
        if (!step.target) {
            // Mode tengah: Lumi + bubble di center layar
            clearHighlight();
            spotlightEl.style.opacity = '0';
            guideEl.className = 'tutorial-guide pos-center is-active';
            guideEl.style.top = '';
            guideEl.style.left = '';
            return;
        }

        var targetEl = document.querySelector(step.target);
        if (!targetEl) {
            // Target tidak ditemukan — fallback ke center
            positionElements({ id: step.id, target: null, title: step.title, text: step.text, position: 'center' });
            return;
        }

        // Scroll target ke view jika di luar viewport
        var rect = targetEl.getBoundingClientRect();
        if (rect.top < 80 || rect.bottom > window.innerHeight - 60) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(function () { positionWithTarget(targetEl, step); }, 420);
        } else {
            positionWithTarget(targetEl, step);
        }
    }

    function positionWithTarget(targetEl, step) {
        var isMobile = window.innerWidth < 768;
        var rect = targetEl.getBoundingClientRect();
        var pad = 10;

        // Update spotlight (sorotan)
        spotlightEl.style.top = (rect.top - pad) + 'px';
        spotlightEl.style.left = (rect.left - pad) + 'px';
        spotlightEl.style.width = (rect.width + pad * 2) + 'px';
        spotlightEl.style.height = (rect.height + pad * 2) + 'px';
        spotlightEl.style.opacity = '1';

        // Highlight target
        highlightTarget(targetEl);

        // Tentukan posisi guide
        var pos = isMobile ? 'bottom' : (step.position || 'bottom');
        guideEl.className = 'tutorial-guide pos-' + pos + ' is-active';

        // Hitung posisi guide
        var guideW = Math.min(440, window.innerWidth - 32);
        var guideH = 240; // estimasi
        var top = 0;
        var left = 0;

        switch (pos) {
            case 'bottom':
                top = rect.bottom + pad + 18;
                left = rect.left + rect.width / 2 - guideW / 2;
                break;
            case 'top':
                top = rect.top - pad - guideH - 18;
                left = rect.left + rect.width / 2 - guideW / 2;
                break;
            case 'right':
                top = rect.top + rect.height / 2 - guideH / 2;
                left = rect.right + pad + 18;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - guideH / 2;
                left = rect.left - pad - guideW - 18;
                break;
        }

        // Clamp agar tidak keluar layar
        left = Math.max(16, Math.min(left, window.innerWidth - guideW - 16));
        top = Math.max(84, Math.min(top, window.innerHeight - guideH - 16));

        // Jika top masih terlalu tinggi di mobile, pindah ke bawah target
        if (top < 84) {
            top = rect.bottom + pad + 18;
        }

        guideEl.style.top = top + 'px';
        guideEl.style.left = left + 'px';
    }

    function highlightTarget(el) {
        clearHighlight();
        el.setAttribute('data-tutorial-highlight', '1');
        prevTargetEl = el;
    }

    function clearHighlight() {
        if (prevTargetEl) {
            prevTargetEl.removeAttribute('data-tutorial-highlight');
            prevTargetEl = null;
        }
    }

    /* ===== FAB Initialization ===== */

    /**
     * Inisialisasi tombol FAB (dipanggil setelah DOMContentLoaded)
     */
    window.initTutorialFab = function () {
        var fab = document.getElementById('tutorialFab');
        if (!fab) return;

        // Tampilkan FAB jika tutorial sudah pernah selesai atau bukan dari intro
        try {
            var done = localStorage.getItem('relight_tutorial_done');
            var isFromIntro = sessionStorage.getItem('relight_show_tutorial') === '1';
            if (done || !isFromIntro) {
                fab.classList.add('is-visible');
            }
        } catch (e) {
            fab.classList.add('is-visible');
        }
    };

    /**
     * Reset tutorial (dipanggil dari FAB)
     */
    window.replayTutorial = function () {
        try { localStorage.removeItem('relight_tutorial_done'); } catch (e) { /* abaikan */ }
        window.startTutorial();
    };

})();
