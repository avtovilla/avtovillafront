// site-enhancements.js — общие визуальные улучшения для всех страниц:
// 1) Хедер чуть сжимается при скролле
// 2) Плавное появление карточек/секций при прокрутке (с лёгким каскадом)
// 3) Плавающая кнопка "наверх" на длинных страницах

document.addEventListener('DOMContentLoaded', () => {
    // --- 1) Хедер при скролле ---
    const header = document.querySelector('.main-header');
    if (header) {
        const onHeaderScroll = () => {
            if (window.scrollY > 40) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        };
        window.addEventListener('scroll', onHeaderScroll, { passive: true });
        onHeaderScroll();
    }

    // --- 2) Кнопка "наверх" ---
    const topBtn = document.createElement('button');
    topBtn.className = 'scroll-top-btn';
    topBtn.type = 'button';
    topBtn.setAttribute('aria-label', 'Наверх');
    topBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(topBtn);
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) topBtn.classList.add('visible');
        else topBtn.classList.remove('visible');
    }, { passive: true });

    // --- 3) Плавное появление карточек при скролле (с каскадом внутри одного контейнера) ---
    const revealSelectors = '.car-card, .bank-card, .promo-card, .spec-card, .highlight-card, .review-card';
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    function initReveal(el) {
        if (el.dataset.revealInit) return;
        el.dataset.revealInit = '1';
        el.classList.add('reveal-init');
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
        const idx = siblings.indexOf(el);
        if (idx >= 0) el.style.transitionDelay = `${Math.min(idx * 60, 360)}ms`;
        io.observe(el);
    }

    function scanForReveal(root) {
        root.querySelectorAll(revealSelectors).forEach(initReveal);
    }

    scanForReveal(document);

    // Карточки часто рендерятся динамически (после fetch к Strapi) —
    // следим за появлением новых узлов и подключаем анимацию и к ним тоже.
    const mo = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches(revealSelectors)) initReveal(node);
                scanForReveal(node);
            });
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });
});
