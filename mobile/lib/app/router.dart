import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/models/calendar_entry.dart';
import '../features/archives/presentation/archives_list_screen.dart';
import '../features/audit_logs/presentation/audit_logs_list_screen.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/bookings/presentation/booking_detail_screen.dart';
import '../features/calendar/presentation/calendar_screen.dart';
import '../features/checkin/presentation/checkin_scanner_screen.dart';
import '../features/caterers/presentation/caterer_list_screen.dart';
import '../features/confiscations/presentation/confiscation_list_screen.dart';
import '../features/confiscations/presentation/todays_events_screen.dart';
import '../features/employees/presentation/employee_list_screen.dart';
import '../features/equipment/presentation/equipment_list_screen.dart';
import '../features/expenses/presentation/expenses_list_screen.dart';
import '../features/expenses/presentation/financial_summary_screen.dart';
import '../features/guests/presentation/guest_list_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/suppliers/presentation/supplier_list_screen.dart';

/// Route guard: unauthenticated users always land on /login, authenticated users never
/// see /login. UI-level convenience only - every request is still authorized server-side.
final routerProvider = Provider<GoRouter>((ref) {
  final refreshSignal = ValueNotifier<int>(0);
  ref.listen(authControllerProvider, (_, _) => refreshSignal.value++);
  ref.onDispose(refreshSignal.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refreshSignal,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final isRestoringSession = authState.isLoading && !authState.hasValue;
      if (isRestoringSession) return null;

      final isLoggedIn = authState.value != null;
      final goingToLogin = state.matchedLocation == '/login';

      if (!isLoggedIn && !goingToLogin) return '/login';
      if (isLoggedIn && goingToLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/calendar', builder: (context, state) => const CalendarScreen()),
      GoRoute(
        path: '/bookings/:id',
        builder: (context, state) => BookingDetailScreen(
          bookingId: state.pathParameters['id']!,
          fromCalendar: state.extra is CalendarEntry ? state.extra as CalendarEntry : null,
        ),
      ),
      GoRoute(
        path: '/events/:eventId/guests',
        builder: (context, state) => GuestListScreen(eventId: state.pathParameters['eventId']!),
      ),
      GoRoute(path: '/checkin', builder: (context, state) => const CheckinScannerScreen()),
      GoRoute(path: '/confiscations', builder: (context, state) => const TodaysEventsScreen()),
      GoRoute(
        path: '/events/:eventId/confiscations',
        builder: (context, state) => ConfiscationListScreen(eventId: state.pathParameters['eventId']!),
      ),
      GoRoute(path: '/finances', builder: (context, state) => const FinancialSummaryScreen()),
      GoRoute(path: '/expenses', builder: (context, state) => const ExpensesListScreen()),
      GoRoute(path: '/employees', builder: (context, state) => const EmployeeListScreen()),
      GoRoute(path: '/caterers', builder: (context, state) => const CatererListScreen()),
      GoRoute(path: '/suppliers', builder: (context, state) => const SupplierListScreen()),
      GoRoute(path: '/equipment', builder: (context, state) => const EquipmentListScreen()),
      GoRoute(path: '/archives', builder: (context, state) => const ArchivesListScreen()),
      GoRoute(path: '/audit-logs', builder: (context, state) => const AuditLogsListScreen()),
    ],
  );
});
