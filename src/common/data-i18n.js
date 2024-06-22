document.addEventListener('DOMContentLoaded', () => {
    
    const elements = Array.from(document.querySelectorAll('[data-i18n]'));
    
    for (const element of elements) {
        const messageName = element.dataset.i18n;
        if (messageName) {
            element.insertAdjacentText('beforeend', browser.i18n.getMessage(messageName));
	}
    }
}, { once: true });