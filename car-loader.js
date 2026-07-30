const STRAPI_URL = 'https://avtovillashymkent.onrender.com';

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОТРИСОВКИ RICH TEXT (BLOCKS) ИЗ STRAPI V5 ---
function renderStrapiBlocks(blocks) {
    if (!blocks) return 'Техническое описание готовится к публикации.';
    if (typeof blocks === 'string') return blocks;

    if (Array.isArray(blocks)) {
        return blocks.map(block => {
            const parseChildren = (children) => {
                if (!children) return '';
                return children.map(child => {
                    let text = child.text || '';
                    if (child.bold) text = `<strong>${text}</strong>`;
                    if (child.italic) text = `<em></em>${text}</em>`;
                    return text;
                }).join('');
            };

            switch (block.type) {
                case 'paragraph':
                    return `<p style="margin-bottom: 15px; line-height: 1.7;">${parseChildren(block.children)}</p>`;
                case 'heading':
                    const level = block.level || 2;
                    return `<h${level} style="margin-top: 25px; margin-bottom: 12px; color: #fff; font-weight: 600;">${parseChildren(block.children)}</h${level}>`;
                case 'list':
                    const listTag = block.format === 'ordered' ? 'ol' : 'ul';
                    const listItems = block.children ? block.children.map(item => {
                        return `<li style="margin-bottom: 8px; padding-left: 5px;">${parseChildren(item.children)}</li>`;
                    }).join('') : '';
                    return `<${listTag} style="padding-left: 25px; margin-bottom: 15px; color: #b1bdcf;">${listItems}</${listTag}>`;
                default:
                    const fallbackText = parseChildren(block.children);
                    return fallbackText ? `<p style="margin-bottom: 15px;">${fallbackText}</p>` : '';
            }
        }).join('');
    }
    return 'Техническое описание готовится к публикации.';
}

