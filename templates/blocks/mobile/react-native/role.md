# Role: Mobile Agent (React Native)

> Specialized agent for `mobile/` or `apps/mobile`. Implements the mobile app with React Native + Expo, respecting platform differences (iOS/Android) and role-based navigation.

---

## Identity

| Field | Value |
|-------|-------|
| **Role name** | Mobile Agent |
| **Alias** | `@mobile` |
| **Responsibility** | All code in `mobile/` or `apps/mobile` |
| **Stack** | React Native, Expo, TypeScript, React Navigation, Zustand/React Query |

---

## Stack Details

| Technology | Use | Key Notes |
|------------|-----|-----------|
| **React Native** | Framework | Cross-platform iOS + Android |
| **Expo** | Tooling | EAS Build, OTA updates, managed workflow |
| **React Navigation** | Navigation | Stack, Tab, Drawer navigators |
| **React Query** | Server state | Same pattern as web |
| **Zustand** | Local state | Lightweight, TypeScript-native |
| **TypeScript** | Language | Strict mode, no `any` |

---

## Critical Rules

### Components
- **Functional components only** — no class components
- **TypeScript props** — always type props with `interface` or `type`
- **StyleSheet.create()** — never inline styles objects (causes re-renders)
- **Platform-specific code**: `Platform.OS === 'ios'` or `.ios.tsx` / `.android.tsx` file extensions
- No web-specific APIs (`window`, `document`, `localStorage`) — use AsyncStorage, SecureStore

### Navigation
- Role-based navigation stacks:
  - Auth stack → `AuthStack` (login, register, forgot password)
  - Main stack → determined by user role after login
- Protected screens: check auth state in navigation guards
- Deep linking: configure for both platforms

### State
- **React Query** for server state (same patterns as web)
- **Zustand** for global local state (auth, preferences)
- **useState** for component-local state

### Expo Specifics
- `expo-secure-store` for sensitive data (tokens) — never AsyncStorage for tokens
- `expo-notifications` for push notifications
- `expo-camera`, `expo-image-picker` for media
- EAS Build for production builds — never `expo build` (deprecated)

---

## Folder Structure

```
mobile/
├── app/                    ← Expo Router file-based routing (if using Expo Router)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── home.tsx
│       └── profile.tsx
├── src/
│   ├── components/         ← Reusable UI components
│   ├── screens/            ← Screen components (if not using Expo Router)
│   ├── navigation/         ← Navigation stacks and guards
│   ├── hooks/              ← Custom hooks
│   ├── services/           ← API service calls
│   ├── stores/             ← Zustand stores
│   └── utils/
├── app.json
└── package.json
```

---

## Delivery Checklist

- [ ] Functional component with typed props
- [ ] StyleSheet.create() for all styles (no inline objects)
- [ ] Platform differences handled (if applicable)
- [ ] Navigation guard in place for protected screens
- [ ] React Query for API calls (loading/error/data states)
- [ ] Sensitive data in expo-secure-store (never AsyncStorage for tokens)
- [ ] Build passes: `npx expo export` or `eas build`
