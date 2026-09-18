import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../l10n/app_localizations.dart';
import 'archives_controller.dart';

const _entityTypes = ["customer", "hall", "service", "employee", "caterer", "supplier", "equipment"];

class ArchivesListScreen extends ConsumerStatefulWidget {
  const ArchivesListScreen({super.key});

  @override
  ConsumerState<ArchivesListScreen> createState() => _ArchivesListScreenState();
}

class _ArchivesListScreenState extends ConsumerState<ArchivesListScreen> {
  String? _entityType;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final dateFormat = DateFormat.yMMMd().add_Hm();
    final archivesAsync = ref.watch(archivesListProvider(_entityType));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.archivesTitle)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: Text(l10n.allTypes),
                  selected: _entityType == null,
                  onSelected: (_) => setState(() => _entityType = null),
                ),
                for (final type in _entityTypes)
                  ChoiceChip(
                    label: Text(type),
                    selected: _entityType == type,
                    onSelected: (_) => setState(() => _entityType = type),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: archivesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text(error.toString())),
              data: (entries) {
                if (entries.isEmpty) {
                  return Center(child: Text(l10n.noArchivesYet));
                }
                return ListView.builder(
                  itemCount: entries.length,
                  itemBuilder: (context, index) {
                    final entry = entries[index];
                    return ListTile(
                      leading: const Icon(Icons.inventory_2_outlined),
                      title: Text('${entry.entityType} · ${entry.entityId.substring(0, 8)}'),
                      subtitle: Text(entry.reason ?? l10n.noReasonGiven),
                      trailing: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(entry.archivedByName, style: Theme.of(context).textTheme.bodySmall),
                          Text(dateFormat.format(entry.archivedAt.toLocal()), style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
