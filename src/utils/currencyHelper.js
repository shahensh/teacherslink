// Currency Helper Functions for TeachersHubb

/**
 * Get currency symbol based on currency code
 * @param {string} currency - Currency code (USD, INR, EUR, etc.)
 * @returns {string} - Currency symbol
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  
  return symbols[currency] || '₹'; // Default to INR (₹)
};

/**
 * Format salary with currency symbol
 * @param {number} amount - Salary amount
 * @param {string} currency - Currency code
 * @returns {string} - Formatted salary string
 */
export const formatSalary = (amount, currency = 'INR') => {
  if (!amount && amount !== 0) return '';
  
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString('en-IN'); // Indian number format
  
  return `${symbol}${formatted}`;
};

/**
 * Format salary range
 * @param {number} min - Minimum salary
 * @param {number} max - Maximum salary  
 * @param {string} currency - Currency code
 * @returns {string} - Formatted salary range string
 */
export const formatSalaryRange = (min, max, currency = 'INR') => {
  if (!min && !max) return 'Not specified';
  if (!max) return formatSalary(min, currency);
  if (!min) return `Up to ${formatSalary(max, currency)}`;
  
  return `${formatSalary(min, currency)} - ${formatSalary(max, currency)}`;
};

export default {
  getCurrencySymbol,
  formatSalary,
  formatSalaryRange
};


