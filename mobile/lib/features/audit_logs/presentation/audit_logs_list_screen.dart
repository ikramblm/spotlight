import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../l10n/app_localizations.dart';
import 'audit_logs_controller.dart';

class AuditLogsListScreen extends ConsumerWidget {
  const AuditLogsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final dateFormat = DateFormat.yMMMd().add_Hms();
    final logsAsync = ref.watch(auditLogsListProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.auditLogTitle)),
      body: logsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (entries) {
          if (entries.isEmpty) {
            return Center(child: Text(l10n.noAuditLogEntriesYet));
          }
          return ListView.builder(
            itemCount: entries.length,
            itemBuilder: (context, index) {
              final entry = entries[index];
              return ListTile(
                leading: const Icon(Icons.history),
                title: Text(entry.action),
                subtitle: Text(entry.userName ?? l10n.systemActor),
                trailing: Text(dateFormat.format(entry.createdAt.toLocal()), style: Theme.of(context).textTheme.bodySmall),
              );
            },
          );
        },
      ),
    );
  }
}
