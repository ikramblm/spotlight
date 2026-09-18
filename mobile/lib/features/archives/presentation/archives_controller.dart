import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/archive_entry.dart';
import '../data/archives_repository.dart';

final archivesRepositoryProvider = Provider<ArchivesRepository>((ref) {
  return ArchivesRepository(apiClient: ref.watch(apiClientProvider));
});

final archivesListProvider = FutureProvider.family<List<ArchiveEntry>, String?>((ref, entityType) async {
  return ref.watch(archivesRepositoryProvider).list(entityType: entityType);
});
