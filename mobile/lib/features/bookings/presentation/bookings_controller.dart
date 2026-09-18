import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/booking_detail.dart';
import '../data/bookings_repository.dart';

final bookingsRepositoryProvider = Provider<BookingsRepository>((ref) {
  return BookingsRepository(apiClient: ref.watch(apiClientProvider));
});

final bookingDetailProvider = FutureProvider.family<BookingDetail, String>((ref, bookingId) async {
  final repository = ref.watch(bookingsRepositoryProvider);
  return repository.fetchById(bookingId);
});
