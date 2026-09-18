import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/calendar_entry.dart';
import '../data/calendar_repository.dart';

final calendarRepositoryProvider = Provider<CalendarRepository>((ref) {
  return CalendarRepository(apiClient: ref.watch(apiClientProvider));
});

/// One month of calendar entries, keyed by the first day of that month - table_calendar
/// pages month by month, so this keeps each page's data separately cached/refetchable.
final monthEntriesProvider = FutureProvider.family<List<CalendarEntry>, DateTime>((ref, month) async {
  final repository = ref.watch(calendarRepositoryProvider);
  final from = DateTime(month.year, month.month, 1);
  final to = DateTime(month.year, month.month + 1, 0, 23, 59, 59);
  return repository.fetchRange(from: from, to: to);
});

/// Today's events only - what Security Staff's calendar.view_today permission actually grants
/// them, and how they reach the confiscations module without guests.view/bookings.view.
final todayEntriesProvider = FutureProvider<List<CalendarEntry>>((ref) async {
  final repository = ref.watch(calendarRepositoryProvider);
  return repository.fetchToday();
});
