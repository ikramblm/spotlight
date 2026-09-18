import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/caterer.dart';
import '../data/caterers_repository.dart';

final caterersRepositoryProvider = Provider<CaterersRepository>((ref) {
  return CaterersRepository(apiClient: ref.watch(apiClientProvider));
});

final catererListProvider = FutureProvider<List<Caterer>>((ref) async {
  return ref.watch(caterersRepositoryProvider).list();
});

final catererDetailProvider = FutureProvider.family<Caterer, String>((ref, id) async {
  return ref.watch(caterersRepositoryProvider).get(id);
});
