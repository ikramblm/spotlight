# Spotlight — Mobile / Web app (Phase 1 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10)

Flutter app targeting iOS, Android and Web from one codebase.

- **Phase 1:** login, session persistence (refresh-token based), role-aware routing.
- **Phase 3:** a month-view calendar (`table_calendar`) backed by `GET /calendar`, and a
  read-only booking detail screen reached by tapping a day's event.
- **Phase 4:** a guest list per event (add, import status, attendance stats, generate/view an
  invitation QR), and the Security Staff check-in scanner (`mobile_scanner`) with a manual-entry
  fallback and an override action for duplicate scans.
- **Phase 5:** confiscated-item logging (`image_picker` for an optional camera photo) and
  restitution, reached either from a booking's event or — since Security Staff can't see
  bookings/guests directly — from a "today's events" picker off the home screen.
- **Phase 6:** a financial summary (KPI cards + a date-range picker + per-category breakdown)
  and an expense list/add flow with a category filter — visible only to Business Owner.
- **Phase 7:** an employee list/add flow, and a per-employee detail screen with payroll history
  and a "run payroll" action — visible only to Business Owner.
- **Phase 8:** caterer and supplier list/detail screens (assigned bookings, purchase history,
  linked equipment), and an equipment list/detail screen with an assign-to-booking dialog and
  per-assignment "return" action.
- **Phase 9:** a role-aware KPI summary on the home screen (backed by `GET /dashboard` - which
  cards render depends on the signed-in user's own permissions), an archives browser and an
  audit log viewer (both Business Owner only), and "export" actions (guest list to CSV,
  financial summary to PDF) that hand the downloaded bytes to the platform share sheet.
- **Phase 10:** no new screens - the backend/deployment hardening phase. `flutter analyze` and
  `flutter test` now run in CI (`.github/workflows/mobile-ci.yml`) on every push/PR that touches
  `mobile/`, the same checks that have been run manually at the end of every phase so far.
  `.github/workflows/mobile-release.yml` additionally builds a release APK on every push to
  `main` and publishes it to a rolling "latest" GitHub Release - signed with Flutter's default
  debug keystore, so it installs fine for sideloading/testing but isn't set up for Play Store
  distribution (that needs a real signing key - see the TODO in
  `android/app/build.gradle.kts`).

See the architecture doc §28 for the Phase 10 roadmap (security hardening, load/edge-case
testing, deployment).

## Setup

```bash
flutter pub get
flutter gen-l10n   # regenerates lib/l10n/app_localizations.dart from assets/l10n/*.arb
```

By default the app talks to `http://localhost:4000/api/v1` (the backend's Phase 1 auth/users
routes). Point it elsewhere with:

```bash
flutter run --dart-define=API_BASE_URL=https://your-api.example.com/api/v1
```

Log in with the demo Business Owner account created by the backend's `npm run seed`.

## Running tests

```bash
flutter test
```

`test/login_screen_test.dart` overrides `authControllerProvider` so tests never touch
`flutter_secure_storage`'s platform channel (unavailable under `flutter test`) or the network.
`CheckinScannerScreen`'s camera itself isn't covered here for the same reason (`mobile_scanner`
needs a real platform camera) — `test/checkin_result_banner_test.dart` covers the part of that
screen that *is* pure Dart: what each access result looks like on screen. Verify the actual
camera path on a device or emulator.

## Structure

```
lib/
  app/              MaterialApp.router shell, go_router redirect guard, theme
  core/
    api/            ApiClient (Dio + auth interceptor), AuthApi (bare Dio for login/refresh),
                     TokenStorage (flutter_secure_storage wrapper)
    models/         Shared DTOs (AuthenticatedUser, UserRole)
  design_system/    Shared widgets (spotlight_ui) — grows with each phase
  features/
    auth/           login, session restore, logout (data/domain/presentation)
    home/           role-aware KPI summary (GET /dashboard) + entry points into every module
                    the signed-in user's permissions unlock
    calendar/       month view + day list, backed by GET /calendar and /calendar/today
    bookings/       read-only booking detail screen (services, payment, notes)
    guests/         guest list, add/import status, attendance stats, invitation QR view
    checkin/        QR scanner + manual entry + result banner (granted/denied/override)
    confiscations/  deposit an item (camera photo optional), list per event, return it
    expenses/       financial summary (KPI cards, category breakdown), expense list/add
    employees/      employee list/add, payroll history + run payroll per employee
    caterers/       caterer list/add, detail with assigned bookings
    suppliers/      supplier list/add, detail with purchase history + linked equipment
    equipment/      equipment list/add, detail with assign-to-booking + return per assignment
    dashboard/      the KPI summary data/controller behind the home screen
    archives/       browse the "what was archived, when, and why" trail (Business Owner only)
    audit_logs/     browse the security audit trail (Business Owner only)
assets/l10n/        app_en.arb / app_fr.arb / app_ar.arb (source of truth for translations)
```

## Localization

French, Arabic and English are wired end to end: `MaterialApp` declares all three as supported
locales, and Arabic automatically renders right-to-left. Add new UI text to `assets/l10n/app_en.arb`
first (with a matching `fr`/`ar` translation), then run `flutter gen-l10n`.
