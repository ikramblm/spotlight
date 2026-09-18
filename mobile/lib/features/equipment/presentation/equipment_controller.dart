import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/equipment.dart';
import '../data/equipment_repository.dart';

final equipmentRepositoryProvider = Provider<EquipmentRepository>((ref) {
  return EquipmentRepository(apiClient: ref.watch(apiClientProvider));
});

final equipmentListProvider = FutureProvider<List<Equipment>>((ref) async {
  return ref.watch(equipmentRepositoryProvider).list();
});

final equipmentDetailProvider = FutureProvider.family<Equipment, String>((ref, id) async {
  return ref.watch(equipmentRepositoryProvider).get(id);
});
