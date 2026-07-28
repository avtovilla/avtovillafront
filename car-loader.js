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
    const year = data.year || '—';
    const engine = data.engine || '—';

    const basePrice = data.base_price || 0;
    const monthlyPrice = data.monthly_price || 0;

    const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
    const formattedBase = formatter.format(basePrice);
    const formattedMonthly = formatter.format(monthlyPrice);

    const rawDescription = data.description || data.Description || data.desc || data.Desc;
    const descriptionHtml = renderStrapiBlocks(rawDescription);

    let collectedImages = [];
    const gallerySource = data.gallery;
    if (gallerySource && Array.isArray(gallerySource)) {
        collectedImages = gallerySource;
    } else if (gallerySource && gallerySource.data && Array.isArray(gallerySource.data)) {
        collectedImages = gallerySource.data.map(item => item.attributes || item);
    }

    if (collectedImages.length === 0) {
        let singleImgUrl = 'placeholder-car.jpg';
        if (data.image && data.image.url) {
            singleImgUrl = `${STRAPI_URL}${data.image.url}`;
        } else if (data.image && data.image.data && data.image.data.attributes && data.image.data.attributes.url) {
            singleImgUrl = `${STRAPI_URL}${data.image.data.attributes.url}`;
        }
        collectedImages.push({ url: singleImgUrl, isDirectUrl: true });
    }

    let slidesMarkup = '';
    let bulletsMarkup = '';

    collectedImages.forEach((img, idx) => {
        const urlPath = img.isDirectUrl ? img.url : `${STRAPI_URL}${img.url}`;
        slidesMarkup += `
            <div class="gallery-slide ${idx === 0 ? 'active' : ''}">
                <img src="${urlPath}" alt="${title} - фото ${idx + 1}" style="width:100%; height:100%; object-fit: contain;">
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

    container.innerHTML = `
        <div class="car-full-view">
            <div class="premium-gallery-container">
                <div class="gallery-track-wrapper">${slidesMarkup}</div>
                ${navigationArrows}
            </div>

            <div class="car-info-right-block">
                <h1 class="car-detail-title">${title}</h1>

                <div class="detail-price-card">
                    <div class="detail-price-block">
                        <span class="detail-price-label">Цена в наличии</span>
                        <strong class="detail-price-value">от ${formattedBase} ₸</strong>
                    </div>
                    <div class="detail-price-block">
                        <span class="detail-price-label">В кредит ежемесячно</span>
                        <strong class="detail-price-value accent">от ${formattedMonthly} ₸ / мес</strong>
                    </div>
                </div>

                <div class="gallery-bullets" style="display: ${isMultiImage ? 'flex' : 'none'};">
                    ${bulletsMarkup}
                </div>

                <h2 class="detail-heading">Характеристики</h2>
                <div class="spec-grid">
                    <div class="spec-card">
                        <span class="spec-label">Год выпуска</span>
                        <strong class="spec-value">${year}</strong>
                    </div>
                    <div class="spec-card">
                        <span class="spec-label">Двигатель</span>
                        <strong class="spec-value">${engine}</strong>
                    </div>
                </div>

                <h2 class="detail-heading">Кредитный калькулятор</h2>
                <div class="calculator-card">
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
                    <div class="calc-result">
                        <span class="calc-label">Платёж</span>
                        <strong class="calc-result-value" id="calc-monthly-payment-result">0 ₸</strong>
                    </div>
                </div>

                <div class="car-btn-submit-container">
                    <button id="btn-order-car-fixed">Забронировать</button>
                </div>

                <div class="description-block">
                    <h2 class="detail-heading">Обзор</h2>
                    <div class="description">${descriptionHtml}</div>
                </div>
            </div>
        </div>
    `;

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

function initCreditCalculator(carPrice) {
    const sliderDownpayment = document.getElementById('slider-downpayment');
    const sliderTerm = document.getElementById('slider-term');
    const textDownpayment = document.getElementById('calc-downpayment-text');
    const textTerm = document.getElementById('calc-term-text');
    const resultMonthlyPayment = document.getElementById('calc-monthly-payment-result');

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
        const downPaymentAmount = carPrice * (percent / 100);
        textDownpayment.innerText = `${currencyFormatter.format(downPaymentAmount)} ₸ (${percent}%)`;
        textTerm.innerText = `${termMonths} мес.`;
        fillSliderTrack(sliderDownpayment);
        fillSliderTrack(sliderTerm);

        const annualRate = 14;
        const monthlyRate = (annualRate / 12) / 100;
        const loanBody = carPrice - downPaymentAmount;
        let monthlyPayment = loanBody > 0 ? loanBody * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1) : 0;
        resultMonthlyPayment.innerText = `${currencyFormatter.format(monthlyPayment)} ₸ / мес`;
    }

    sliderDownpayment.addEventListener('input', calculateCredit);
    sliderTerm.addEventListener('input', calculateCredit);
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