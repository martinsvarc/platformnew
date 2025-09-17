# New Payment UI (Nová Platba)

React aplikace pro zadávání plateb, zobrazení výkonu a velké revenue obrazovky v češtině. Postaveno na Vite, React Routeru a Tailwind CSS.

## Nastavení databáze a integrace (Neon Postgres)

### 1) Instalace závislostí

```bash
npm install
npm install @neondatabase/serverless argon2-browser
```

### 2) Neon Postgres

1. Vytvořte projekt v Neonu a získejte connection string.
2. V konzoli Neonu spusťte SQL schéma ze souboru `src/api/schema.sql` (obsahuje rozšíření, enumy, tabulky, indexy a triggery).

### 3) .env

Vytvořte v kořeni projektu soubor `.env`:

```bash
VITE_DATABASE_URL=postgres://<user>:<pass>@<host>/<db>?sslmode=require
VITE_TEAM_ID=<uuid_tymu>
VITE_USER_ID=<uuid_uzivatele>
```

### 4) Spuštění

```bash
npm run dev
```

Otevřete `http://localhost:3000`.

### 5) Stránky a API

- `/skore`: čte denní/týdenní/měsíční součty (`payments`) a aktivní cíle (`goals`).
- `/nove`: průvodce – upsert klienta a vložení do `payments` (transakčně).
- `/tvuj vykon`: souhrny podle uživatele (team_id + user_id).
- `/klientiaplatby`: seznam klientů a plateb; inline úpravy klientů.
- `/admin`: ukládá jednoduché cíle (den/týden/měsíc) do `goals`.

Pozn.: Registrace uživatelů je v `src/api/signup.js` a používá `argon2-browser` (hash hesla).

### 6) Doporučení

- Parametrizované dotazy již používá `@neondatabase/serverless` (bezpečné proti SQLi).
- Pro produkci zvažte přesun DB přístupu na backend API (neposílejte DB přístup přímo do klienta).
- Pro multi‑tenant režim zvažte RLS na úrovni DB.

## Funkce

- **Levý navigační panel**: Fixní sidebar s profilem (Jan Novák) a odkazy (Skóre, Nové, Tvůj Výkon), tmavé téma s růžovo‑zlatými akcenty
- **Skóre**: Fullscreen zobrazení obratu s velkým „dýchajícím“ neon číslem, plynulé animace, auto‑aktualizace každých 15 s, bez navigace
- **Denně / Týdně / Měsíčně přepínač**: Tři velká TV‑friendly tlačítka nahoře s možností ovládání šipkami na ovladači/klávesnici; u každého je vidět cíl ve formátu „aktuální/celkový“ s neonovým leskem
- **Nové**: Formulář platby (Částka, Klient, Prodáno, Platforma, Model, Banka), vycentrované odeslání, vedle dashboard a liga
- **Tvůj Výkon**: Dashboard se 6 metrikami (2 řady), čisté rozvržení
- **CZ lokalizace + CZK**: Správné formátování měny a české texty

## Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS Variables** - Pink Empire Suite color system

## Struktura projektu

```
src/
├── components/
│   ├── PaymentForm.jsx
│   ├── StatsDashboard.jsx
│   └── League.jsx
├── pages/
│   ├── Skore.jsx
│   ├── Nove.jsx
│   └── TvujVykon.jsx
├── App.jsx
├── main.jsx
└── globals.css
```

## Instalace a spuštění

### Požadavky

- Node.js (16+)
- npm nebo yarn

### Instalace

1. Otevřete složku projektu v terminálu
2. Nainstalujte závislosti
   ```bash
   npm install
   ```
3. Spusťte vývojový server (Vite)
   ```bash
   npm run dev
   ```
4. Otevřete prohlížeč na `http://localhost:3000/nove`
   - Stránka „Nové“ nyní používá krokový formulář na celou obrazovku bez navigace
   - Šipky vlevo/vpravo = Předchozí/Další, Enter = potvrdit krok / Schválit
   - Hot‑reload je zapnutý; změny v UI se projeví ihned

