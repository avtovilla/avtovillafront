/* ================================================================
   car-modal.js
   Ленивая загрузка блоков "Характеристики" и "Кредитный калькулятор"
   на странице car.html — контент создаётся только при первом клике
   на соответствующую кнопку, а не при открытии страницы.
   Подключить: <script src="car-modal.js"></script>
   ================================================================ */

const API_BASE = 'https://avtovillashymkent.onrender.com';

let specsLoaded = false;
let calcLoaded = false;

// ---------- Характеристики ----------
document.getElementById('openSpecsBtn')?.addEventListener('click', async () => {
  const modal = document.getElementById('specsModal');

  if (!specsLoaded) {
    const carId = new URLSearchParams(window.location.search).get('id');
    const specsContent = document.getElementById('specsContent');
    specsContent.innerHTML = '<p>Загрузка...</p>';
    modal.classList.add('active');

    try {
      const res = await fetch(`${API_BASE}/api/cars/${carId}`);
      const { data: car } = await res.json();

      specsContent.innerHTML = `
        <h2>Характеристики ${car.name ?? ''}</h2>
        <div class="specs-grid">
          <div class="spec-item"><span>Год выпуска</span><strong>${car.year ?? '—'}</strong></div>
          <div class="spec-item"><span>Тип кузова</span><strong>${car.body_type ?? '—'}</strong></div>
          <div class="spec-item"><span>Двигатель</span><strong>${car.engine ?? '—'}</strong></div>
          <div class="spec-item"><span>Мощность</span><strong>${car.power ?? '—'} л.с.</strong></div>
          <div class="spec-item"><span>Коробка передач</span><strong>${car.transmission ?? '—'}</strong></div>
          <div class="spec-item"><span>Привод</span><strong>${car.drivetrain ?? '—'}</strong></div>
          <div class="spec-item"><span>Тип топлива</span><strong>${car.fuel_type ?? '—'}</strong></div>
          <div class="spec-item"><span>Цвет</span><strong>${car.color ?? '—'}</strong></div>
          <div class="spec-item"><span>Пробег</span><strong>${car.mileage ?? 0} км</strong></div>
        </div>
      `;
      specsLoaded = true;
    } catch (err) {
      specsContent.innerHTML = '<p>Ошибка загрузки характеристик</p>';
    }
    return;
  }

  modal.classList.add('active');
});

// ---------- Кредитный калькулятор ----------
document.getElementById('openCalcBtn')?.addEventListener('click', () => {
  const modal = document.getElementById('calcModal');

  if (!calcLoaded) {
    const calcContent = document.getElementById('calcContent');

    calcContent.innerHTML = `
      <h2>Кредитный калькулятор</h2>
      <form id="calcForm" class="calculator-form">
        <div class="form-group">
          <label>Стоимость автомобиля (₸)</label>
          <input type="number" id="carPrice" required>
        </div>
        <div class="form-group">
          <label>Первоначальный взнос: <span id="downPaymentValue">20%</span></label>
          <input type="range" id="downPayment" min="0" max="100" value="20" step="5">
        </div>
        <div class="form-group">
          <label>Срок кредита: <span id="loanTermValue">60 мес.</span></label>
          <input type="range" id="loanTerm" min="12" max="84" value="60" step="12">
        </div>
        <div class="form-group">
          <label>Ставка (%)</label>
          <input type="number" id="rate" value="22" step="0.1" required>
        </div>
        <button type="submit" class="calc-button">Рассчитать</button>
      </form>
      <div id="calcResult"></div>
    `;

    document.getElementById('downPayment').addEventListener('input', (e) => {
      document.getElementById('downPaymentValue').textContent = e.target.value + '%';
    });
    document.getElementById('loanTerm').addEventListener('input', (e) => {
      document.getElementById('loanTermValue').textContent = e.target.value + ' мес.';
    });

    document.getElementById('calcForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const price = parseFloat(document.getElementById('carPrice').value);
      const downPct = parseFloat(document.getElementById('downPayment').value);
      const loanAmount = price - (price * downPct) / 100;
      const rate = parseFloat(document.getElementById('rate').value) / 100 / 12;
      const months = parseInt(document.getElementById('loanTerm').value, 10);

      const monthly =
        (loanAmount * rate * Math.pow(1 + rate, months)) /
        (Math.pow(1 + rate, months) - 1);
      const total = monthly * months;
      const overpay = total - loanAmount;

      document.getElementById('calcResult').innerHTML = `
        <div class="calc-results">
          <div class="result-item"><span>Сумма кредита:</span><strong>${loanAmount.toLocaleString('ru-RU')} ₸</strong></div>
          <div class="result-item"><span>Ежемесячный платёж:</span><strong>${monthly.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</strong></div>
          <div class="result-item"><span>Переплата:</span><strong>${overpay.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</strong></div>
          <div class="result-item"><span>Итого к оплате:</span><strong>${total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</strong></div>
        </div>
      `;
    });

    calcLoaded = true;
  }

  modal.classList.add('active');
});

// ---------- Закрытие модалей ----------
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
});
