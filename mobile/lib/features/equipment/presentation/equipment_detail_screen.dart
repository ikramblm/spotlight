import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/equipment.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'assign_equipment_dialog.dart';
import 'equipment_controller.dart';

class EquipmentDetailScreen extends ConsumerWidget {
  const EquipmentDetailScreen({super.key, required this.equipmentId});

  final String equipmentId;

  Future<void> _returnAssignment(BuildContext context, WidgetRef ref, EquipmentAssignment assignment) async {
    try {
      await ref.read(equipmentRepositoryProvider).returnAssignment(assignment.id);
      ref.invalidate(equipmentDetailProvider(equipmentId));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : '$e')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final equipmentAsync = ref.watch(equipmentDetailProvider(equipmentId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.equipmentTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showAssignEquipmentDialog(context, equipmentId),
        icon: const Icon(Icons.assignment_turned_in_outlined),
        label: Text(l10n.assignEquipment),
      ),
      body: equipmentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (equipment) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(equipment.name, style: Theme.of(context).textTheme.titleLarge),
              Text(equipment.category, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 8),
              Text('${l10n.quantityAvailable}: ${equipment.quantityAvailable} / ${equipment.quantityTotal}'),
              if (equipment.location != null) Text(equipment.location!),
              const Divider(height: 32),
              Text(l10n.assignmentHistory, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (equipment.assignments.isEmpty)
                Text(l10n.noAssignmentsYet)
              else
                ...equipment.assignments.map(
                  (a) => Card(
                    child: ListTile(
                      title: Text('${a.eventType} — ${a.eventDate}'),
                      subtitle: Text('${l10n.quantity}: ${a.quantity}'),
                      trailing: a.isReturned
                          ? StatusBadge(label: l10n.returned, color: Colors.green)
                          : TextButton(
                              onPressed: () => _returnAssignment(context, ref, a),
                              child: Text(l10n.returnEquipment),
                            ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
