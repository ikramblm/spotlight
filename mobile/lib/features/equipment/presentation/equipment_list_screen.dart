import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'add_equipment_dialog.dart';
import 'equipment_controller.dart';
import 'equipment_detail_screen.dart';

class EquipmentListScreen extends ConsumerWidget {
  const EquipmentListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final equipmentAsync = ref.watch(equipmentListProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.equipmentTitle)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showAddEquipmentDialog(context),
        child: const Icon(Icons.add),
      ),
      body: equipmentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (items) {
          if (items.isEmpty) {
            return Center(child: Text(l10n.noEquipmentYet));
          }
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return ListTile(
                title: Text(item.name),
                subtitle: Text(item.category),
                trailing: Text('${item.quantityAvailable}/${item.quantityTotal}'),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => EquipmentDetailScreen(equipmentId: item.id)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
