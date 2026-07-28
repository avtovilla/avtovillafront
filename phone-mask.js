// --- МАСКА ВВОДА ТЕЛЕФОНА: 8 (XXX) XXX XXXX (общая для всех форм на сайте) ---
(function () {
    function formatPhoneDigits(digits) {
        // digits — строка только из цифр, первая цифра всегда '8', максимум 11 цифр (8 + 10)
        let result = '8';
        if (digits.length > 1) result += ' (' + digits.substring(1, 4);
        if (digits.length >= 4) result += ')';
        if (digits.length >= 5) result += ' ' + digits.substring(4, 7);
        if (digits.length >= 8) result += ' ' + digits.substring(7, 11);
        return result;
    }

    function handlePhoneInput(e) {
        const input = e.target;
        let digits = input.value.replace(/\D/g, '');

        // +7 / 7 в начале приводим к привычному "8"
        if (digits.startsWith('7')) digits = '8' + digits.slice(1);
        if (!digits.startsWith('8')) digits = '8' + digits;
        digits = digits.slice(0, 11);

        input.value = formatPhoneDigits(digits);
    }

    function handlePhoneFocus(e) {
        if (!e.target.value) e.target.value = '8';
    }

    function handlePhoneKeydown(e) {
        // Не даём стереть ведущую "8" бэкспейсом/делитом, когда курсор перед ней
        if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.value === '8') {
            e.preventDefault();
        }
    }

    function initPhoneMasks() {
        document.querySelectorAll('input[type="tel"]').forEach((input) => {
            input.setAttribute('placeholder', '8 (___) ___ ____');
            input.setAttribute('maxlength', '18');
            input.setAttribute('inputmode', 'tel');
            input.setAttribute('pattern', '8 \\(\\d{3}\\) \\d{3} \\d{4}');
            input.setAttribute('title', 'Формат: 8 (700) 123 4567');
            input.addEventListener('focus', handlePhoneFocus);
            input.addEventListener('input', handlePhoneInput);
            input.addEventListener('keydown', handlePhoneKeydown);
        });
    }

    document.addEventListener('DOMContentLoaded', initPhoneMasks);
})();
