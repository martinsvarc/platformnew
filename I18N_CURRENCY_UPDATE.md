# i18n Currency & Translation Update

## ✅ What's Been Fixed

### 1. **Currency Support**
- Created `/src/utils/currency.js` utility
- **English mode**: Shows $ (USD) instead of Kč (CZK)
- **Czech mode**: Shows Kč (CZK) as before
- Automatically switches based on selected language

### 2. **Pages Fully Translated**
✅ **Login Page** - All text translated  
✅ **NavMenu** - Navigation, profile, language switcher  
✅ **TvujVykon (Your Performance)** - Headers, filters, stats  
✅ **Skore (Score)** - All labels, buttons, leaderboard  
✅ **StatsDashboard** - All performance metrics  

### 3. **Currency Changes by Language**

#### Czech (cs):
```
5,000 Kč
10 000 Kč
```

#### English (en):
```
$5,000
$10,000
```

## 🔧 Updated Files

1. `/src/utils/currency.js` - NEW: Currency formatting utility
2. `/src/components/StatsDashboard.jsx` - Now uses currency utility
3. `/src/pages/Skore.jsx` - Fully translated + currency support
4. `/src/pages/TvujVykon.jsx` - Fully translated
5. `/src/pages/Login.jsx` - Fully translated
6. `/src/components/NavMenu.jsx` - Fully translated

## 📝 To Translate More Pages

The **Klientiaplatby** (Clients & Payments) page still has Czech text. To translate it:

1. Add these imports at the top:
```jsx
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
```

2. Inside the component:
```jsx
const { t, i18n } = useTranslation()
```

3. Replace hardcoded text like:
```jsx
// Before:
<h1>Klienti a Platby</h1>

// After:
<h1>{t('clients.title')}</h1>
```

4. Replace currency formatting:
```jsx
// Before:
{new Intl.NumberFormat('cs-CZ', {currency: 'CZK'...}).format(amount)}

// After:
{formatCurrency(amount, i18n.language)}
```

## 🎯 Testing

1. Make sure database migration is run (see I18N_IMPLEMENTATION_SUMMARY.md)
2. Start app: `npm run dev`
3. Login
4. Switch language in navigation menu
5. Navigate to different pages:
   - ✅ Skore page - should show $ in English
   - ✅ TvujVykon - should show English labels and $
   - ⚠️ Klientiaplatby - still needs translation (but foundation is ready)

## 💡 Translation Keys Already Available

All these keys are ready to use in `/src/i18n/locales/`:

- `clients.*` - Client management text
- `payments.*` - Payment forms
- `common.*` - Buttons, filters, actions
- `admin.*` - Admin panel
- `bookmarks.*` - Bookmarks page
- `goals.*` - Goal setting
- `settings.*` - Settings page

Just use them with `t('clients.title')` etc.

## 🔥 Quick Example for Remaining Pages

```jsx
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'

function MyPage() {
  const { t, i18n } = useTranslation()
  
  return (
    <div>
      <h1>{t('clients.title')}</h1>
      <p>{formatCurrency(5000, i18n.language)}</p>
      {/* Will show "$5,000" in English or "5 000 Kč" in Czech */}
    </div>
  )
}
```

## ✨ Summary

- ✅ Currency now changes with language (CZK ↔ USD)
- ✅ Major pages translated (Login, Performance, Score)
- ✅ Navigation fully translated
- 📋 Translation keys ready for all pages
- 🛠️ Easy pattern to translate remaining pages