## Použití

### Navigace

- **Skóre**: Fullscreen obrat s neon číslem, auto‑update 15 s
- **Nové**: Formulář platby + dashboard + liga
- **Tvůj Výkon**: Přehled výkonu
- **Klienti a Platby**: Seznam klientů a transakcí s filtry a inline úpravami

### Skóre

- **Rozvržení bez navigace**: Celá obrazovka, vycentrovaný obsah, žádné scrollování
- **Přepínání zobrazení**: Tlačítka „Denně / Týdně / Měsíčně“ nahoře, velká a snadno trefitelná na TV
- **Cíle**: U každého zobrazení je cíl „aktuální/celkový“ s neonovým efektem (např. Denně 40 000/100 000)
- **Číslo s neon leskem**: Velké číslo CZK s „dýcháním“ a plynulou animací číslic při update
- **Aktualizace**: Každých 15 s se částka navýší o 100–500 CZK
- **Ovládání šipkami**: Šipky vlevo/vpravo přepínají Denně/Týdně/Měsíčně, Enter potvrdí

### Nové (Formulář Platby)

- **Částka (CZK)**: Předvolby (100–5000 CZK) v 3 sloupcích + vlastní vstup
- **Klient**: Vyhledávací pole (Jan Novák, Jana Nováková, Aleš Brown, Marie); „+ Nový Klient“ otevře Jméno, Email, Telefon; „Přidat Klienta“ rovnou vybere a pokračuje
- **Prodáno**: Vlastní textové pole pro zadání, co bylo prodáno
- **Platforma**: Ikonová tlačítka WhatsApp (📱), FB Stránka (📘), Other (🌐)
- **Model**: Tlačítka (Natálie, Nastya, Isabella, Eliška, Other) – bez duplicit
- **Banka**: Tlačítka (Raif - Maty, Raif - Tisa, Fio - Martin, Paysafe, Other)
- **Schválit**: Velké růžové tlačítko s ✓, spustí konfety a fade‑out, poté resetuje formulář

### Klienti a Platby (Novinky)

- **Filtr „Výplata“ (1–31)**: V toolbaru vpravo, `Výplata: Vše` výchozí. Filtrovat můžete podle konkrétního dne výplaty.
- **Klik na řádek klienta**: Rozbalí transakce daného klienta (tabulka Částka/Co/Platforma/Datum).
- **Email/Telefon**: Ikony svítí (růžová záře), když hodnota existuje. Klik otevře popover pro úpravu s políčkem a Uložit.
- **Přejmenování sloupce**: „Kolik poslal za posledních 30 dnu“ (místo „za poslední měsíc“).
- **Další sloupce**: Jméno, Výplata, Poznámky, Chatter, Kdy naposledy poslal?, Kolik poslal celkově.
- **UX**: Plynulé přechody, bez zbytečného skrolování, vhodné pro TV i mobil.

## Vývoj

### Skripty

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Hot Reload

Vite podporuje hot reload. Změny ve zdrojích se okamžitě projeví v prohlížeči.

### Vzhled

Aplikace používá vlastní barevný systém v `globals.css`:

- **Neon Orchid**: Primary accent color
- **Sunset Gold**: Secondary accent color
- **Obsidian/Charcoal**: Dark backgrounds
- **Pearl**: Light text color

## Mock data

Aplikace používá mock data pro demonstraci:

- **Clients**: Jan Novák, Jana Nováková, Aleš Brown, Marie, David Wilson
- **Daily Volume**: 7,500 CZK (triggers green styling >5,000 CZK)
- **New Clients**: 3
- **Last Hour**: 250 CZK
- **Total Clients**: 15
- **Total Earned**: 45,000 CZK
- **Average Client**: 500 CZK
- **League**: Individual trends per chatter (Alex +300 CZK, Vy +200 CZK, Marie +150 CZK, David +100 CZK) on daily tab

## Podporované prohlížeče

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Licence

Tento projekt slouží k demonstračním účelům.
