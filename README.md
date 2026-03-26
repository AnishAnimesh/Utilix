# Utilix

A utility-focused Expo app with responsive file-based routing, theming, and cross-platform support for iOS, Android, and Web.

## Features

- Expo + React Native (TypeScript)
- File-based navigation using `app/` folder routes
- Theme-aware components (`constants/theme.ts`, `hooks/use-theme-color.ts`)
- Reusable UI building blocks in `components/ui`
- Utilities, screens, and external links for quick extension

## Quick start

1. Install dependencies

```bash
npm install
```

2. Run locally

```bash
npx expo start
```

3. Choose:
- `a` for Android emulator/device
- `i` for iOS simulator/device
- `w` for web browser

## Recommended commands

- `npm run ios` (if configured) or through Expo Dev Tools
- `npm run android` (if configured)
- `npm run web`
- `npm run lint` (as available in your setup)

## Project structure

```
.
├── App.js
├── app.json
├── package.json
├── tsconfig.json
├── README.md
├── assets
│   └── images
├── app
│   ├── _layout.tsx
│   ├── modal.tsx
│   └── (tabs)
│       ├── _layout.tsx
│       ├── explore.tsx
│       └── index.tsx
├── components
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   ├── hello-wave.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ui
│       ├── collapsible.tsx
│       ├── icon-symbol.ios.tsx
│       └── icon-symbol.tsx
├── constants
│   └── theme.ts
├── hooks
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   └── use-theme-color.ts
├── screens
│   ├── Homescreen.js
│   └── Unitconverter.js
└── scripts
    └── reset-project.js
```

## Folder breakdown

- `app/`: Routed screens, layout, and modal definitions for Expo Router
- `components/`: Shared UI components and helper widgets
- `constants/`: App-wide constants like theme colors and typography
- `hooks/`: Custom hooks for theming and platform-specific behavior
- `screens/`: Legacy or standalone screen entries
- `scripts/`: Automation and setup scripts

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/name`
3. Add code and tests
4. Submit a PR

## Notes

- Keep component styling in `constants/theme.ts` and `components/ui`
- Reuse hooks from `hooks/` to keep theme sync across platforms
- Check `app/_layout.tsx` and `app/(tabs)/_layout.tsx` for core navigation plumbing
