import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/audit_log_entry.dart';
import '../data/audit_logs_repository.dart';

final auditLogsRepositoryProvider = Provider<AuditLogsRepository>((ref) {
  return AuditLogsRepository(apiClient: ref.watch(apiClientProvider));
});

final auditLogsListProvider = FutureProvider<List<AuditLogEntry>>((ref) async {
  return ref.watch(auditLogsRepositoryProvider).list();
});