async function initCarPage() {
    const container = document.getElementById('car-details');

    let carId = localStorage.getItem('selectedCarId');
    if (!carId || carId === 'undefined' || carId === 'null') {
        const params = new URLSearchParams(window.location.search);
        carId = params.get('id');
    }

    if (!carId || carId === 'undefined' || carId === 'null') {
        container.innerHTML = `
            <div style="text-align: center; color: white; padding: 50px;">
                <h2>Автомобиль не выбран</h2>
                <p>Вернитесь на главную страницу для выбора интересующей вас модели.</p>
                <a href="index.html" style="color: #0074d9; font-weight: bold; text-decoration: none;">Перейти в каталог</a>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`${STRAPI_URL}/api/cars/${carId}?populate=*`);
        if (!response.ok) throw new Error(`Статус ответа сервера: ${response.status}`);

        const result = await response.json();
        const car = result.data;

        if (!car) {
            container.innerHTML = `<h2 style="color: white; text-align: center;">Модель отсутствует в базе данных автосалона.</h2>`;
            return;
        }

        renderCar(car);

    } catch (error) {
        console.error("Ошибка загрузки карточки автомобиля:", error);
        container.innerHTML = `
            <div style="color: white; text-align: center; padding: 30px;">
                <h2>Не удалось загрузить данные</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderCar(car) {
    const container = document.getElementById('car-details');
    const data = car.attributes ? car.attributes : car;

    const title = data.Title || data.title || 'Модель автомобиля';
    const year = data.year || '';
    const engine = data.engine || '';
    const transmission = data.transmission || '';
    const driveType = data.drive_type || '';
    const fuelType = data.fuel_type || '';
    const power = data.power || '';
    const mileage = (data.mileage !== undefined && data.mileage !== null && data.mileage !== '') ? data.mileage : '';
    const color = data.color || '';
    const bodyType = data.body_type || '';

    const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

    // Иконки для карточек характеристик (единый набор simple-line SVG в стиле сайта)
    const specIcons = {
        year: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
        engine: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 8V4h4l3 3v5h-2M14 8H8L4 12v5h2M14 8v9M4 17h16M8 12v5"/></svg>',
        transmission: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg>',
        drive: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M7 15V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8"/></svg>',
        fuel: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 22h10M14 10h2a2 2 0 0 1 2 2v3.5a1.5 1.5 0 0 0 3 0V8l-3-3"/><path d="M3 10h10"/></svg>',
        power: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
        mileage: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 12l4-4M8 12a4 4 0 0 1 4-4"/></svg>',
        color: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21a9 9 0 1 1 0-18c4 0 8 2.5 8 7 0 2-1.5 3-3 3h-2a2 2 0 0 0-1.5 3.3c.4.5.2 1.2-.4 1.5-.4.2-.7.2-1.1.2z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7" r="1"/></svg>',
        body: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17h1a2 2 0 0 0 4 0h8a2 2 0 0 0 4 0h1v-5l-2-4a2 2 0 0 0-2-1H8a2 2 0 0 0-1.8 1.1L4 12l-1 1v4z"/><path d="M7 12h10"/></svg>',
    };

    function buildSpecCard(icon, label, value) {
        if (value === '' || value === null || value === undefined) return '';
        return `
            <div class="spec-card">
                <div class="spec-card-icon">${specIcons[icon]}</div>
                <div>
                    <span class="spec-label">${label}</span>
                    <strong class="spec-value">${value}</strong>
                </div>
            </div>
        `;
    }

    const specCardsMarkup = [
        buildSpecCard('year', 'Год выпуска', year),
        buildSpecCard('body', 'Тип кузова', bodyType),
        buildSpecCard('engine', 'Двигатель', engine),
        buildSpecCard('power', 'Мощность', power ? `${power} л.с.` : ''),
        buildSpecCard('transmission', 'Коробка передач', transmission),
        buildSpecCard('drive', 'Привод', driveType),
        buildSpecCard('fuel', 'Тип топлива', fuelType),
        buildSpecCard('mileage', 'Пробег', mileage !== '' ? `${numberFormatter.format(mileage)} км` : ''),
        buildSpecCard('color', 'Цвет кузова', color),
    ].join('');

    const basePrice = data.base_price || 0;
    const monthlyPrice = data.monthly_price || 0;

    const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
    const formattedBase = formatter.format(basePrice);
    const formattedMonthly = formatter.format(monthlyPrice);

    const rawDescription = data.description || data.Description || data.desc || data.Desc;
    const descriptionHtml = renderStrapiBlocks(rawDescription);

    // Разбор поля highlights: одна фишка на строку в формате "Заголовок | Описание"
    const rawHighlights = data.highlights || '';
    const highlightsList = rawHighlights
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const [hTitle, hDesc] = line.split('|').map(s => (s || '').trim());
            return { title: hTitle || '', desc: hDesc || '' };
        })
        .filter(h => h.title);

    // Универсальный разбор одного элемента медиа (фото или видео) из ответа Strapi —
    // поддерживает и плоский формат (v5), и вложенный { attributes: {...} } (v4).
    function resolveGalleryItem(rawItem) {
        if (!rawItem) return null;
        const item = rawItem.attributes ? { ...rawItem.attributes, id: rawItem.id } : rawItem;
        if (!item || !item.url) return null;
        return { url: item.url, mime: item.mime || '' };
    }

    let collectedImages = [];
    const gallerySource = data.gallery;
    let rawGalleryItems = [];
    if (Array.isArray(gallerySource)) {
        rawGalleryItems = gallerySource;
    } else if (gallerySource && Array.isArray(gallerySource.data)) {
        rawGalleryItems = gallerySource.data;
    }

    rawGalleryItems.forEach(rawItem => {
        const resolved = resolveGalleryItem(rawItem);
        if (resolved) {
            collectedImages.push({ url: `${STRAPI_URL}${resolved.url}`, mime: resolved.mime, isDirectUrl: true });
        }
    });

    if (collectedImages.length === 0) {
        const resolvedSingle = resolveGalleryItem(data.image);
        const singleImgUrl = resolvedSingle ? `${STRAPI_URL}${resolvedSingle.url}` : 'placeholder-car.jpg';
        const singleMime = resolvedSingle ? resolvedSingle.mime : '';
        collectedImages.push({ url: singleImgUrl, mime: singleMime, isDirectUrl: true });
    }

    let slidesMarkup = '';
    let bulletsMarkup = '';

    collectedImages.forEach((img, idx) => {
        const isVideo = (img.mime || '').startsWith('video/');
        const mediaTag = isVideo
            ? `<video src="${img.url}" style="width:100%; height:100%; object-fit: cover;" controls muted playsinline></video>`
            : `<img src="${img.url}" alt="${title} - фото ${idx + 1}" style="width:100%; height:100%; object-fit: cover;">`;
        slidesMarkup += `
            <div class="gallery-slide ${idx === 0 ? 'active' : ''}">
                ${mediaTag}
            </div>
        `;
        bulletsMarkup += `
            <span class="gallery-bullet ${idx === 0 ? 'active' : ''}" data-slide-index="${idx}"></span>
        `;
    });

    const isMultiImage = collectedImages.length > 1;
    const navigationArrows = isMultiImage ? `
        <button class="gallery-nav-arrow btn-prev" type="button">‹</button>
        <button class="gallery-nav-arrow btn-next" type="button">›</button>
    ` : '';

    // Карусель "фишек" — переиспользует фото из галереи по кругу
    let highlightsMarkup = '';
    if (highlightsList.length > 0) {
        const cardsHtml = highlightsList.map((h, idx) => {
            const img = collectedImages[idx % collectedImages.length];
            const isVideoHighlight = (img.mime || '').startsWith('video/');
            const mediaEl = isVideoHighlight
                ? `<video src="${img.url}" muted loop autoplay playsinline></video>`
                : `<img src="${img.url}" alt="${h.title}">`;
            return `
                <div class="highlight-card">
                    <div class="highlight-card-media">${mediaEl}</div>
                    <div class="highlight-card-body">
                        <h3>${h.title}</h3>
                        ${h.desc ? `<p>${h.desc}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        highlightsMarkup = `
            <section class="highlights-section">
                <div class="highlights-section-inner">
                    <h2 class="detail-heading">Особенности модели</h2>
                    <div class="highlights-carousel">${cardsHtml}</div>
                </div>
            </section>
        `;
    }

    container.innerHTML = `
        <div class="car-hero-top">
            <h1 class="car-detail-title">${title}</h1>
            <div class="car-hero-price-row">
                <div class="car-hero-price-block">
                    <span class="detail-price-label">Цена в наличии</span>
                    <strong class="car-hero-price">от ${formattedBase} ₸</strong>
                </div>
                <div class="car-hero-price-block">
                    <span class="detail-price-label">В кредит ежемесячно</span>
                    <strong class="car-hero-price accent">от ${formattedMonthly} ₸ / мес</strong>
                </div>
            </div>
            <div class="car-hero-cta-row">
                <button id="btn-order-car-fixed">Забронировать</button>
                <button id="btn-test-drive-car" class="secondary">Записаться на тест-драйв</button>
            </div>
        </div>

        <div class="car-full-view">
            <div class="premium-gallery-container">
                <div class="gallery-track-wrapper">${slidesMarkup}</div>
                ${navigationArrows}
            </div>

            <div class="car-info-right-block">
                <div class="gallery-bullets" style="display: ${isMultiImage ? 'flex' : 'none'};">
                    ${bulletsMarkup}
                </div>

                <nav class="detail-quick-nav">
                    <a href="#detail-specs">Характеристики</a>
                    <a href="#detail-calculator">Кредит</a>
                    <a href="#detail-overview">Обзор</a>
                </nav>

                <section id="detail-specs" class="detail-section">
                    <h2 class="detail-heading">Характеристики</h2>
                    <div class="spec-grid">
                        ${specCardsMarkup}
                    </div>
                </section>

                <section id="detail-calculator" class="detail-section">
                    <h2 class="detail-heading">Кредитный калькулятор</h2>
                    <div class="calculator-card">
                        <div class="calc-row">
                            <div class="calc-label-wrapper">
                                <span class="calc-label">Банк</span>
                            </div>
                            <select id="calc-bank-select" class="calc-bank-select">
                                <option value="kaspi">Каспи Банк — 22,5%</option>
                                <option value="halyk">Halyk Bank — 21%</option>
                                <option value="bereke">Bereke Bank — 23,4%</option>
                                <option value="forte">Forte Bank — 22%</option>
                                <option value="eurasian">Евразийский Банк — 23%</option>
                            </select>
                        </div>
                        <div class="calc-row">
                            <div class="calc-label-wrapper">
                                <span class="calc-label">Первоначальный взнос</span>
                                <span class="calc-value" id="calc-downpayment-text">20%</span>
                            </div>
                            <input type="range" id="slider-downpayment" class="calc-slider" min="10" max="70" step="5" value="20">
                        </div>
                        <div class="calc-row">
                            <div class="calc-label-wrapper">
                                <span class="calc-label">Срок</span>
                                <span class="calc-value" id="calc-term-text">60 мес.</span>
                            </div>
                            <input type="range" id="slider-term" class="calc-slider" min="12" max="84" step="12" value="60">
                        </div>

                        <div class="calc-summary">
                            <div class="calc-summary-row">
                                <span>Стоимость автомобиля</span>
                                <strong id="calc-summary-price">0 ₸</strong>
                            </div>
                            <div class="calc-summary-row">
                                <span>Сумма кредита</span>
                                <strong id="calc-summary-loan">0 ₸</strong>
                            </div>
                            <div class="calc-summary-row">
                                <span>Номинальная ставка</span>
                                <strong id="calc-summary-rate">0%</strong>
                            </div>
                        </div>

                        <div class="calc-result">
                            <span class="calc-label">Ежемесячный платёж</span>
                            <strong class="calc-result-value" id="calc-monthly-payment-result">0 ₸</strong>
                        </div>
                        <p class="calc-disclaimer">Расчёт ориентировочный, по стандартным (не партнёрским) ставкам банков. Точные условия — у менеджера AvtoVilla.</p>
                    </div>
                </section>

                <section id="detail-overview" class="detail-section">
                    <h2 class="detail-heading">Обзор</h2>
                    <div class="description-card">
                        <div class="description">${descriptionHtml}</div>
                    </div>
                </section>
            </div>
        </div>

        ${highlightsMarkup}

        <div class="mobile-sticky-cta">
            <div class="mobile-sticky-cta-price">
                <span>от ${formattedMonthly} ₸/мес</span>
            </div>
            <button id="btn-order-car-mobile" class="mobile-sticky-cta-btn">Забронировать</button>
        </div>
    `;

    // Кнопка в липкой мобильной панели дублирует основную кнопку бронирования
    const mobileOrderBtn = document.getElementById('btn-order-car-mobile');
    if (mobileOrderBtn) {
        mobileOrderBtn.addEventListener('click', () => {
            document.getElementById('btn-order-car-fixed')?.click();
        });
    }

    if (isMultiImage) runSliderEngine();
    initCreditCalculator(basePrice);
    setupActionBarLinks(title);
    initModalLogic(title);
}

function setupActionBarLinks(carTitle) {
    const waLink = document.getElementById('detail-action-wa');
    const benefitLink = document.getElementById('detail-action-benefit');
    if (waLink) {
        const textMessage = `Здравствуйте. Меня интересует модель: ${carTitle}`;
        waLink.href = `https://api.whatsapp.com/send/?phone=77780505848&text=${encodeURIComponent(textMessage)}`;
    }
    if (benefitLink) {
        benefitLink.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            if (modal && modalTitle) {
                modalTitle.innerText = `Получить выгоду на ${carTitle}`;
                modal.style.display = 'flex';
            }
        });
    }
}

