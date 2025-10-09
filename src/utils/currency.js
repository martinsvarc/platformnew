// Currency formatting utility based on user's language preference

export const formatCurrency = (amount, language = 'cs') => {
  const currency = language === 'en' ? 'USD' : 'CZK'
  const locale = language === 'en' ? 'en-US' : 'cs-CZ'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatNumber = (amount, language = 'cs') => {
  const locale = language === 'en' ? 'en-US' : 'cs-CZ'
  
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount)
}

// Get currency symbol based on language
export const getCurrencySymbol = (language = 'cs') => {
  return language === 'en' ? '$' : 'Kč'
}

// Get currency code based on language
export const getCurrencyCode = (language = 'cs') => {
  return language === 'en' ? 'USD' : 'CZK'
}

