/* Contact form. The narrative hero is isolated in hero-world.js. */
document.getElementById('briefing').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
    const name = form.elements.name.value.trim(), business = form.elements.business.value.trim(), idea = form.elements.idea.value.trim();
    if (!name || !business) { const input = !name ? form.elements.name : form.elements.business; input.setCustomValidity('Preencha este campo com seu texto.'); input.reportValidity(); input.addEventListener('input', () => input.setCustomValidity(''), { once: true }); return; }
    const text = `Olá, Gabriel! Meu nome é ${name}. Meu negócio: ${business}. Quero conversar sobre uma landing page.${idea ? ' Minha ideia: ' + idea : ''}`;
    window.open('https://wa.me/5511934848849?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
});
