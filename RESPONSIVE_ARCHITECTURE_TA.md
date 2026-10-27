# FD Foods — Responsive UI & Clean Architecture

## இந்த மாற்றங்கள் என்ன?

- **Customer app:** mobile-ல் உணவு cards இரண்டு columns; tablet-ல் மூன்று columns; பெரிய screen-ல் நான்கு columns. Hero/search பகுதியில் width overflow ஆகாமல் fluid layout.
- **Delivery Partner app:** order actions, map, earnings, navigation ஆகியவை narrow screen-ல் viewport-ஐ தாண்டாமல் இருக்க responsive guards. Mobile bottom navigation safe-area padding உடன்.
- **Restaurant மற்றும் Admin apps:** laptop/desktop-ல் persistent sidebar pattern; mobile-ல் bottom navigation/drawer pattern-ஐ வைத்திருக்கிறோம். ஏற்கெனவே உள்ள React navigation state மற்றும் Tailwind breakpoints மாற்றப்படவில்லை.
- **எல்லா apps:** images, tables, dialogs, form controls ஆகியவை screen width-ஐ தாண்டுவதைத் தடுக்கும் CSS; keyboard focus indicator; reduced-motion preference.
- **Clean package:** `node_modules`, generated `dist`, Vite cache, Python cache, build output, log files ஆகியவற்றை ZIP-ல் இருந்து நீக்கியுள்ளோம். இவை source code அல்ல; தேவையான dependencies-ஐ package manager மீண்டும் உருவாக்கும். `src`, backend, tests, config, public assets மற்றும் environment examples பாதுகாக்கப்பட்டுள்ளன.

## முக்கிய navigation விதி

- **Laptop/Desktop (1024px மற்றும் மேல்):** sidebar visible; mobile bottom nav hidden ஆக இருக்க வேண்டும்.
- **Mobile/Tablet (1023px மற்றும் கீழ்):** mobile bottom navigation visible; sidebar drawer closed by default, menu action மூலம் மட்டும் திறக்க வேண்டும்.
- Customer app-ல் தற்போது customer bottom navigation தான் primary navigation; customer-க்கு desktop sidebar கட்டாயம் என மாற்றவில்லை, ஏனெனில் அதன் App layout-ல் customer sidebar இணைக்கப்படவில்லை.

## Run செய்வது

1. `webpurches` folder-க்கு செல்லவும்.
2. Root dependencies install செய்யவும்: `npm install`
3. Backend தேவையானால் project README-ல் உள்ள Python environment setup-ஐ பின்பற்றவும்.
4. Frontend apps build செய்ய: `npm run build`
5. Local development: `npm run dev:all`

## Bug-fix குறிப்பு

இது source-level responsive hardening. உங்கள் இயந்திரத்தில் dependencies install செய்து `npm run build` மற்றும் test suite ஓட்டுவது அவசியம். இந்த environment-ல் full frontend/backend runtime test ஓட்டப்படவில்லை; ஆகவே எல்லா functional bugs தீர்ந்துவிட்டன என்று உறுதி கூறவில்லை. Backend secrets உள்ள `.env` கோப்புகளை source control/ZIP-ல் சேர்க்க வேண்டாம்; `.env.example` மட்டும் வைத்திருக்கவும்.
