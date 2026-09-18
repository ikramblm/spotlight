import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/supplier.dart';
import '../data/suppliers_repository.dart';

final suppliersRepositoryProvider = Provider<SuppliersRepository>((ref) {
  return SuppliersRepository(apiClient: ref.watch(apiClientProvider));
});

final supplierListProvider = FutureProvider<List<Supplier>>((ref) async {
  return ref.watch(suppliersRepositoryProvider).list();
});

final supplierDetailProvider = FutureProvider.family<Supplier, String>((ref, id) async {
  return ref.watch(suppliersRepositoryProvider).get(id);
});
