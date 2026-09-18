import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/confiscation.dart';
import '../data/confiscations_repository.dart';

final confiscationsRepositoryProvider = Provider<ConfiscationsRepository>((ref) {
  return ConfiscationsRepository(apiClient: ref.watch(apiClientProvider));
});

final confiscationListProvider = FutureProvider.family<List<Confiscation>, String>((ref, eventId) async {
  final repository = ref.watch(confiscationsRepositoryProvider);
  return repository.listForEvent(eventId);
});
