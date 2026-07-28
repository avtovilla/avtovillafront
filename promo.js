const PROMO_STRAPI_URL = 'http://localhost:1337';

// Универсальный разбор поля медиа Strapi: одиночный файл, массив файлов,
// формат v5 (плоский объект) и формат v4 ({ data: {...} } / { data: [...] }).
function resolvePromoMedia(rawField) {
    if (!rawField) return null;

    let candidate = rawField;

    // v4-стиль: { data: {...} } или { data: [...] }
    if (candidate.data !== undefined) {
        candidate = candidate.data;
    }

    // Если это массив — берём первый файл
    if (Array.isArray(candidate)) {
        candidate = candidate[0];
    }
    if (!candidate) return null;

    // v4-стиль вложенного элемента: { id, attributes: {...} }
    const data = candidate.attributes ? { ...candidate.attributes, id: candidate.id } : candidate;
    if (!data || !data.url) return null;

    return { url: data.url, mime: data.mime || '' };
}

// Универсальный разбор связи related_car: поддержка v4 ({ data: {...} }) и v5 (плоский объект)
function resolvePromoRelatedCar(rawField) {
    if (!rawField) return null;
    let candidate = rawField;
    if (candidate.data !== undefined) candidate = candidate.data;
    if (Array.isArray(candidate)) candidate = candidate[0];
    if (!candidate) return null;
    const data = candidate.attributes ? { ...candidate.attributes, id: candidate.id, documentId: candidate.documentId } : candidate;
    const id = data.documentId || data.id;
    return id ? { id } : null;
}

// --- ЗАГРУЗКА АКЦИЙ ---
async function fetchPromos() {
    const grid = document.getElementById('promo-grid');
    try {
        const response = await fetch(`${PROMO_STRAPI_URL}/api/promos?populate=*`);
        if (!response.ok) throw new Error('Ошибка связи с сервером');

        const resData = await response.json();
        const promos = resData.data;

        if (promos && promos[0]) {
            console.log('🔍 [Promo] Пример сырых данных акции из Strapi:', promos[0]);
        }

        renderPromos(promos);
    } catch (error) {
        console.error(error);
        if (grid) {
            grid.innerHTML = `
                <div class="loading-spinner" style="color: #ff4d4d; width: 100%; text-align: center; padding: 20px;">
                    <p>Не удалось загрузить акции. Убедитесь, что бэкенд Strapi запущен.</p>
                </div>
            `;
        }
    }
}

function formatExpiryDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderPromos(promos) {
    const grid = document.getElementById('promo-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Скрываем неактивные акции (is_active = false)
    const activePromos = (promos || []).filter(p => {
        const fields = p.attributes ? p.attributes : p;
        return fields.is_active !== false;
    });

    if (activePromos.length === 0) {
        grid.innerHTML = '<div class="loading-spinner"><p>Сейчас действующих акций нет. Загляните позже!</p></div>';
        return;
    }

    activePromos.forEach(promo => {
        const fields = promo.attributes ? promo.attributes : promo;
        const title = fields.title || 'Акция';
        const description = fields.Description || '';
        const discount = fields.discount || '';
        const expiryFormatted = formatExpiryDate(fields.valid_until);
        const promoId = promo.documentId || promo.id || fields.documentId || fields.id;

        let imageUrl = 'placeholder-car.jpg';
        let mediaMime = '';
        const resolvedMedia = resolvePromoMedia(fields.Image);
        if (resolvedMedia) {
            imageUrl = `${PROMO_STRAPI_URL}${resolvedMedia.url}`;
            mediaMime = resolvedMedia.mime;
        }
        const isVideo = mediaMime.startsWith('video/');
        const mediaMarkup = isVideo
            ? `<video src="${imageUrl}" class="promo-image" autoplay muted loop playsinline></video>`
            : `<img src="${imageUrl}" alt="${title}" class="promo-image" loading="lazy">`;

        // Если акция привязана к конкретному авто — определяем его id для перехода на car.html
        const relatedCar = resolvePromoRelatedCar(fields.car);
        const relatedCarId = relatedCar ? relatedCar.id : null;

        // Короткое превью описания для карточки
        const shortDesc = description.length > 140 ? description.slice(0, 140).trim() + '…' : description;

        const cardHtml = `
            <div class="promo-card" data-promo-id="${promoId}" ${relatedCarId ? `data-related-car-id="${relatedCarId}"` : ''}>
                <div class="promo-image-container">
                    ${discount ? `<span class="promo-discount-badge">${discount}</span>` : ''}
                    ${mediaMarkup}
                </div>
                <div class="promo-info">
                    <h3 class="promo-title">${title}</h3>
                    <p class="promo-desc">${shortDesc}</p>
                    ${expiryFormatted ? `<span class="promo-expiry">Акция действует до ${expiryFormatted}</span>` : ''}
                    <div class="promo-btn">${relatedCarId ? 'Смотреть авто' : 'Подробнее'}</div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });

    // Клик по карточке: если акция привязана к авто — переходим на страницу авто,
    // иначе открываем модалку с полным описанием
    document.querySelectorAll('.promo-card').forEach(card => {
        card.addEventListener('click', () => {
            const relatedCarId = card.getAttribute('data-related-car-id');
            if (relatedCarId) {
                localStorage.setItem('selectedCarId', relatedCarId);
                window.location.href = `car.html?id=${relatedCarId}`;
                return;
            }
            const id = card.getAttribute('data-promo-id');
            const promo = activePromos.find(p => {
                const f = p.attributes ? p.attributes : p;
                const pid = p.documentId || p.id || f.documentId || f.id;
                return String(pid) === String(id);
            });
            if (promo) openPromoDetail(promo);
        });
    });

    // Подстраховка: некоторые браузеры не запускают автовоспроизведение видео,
    // вставленного через innerHTML, пока muted/play не заданы явно через JS
    grid.querySelectorAll('video.promo-image').forEach(videoEl => {
        videoEl.muted = true;
        videoEl.play().catch(() => {});
    });
}

function openPromoDetail(promo) {
    const fields = promo.attributes ? promo.attributes : promo;
    const title = fields.title || 'Акция';
    const description = fields.Description || '';
    const expiryFormatted = formatExpiryDate(fields.valid_until);

    const detailModal = document.getElementById('promo-detail-modal');
    const detailTitle = document.getElementById('promo-detail-title');
    const detailDesc = document.getElementById('promo-detail-desc');
    const detailExpiry = document.getElementById('promo-detail-expiry');

    if (!detailModal) return;

    detailTitle.innerText = title;
    detailDesc.innerText = description;
    if (expiryFormatted) {
        detailExpiry.innerText = `Акция действует до ${expiryFormatted}`;
        detailExpiry.style.display = 'block';
    } else {
        detailExpiry.style.display = 'none';
    }

    detailModal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchPromos();

    const closeDetailBtn = document.querySelector('#promo-detail-modal .close-modal');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            document.getElementById('promo-detail-modal').style.display = 'none';
        });
    }

    const detailModal = document.getElementById('promo-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) detailModal.style.display = 'none';
        });
    }

    // Кнопка "Узнать больше / Оставить заявку" внутри детальной модалки акции
    const promoRequestBtn = document.getElementById('promo-detail-request-btn');
    if (promoRequestBtn) {
        promoRequestBtn.addEventListener('click', () => {
            document.getElementById('promo-detail-modal').style.display = 'none';
            const mainModal = document.getElementById('modal');
            const mainModalTitle = document.getElementById('modal-title');
            if (mainModal && mainModalTitle) {
                mainModalTitle.innerText = 'Заявка по акции: ' + (document.getElementById('promo-detail-title').innerText || '');
                mainModal.style.display = 'flex';
            }
        });
    }
});