const BANK_RATES = {
    kaspi: 22.5,
    halyk: 21,
    bereke: 23.4,
    forte: 22,
    eurasian: 23,
};

function initCreditCalculator(carPrice) {
    const sliderDownpayment = document.getElementById('slider-downpayment');
    const sliderTerm = document.getElementById('slider-term');
    const bankSelect = document.getElementById('calc-bank-select');
    const textDownpayment = document.getElementById('calc-downpayment-text');
    const textTerm = document.getElementById('calc-term-text');
    const resultMonthlyPayment = document.getElementById('calc-monthly-payment-result');
    const summaryPrice = document.getElementById('calc-summary-price');
    const summaryLoan = document.getElementById('calc-summary-loan');
    const summaryRate = document.getElementById('calc-summary-rate');

    if (!sliderDownpayment || !sliderTerm || !carPrice) return;

    const currencyFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

    function fillSliderTrack(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const percent = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(90deg, #0074d9 0%, #00f7ff ${percent}%, rgba(255,255,255,0.08) ${percent}%, rgba(255,255,255,0.08) 100%)`;
    }

    function calculateCredit() {
        const percent = parseInt(sliderDownpayment.value);
        const termMonths = parseInt(sliderTerm.value);
        const bankKey = bankSelect ? bankSelect.value : 'kaspi';
        const annualRate = BANK_RATES[bankKey] || 22;

        const downPaymentAmount = carPrice * (percent / 100);
        textDownpayment.innerText = `${currencyFormatter.format(downPaymentAmount)} ₸ (${percent}%)`;
        textTerm.innerText = `${termMonths} мес.`;
        fillSliderTrack(sliderDownpayment);
        fillSliderTrack(sliderTerm);

        const monthlyRate = (annualRate / 12) / 100;
        const loanBody = carPrice - downPaymentAmount;
        let monthlyPayment = loanBody > 0 ? loanBody * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1) : 0;

        resultMonthlyPayment.innerText = `${currencyFormatter.format(monthlyPayment)} ₸ / мес`;
        if (summaryPrice) summaryPrice.innerText = `${currencyFormatter.format(carPrice)} ₸`;
        if (summaryLoan) summaryLoan.innerText = `${currencyFormatter.format(loanBody)} ₸`;
        if (summaryRate) summaryRate.innerText = `${annualRate}%`;
    }

    sliderDownpayment.addEventListener('input', calculateCredit);
    sliderTerm.addEventListener('input', calculateCredit);
    if (bankSelect) bankSelect.addEventListener('change', calculateCredit);
    calculateCredit();
}

