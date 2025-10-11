export function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

export function validateInput(input) {
    return input && input.trim() !== '';
}

export function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}