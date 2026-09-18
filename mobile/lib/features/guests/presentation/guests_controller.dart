import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/guest.dart';
import '../data/guests_repository.dart';

final guestsRepositoryProvider = Provider<GuestsRepository>((ref) {
  return GuestsRepository(apiClient: ref.watch(apiClientProvider));
});

final guestListProvider = FutureProvider.family<List<Guest>, String>((ref, eventId) async {
  final repository = ref.watch(guestsRepositoryProvider);
  return repository.listForEvent(eventId);
});

final attendanceStatsProvider = FutureProvider.family<AttendanceStats, String>((ref, eventId) async {
  final repository = ref.watch(guestsRepositoryProvider);
  return repository.stats(eventId);
});