function runSliderEngine() {
    const slides = document.querySelectorAll('.gallery-slide');
    const bullets = document.querySelectorAll('.gallery-bullet');
    const prevBtn = document.querySelector('.gallery-nav-arrow.btn-prev');
    const nextBtn = document.querySelector('.gallery-nav-arrow.btn-next');
    let currentActiveIdx = 0;

    function goToSlide(targetIdx) {
        slides[currentActiveIdx].classList.remove('active');
        bullets[currentActiveIdx].classList.remove('active');
        currentActiveIdx = (targetIdx + slides.length) % slides.length;
        slides[currentActiveIdx].classList.add('active');
        bullets[currentActiveIdx].classList.add('active');
    }

    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentActiveIdx + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentActiveIdx - 1));
    bullets.forEach((bullet, bIdx) => bullet.addEventListener('click', () => goToSlide(bIdx)));
}

function initModalLogic(carTitle) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = document.querySelector('.close-modal');
    const orderBtn = document.getElementById('btn-order-car-fixed');
    const callbackBtns = document.querySelectorAll('.btn-callback');
    const successNotification = document.getElementById('success-notification');

    function showModalWindow(headingText) {
        if (modal) {
            modalTitle.innerText = headingText;
            modal.style.display = 'flex';
        }
    }

    if (orderBtn) orderBtn.addEventListener('click', () => showModalWindow(`Заявка на ${carTitle}`));
    const testDriveBtn = document.getElementById('btn-test-drive-car');
    if (testDriveBtn) testDriveBtn.addEventListener('click', () => showModalWindow(`Тест-драйв: ${carTitle}`));
    callbackBtns.forEach(btn => btn.addEventListener('click', () => showModalWindow('Оставьте заявку')));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    const callbackForm = document.getElementById('callback-form');
    if (callbackForm) {
        callbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = callbackForm.querySelector('input[type="text"]').value;
            const phone = callbackForm.querySelector('input[type="tel"]').value;

            const submitBtn = callbackForm.querySelector('button[type="submit"]');
            const submitBtnOriginalText = submitBtn ? submitBtn.innerText : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.6';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.innerText = 'Отправка...';
            }

            try {
                await fetch(`${STRAPI_URL}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: { name, phone, car: `Заказ: ${carTitle}` } })
                });

                modal.style.display = 'none';
                if(successNotification) {
                    successNotification.style.display = 'flex';
                    setTimeout(() => { successNotification.style.opacity = '1'; }, 10);
                }

                callbackForm.reset();
            } catch (err) {
                alert('Ошибка отправки.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '';
                    submitBtn.style.cursor = '';
                    submitBtn.innerText = submitBtnOriginalText;
                }
            }
        });
    }
}

window.closeNotification = function() {
    const notification = document.getElementById('success-notification');
    notification.style.opacity = '0';
    setTimeout(() => { notification.style.display = 'none'; }, 300);
};

document.addEventListener('DOMContentLoaded', initCarPage);