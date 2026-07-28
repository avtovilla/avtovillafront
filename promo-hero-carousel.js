const HERO_CAROUSEL_STRAPI_URL = 'https://avtovillashymkent.onrender.com';
const HERO_CAROUSEL_INTERVAL = 5000; // 5 секунд на слайд

// Универсальный разбор поля медиа Strapi: одиночный файл, массив файлов,
// формат v5 (плоский объект) и формат v4 ({ data: {...} } / { data: [...] }).
function resolveHeroCarouselMedia(rawField) {
    if (!rawField) return null;
    let candidate = rawField;
    if (candidate.data !== undefined) candidate = candidate.data;
    if (Array.isArray(candidate)) candidate = candidate[0];
    if (!candidate) return null;
    const data = candidate.attributes ? { ...candidate.attributes, id: candidate.id } : candidate;
    if (!data || !data.url) return null;
    return { url: data.url, mime: data.mime || '' };
}

// Универсальный разбор связи related_car
function resolveHeroCarouselRelatedCar(rawField) {
    if (!rawField) return null;
    let candidate = rawField;
    if (candidate.data !== undefined) candidate = candidate.data;
    if (Array.isArray(candidate)) candidate = candidate[0];
    if (!candidate) return null;
    const data = candidate.attributes ? { ...candidate.attributes, id: candidate.id, documentId: candidate.documentId } : candidate;
    const id = data.documentId || data.id;
    return id ? { id } : null;
}

let heroCarouselPromos = [];
let heroCarouselIndex = 0;
let heroCarouselTimer = null;

async function initHeroPromoCarousel() {
    const container = document.getElementById('promo-hero-carousel');
    if (!container) return;

    try {
        const response = await fetch(`${HERO_CAROUSEL_STRAPI_URL}/api/promos?populate=*`);
        if (!response.ok) throw new Error('Ошибка связи с сервером');

        const resData = await response.json();
        const allPromos = resData.data || [];

        heroCarouselPromos = allPromos.filter(p => {
            const fields = p.attributes ? p.attributes : p;
            return fields.is_active !== false;
        });

        if (heroCarouselPromos.length === 0) {
            container.style.display = 'none';
            return;
        }

        if (heroCarouselPromos[0]) {
            console.log('🔍 [Promo Hero] Пример сырых данных акции из Strapi:', heroCarouselPromos[0]);
        }

        renderHeroCarouselSlide();

        if (heroCarouselPromos.length > 1) {
            heroCarouselTimer = setInterval(nextHeroCarouselSlide, HERO_CAROUSEL_INTERVAL);
        }
    } catch (error) {
        console.error('Не удалось загрузить акции для баннера:', error);
        container.style.display = 'none';
    }
}

function nextHeroCarouselSlide() {
    heroCarouselIndex = (heroCarouselIndex + 1) % heroCarouselPromos.length;
    renderHeroCarouselSlide();
}

function renderHeroCarouselSlide() {
    const container = document.getElementById('promo-hero-carousel');
    if (!container) return;

    const promo = heroCarouselPromos[heroCarouselIndex];
    const fields = promo.attributes ? promo.attributes : promo;
    const title = fields.title || 'Акция';
    const discount = fields.discount || '';
    const promoId = promo.documentId || promo.id || fields.documentId || fields.id;

    let mediaUrl = '';
    let mediaMime = '';
    const resolvedMedia = resolveHeroCarouselMedia(fields.Image);
    if (resolvedMedia) {
        mediaUrl = `${HERO_CAROUSEL_STRAPI_URL}${resolvedMedia.url}`;
        mediaMime = resolvedMedia.mime;
    }
    const isVideo = mediaMime.startsWith('video/');
    const mediaMarkup = mediaUrl
        ? (isVideo
            ? `<video src="${mediaUrl}" class="promo-hero-media-el" autoplay muted loop playsinline></video>`
            : `<img src="${mediaUrl}" alt="${title}" class="promo-hero-media-el">`)
        : `<div class="promo-hero-media-placeholder">AUTO VILLA</div>`;

    // Определяем, куда вести при клике: на конкретное авто или на общую страницу акций
    const relatedCar = resolveHeroCarouselRelatedCar(fields.car);
    const relatedCarId = relatedCar ? relatedCar.id : null;
    const linkHref = relatedCarId ? `car.html?id=${relatedCarId}` : 'promo.html';

    const dotsMarkup = heroCarouselPromos.map((_, i) =>
        `<span class="promo-hero-dot ${i === heroCarouselIndex ? 'active' : ''}" data-slide-index="${i}"></span>`
    ).join('');

    container.innerHTML = `
        <a href="${linkHref}" class="promo-hero-carousel-card" ${relatedCarId ? `onclick="localStorage.setItem('selectedCarId', '${relatedCarId}')"` : ''}>
            <div class="promo-hero-media">
                ${discount ? `<span class="promo-hero-badge">${discount}</span>` : ''}
                ${mediaMarkup}
            </div>
            <div class="promo-hero-info">
                <h4 class="promo-hero-title">${title}</h4>
                <span class="promo-hero-link">${relatedCarId ? 'Смотреть авто →' : 'Подробнее →'}</span>
            </div>
        </a>
        <div class="promo-hero-dots">${dotsMarkup}</div>
    `;

    container.querySelectorAll('.promo-hero-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            heroCarouselIndex = parseInt(dot.getAttribute('data-slide-index'), 10);
            renderHeroCarouselSlide();
            if (heroCarouselTimer) {
                clearInterval(heroCarouselTimer);
                heroCarouselTimer = setInterval(nextHeroCarouselSlide, HERO_CAROUSEL_INTERVAL);
            }
        });
    });

    // Подстраховка: некоторые браузеры не запускают автовоспроизведение видео,
    // вставленного через innerHTML, пока muted/play не заданы явно через JS
    const videoEl = container.querySelector('video.promo-hero-media-el');
    if (videoEl) {
        videoEl.muted = true;
        videoEl.play().catch(() => {});
    }
}

document.addEventListener('DOMContentLoaded', initHeroPromoCarousel);
