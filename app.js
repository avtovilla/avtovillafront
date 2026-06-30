const STRAPI_URL = 'https://avtovillashymkent.onrender.com';

// --- ЛОГИКА ЗАГРУЗКИ МАШИН ---
async function fetchCars() {
    const grid = document.getElementById('cars-grid');
    try {
        const response = await fetch(`${STRAPI_URL}/api/cars?populate=*`);
        if (!response.ok) throw new Error('Ошибка связи с сервером');

        const resData = await response.json();
        const cars = resData.data;

        renderCars(cars);
    } catch (error) {
        console.error(error);
        if (grid) {
            grid.innerHTML = `
                <div class="loading-spinner" style="color: #ff4d4d; width: 100%; text-align: center; padding: 20px;">
                    <p>Не удалось подключиться к автосалону. Убедитесь, что бэкенд Strapi запущен.</p>
                </div>
            `;
        }
    }
}

function renderCars(cars) {
    const grid = document.getElementById('cars-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!cars || cars.length === 0) {
        grid.innerHTML = '<div class="loading-spinner"><p>Модельный ряд пуст.</p></div>';
        return;
    }

    cars.forEach(car => {
        const dataFields = car.attributes ? car.attributes : car;
        const title = dataFields.Title || dataFields.title || 'Модель автомобиля';
        const basePrice = dataFields.base_price || 0;
        const monthlyPrice = dataFields.monthly_price || 0;
        const carId = car.documentId || car.id || dataFields.documentId || dataFields.id;

        let imageUrl = 'https://via.placeholder.com/600x400?text=AvtoVilla';
        const imgObj = dataFields.image;
        if (imgObj && imgObj.url) {
            imageUrl = `${STRAPI_URL}${imgObj.url}`;
        } else if (imgObj && imgObj.data && imgObj.data.attributes && imgObj.data.attributes.url) {
            imageUrl = `${STRAPI_URL}${imgObj.data.attributes.url}`;
        }

        const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
        const formattedBase = formatter.format(basePrice);
        const formattedMonthly = formatter.format(monthlyPrice);

        const cardHtml = `
            <a href="car.html?id=${carId}" class="car-card" onclick="localStorage.setItem('selectedCarId', '${carId}');">
                <div class="car-image-container">
                    <img src="${imageUrl}" alt="${title}" class="car-image">
                </div>
                <div class="car-info">
                    <h3 class="car-title">${title}</h3>
                    <div class="price-row">
                        <span class="price-label">Цена в наличии</span>
                        <span class="base-price">от ${formattedBase} ₸</span>
                    </div>
                    <div class="monthly-block">
                        <div class="monthly-label">В кредит ежемесячно</div>
                        <div class="monthly-price">от ${formattedMonthly} ₸ / мес</div>
                    </div>
                    <div class="btn-card-action">Подробнее</div>
                </div>
            </a>
        `;
        grid.innerHTML += cardHtml;
    });
}

// --- ЛОГИКА МОДАЛЬНЫХ ОКОН ---
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.querySelector('.close-modal');
const successNotification = document.getElementById('success-notification');

function openModal(title) {
    if (modal) {
        modalTitle.innerText = title;
        modal.style.display = 'flex';
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-callback') || e.target.closest('.btn-secondary')) {
        e.preventDefault();
        openModal('Оставьте вашу заявку');
    }
});

const mainBenefitBtn = document.getElementById('main-action-benefit');
if (mainBenefitBtn) {
    mainBenefitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('Получить максимальную выгоду');
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
}

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// --- ОТПРАВКА ЗАЯВОК ---
document.addEventListener('submit', async (e) => {
    const form = e.target.closest('#callback-form');
    if (!form) return;

    e.preventDefault();

    const nameInput = form.querySelector('input[type="text"]')?.value || 'Не указано';
    const phoneInput = form.querySelector('input[type="tel"]')?.value || 'Не указано';
    const carTitle = modalTitle ? modalTitle.innerText : 'Выбор из модального окна';

    const botToken = '8920165983:AAHdRcjgIRsa8fEMYCdLrYV3IfRZXq9FoGA';
    const chatId = '8923508472';
    const textMessage = `🔔 Новая заявка!\n🚗 Авто: ${carTitle}\n👤 Имя: ${nameInput}\n📱 Тел: ${phoneInput}`;

    try {
        // 1. Отправка в Strapi
        const strapiResponse = await fetch(`${STRAPI_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { name: nameInput, phone: phoneInput, car: carTitle } })
        });

        if (!strapiResponse.ok) throw new Error('Ошибка сохранения в базе Strapi');

        // 2. Отправка в Telegram (Разрываем слэши, чтобы PyCharm не ломал подсветку кода)
        const tgUrl = "https:/" + "/api.telegram.org/bot" + botToken + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURIComponent(textMessage);
        const tgResponse = await fetch(tgUrl);
        const tgData = await tgResponse.json();

        if (tgData.ok) {
            console.log("Успешно отправлено в Telegram и Strapi!");
            if (modal) modal.style.display = 'none';
            if (successNotification) {
                successNotification.style.display = 'flex';
                successNotification.style.opacity = '1';
                setTimeout(() => { successNotification.style.display = 'none'; }, 3000);
            }
            form.reset();
        } else {
            alert('Ошибка Telegram: ' + tgData.description);
        }
    } catch (err) {
        console.error("Полная ошибка процесса:", err);
        alert('Ошибка при отправке заявки. Проверьте консоль F12.');
    }
});

document.addEventListener('DOMContentLoaded', fetchCars);
