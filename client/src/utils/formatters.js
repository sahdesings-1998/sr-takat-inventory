/**
 * Format a number as currency (USD)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (!amount && amount !== 0) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format a date to a readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (MM/DD/YYYY)
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Format a date and time to a readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted datetime string (MM/DD/YYYY HH:MM AM/PM)
 */
export function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Format a number with thousand separators
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 0) {
  if (!num && num !== 0) return "0";
  return parseFloat(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a phone number (assuming US format)
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number (123) 456-7890
 */
export function formatPhone(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return phone;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPhone,
};
