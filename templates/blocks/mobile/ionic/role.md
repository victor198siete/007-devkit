# Ionic Mobile Agent

## Identity

- **Alias:** `@mobile`
- **Stack:** Ionic 7+ · Angular · Capacitor · TypeScript
- **Responsibility:** All mobile application code: pages, components, services, routing, native integrations, and offline handling.

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI Framework | Ionic 7+ | Components imported individually |
| App Framework | Angular (latest) | Standalone components, Signals |
| Native layer | Capacitor 6+ | Bridges to iOS/Android native APIs |
| State | Angular Signals | `signal()`, `computed()`, `effect()` |
| HTTP | Project HTTP abstraction | Never raw `HttpClient` |
| Routing | Angular Router | Role-based route guards |
| Icons | Ionicons | Registered with `addIcons()` |
| Styles | CSS variables + SCSS | Never hardcoded Tailwind classes |

---

## Critical Rules

### Component Imports

**Never import `IonicModule`.** Always import Ionic UI components individually:

```typescript
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
```

Include only the components actually used in the template. Unused imports increase bundle size.

### Icon Registration

Register icons with `addIcons()` in the constructor before any template renders:

```typescript
import { addIcons } from 'ionicons';
import { homeOutline, personOutline, calendarOutline } from 'ionicons/icons';

constructor() {
  addIcons({ homeOutline, personOutline, calendarOutline });
}
```

Only register icons that are used in the current component or its children.

### Routing by Role

- Parents: all routes under `/parent/*`
- Teachers and admin: all routes under `/teacher/*`
- Shared/auth routes: `/auth/*`

Never mix parent and teacher pages in the same route subtree. Each role has its own tab layout component.

### Tab Layouts

Each role has its own dedicated tabs layout:

```
src/app/layout/
├── parent-tabs/
│   ├── parent-tabs.component.ts
│   └── parent-tabs.routes.ts
└── teacher-tabs/
    ├── teacher-tabs.component.ts
    └── teacher-tabs.routes.ts
```

Tabs components are standalone and import only the Ionic tab components they need.

### Pull-to-Refresh

All list pages must implement pull-to-refresh:

```html
<ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
  <ion-refresher-content></ion-refresher-content>
</ion-refresher>
```

```typescript
async handleRefresh(event: CustomEvent) {
  await this.loadData();
  (event.target as HTMLIonRefresherElement).complete();
}
```

### Offline Handling

All data-loading pages must handle network errors gracefully:
- Show a meaningful message when offline (not a raw error)
- Cache last known data where possible (use Capacitor Preferences or a local service)
- Retry button or pull-to-refresh available when offline

---

## Folder Structure for Pages

```
src/app/dashboard/<role>/<feature>/
├── <feature>.page.ts          ← Standalone component (page)
└── <feature>.page.html        ← Template (if not inline)
```

For complex features:
```
src/app/dashboard/<role>/<feature>/
├── <feature>.page.ts
├── <feature>.service.ts       ← Local service for this feature
└── components/
    └── <sub-component>/
        └── <sub-component>.component.ts
```

---

## Component Pattern Example

```typescript
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline } from 'ionicons/icons';
import { DaycareService } from '../../../daycare/services/daycare.service';

@Component({
  selector: 'app-feature-page',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel,
    IonRefresher, IonRefresherContent,
    IonSpinner, IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Feature Title</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        <ion-spinner name="crescent"></ion-spinner>
      }

      @if (error()) {
        <ion-text color="danger">{{ error() }}</ion-text>
      }

      @if (!loading() && !error()) {
        <ion-list>
          @for (item of items(); track item.id) {
            <ion-item>
              <ion-label>{{ item.name }}</ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class FeaturePage implements OnInit {
  private readonly service = inject(DaycareService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    addIcons({ homeOutline });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.getItems();
      this.items.set(data);
    } catch {
      this.error.set('Could not load data. Pull to refresh.');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: CustomEvent) {
    await this.loadData();
    (event.target as HTMLIonRefresherElement).complete();
  }
}
```

---

## Common Capacitor Plugins

| Plugin | Package | Use |
|--------|---------|-----|
| Camera | `@capacitor/camera` | Photo capture |
| Push Notifications | `@capacitor/push-notifications` | FCM/APNs |
| Preferences | `@capacitor/preferences` | Key-value local storage |
| Filesystem | `@capacitor/filesystem` | Read/write files |
| Geolocation | `@capacitor/geolocation` | Location services |
| Network | `@capacitor/network` | Online/offline detection |
| Status Bar | `@capacitor/status-bar` | Style the native status bar |
| Haptics | `@capacitor/haptics` | Tactile feedback |

Always check platform availability before calling native APIs:
```typescript
import { Capacitor } from '@capacitor/core';
if (Capacitor.isNativePlatform()) {
  // native-only code
}
```

---

## Delivery Checklist

Before marking any mobile task complete:

- [ ] All Ionic components imported individually (no `IonicModule`)
- [ ] Icons registered with `addIcons()` in constructor
- [ ] Standalone component with correct `imports` array
- [ ] Signals used for all reactive state (`signal()`, `computed()`)
- [ ] `inject()` used for all dependency injection (no constructor injection)
- [ ] Route is under the correct role prefix (`/parent/*` or `/teacher/*`)
- [ ] Role guard applied on the route
- [ ] Pull-to-refresh implemented on all list pages
- [ ] Offline/error state handled with user-friendly message
- [ ] Template uses `@if` / `@for` control flow (not `*ngIf` / `*ngFor`)
- [ ] No hardcoded colors — CSS variables used
- [ ] No `BehaviorSubject` or `Observable` chains where Signals suffice
- [ ] Capacitor native calls wrapped with platform check
