// --- ЛОГИКА ВЫПАДАЮЩЕЙ ПАНЕЛИ "КОНТАКТЫ" (общая для всех страниц) ---
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.contacts-wrapper');
    const toggleBtn = document.querySelector('.contacts-toggle-btn');
    if (!wrapper || !toggleBtn) return;

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') wrapper.classList.remove('open');
    });

    // Закрываем панель при клике по любому пункту внутри неё (номер, WhatsApp, "Заказать звонок"),
    // не мешая остальной логике страницы (открытие модалки заявки и т.д. обрабатывается отдельно).
    wrapper.querySelectorAll('.contacts-dropdown-item, .dropdown-callback-btn').forEach(item => {
        item.addEventListener('click', () => wrapper.classList.remove('open'));
    });
});
