import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/confiscation.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/presentation/auth_controller.dart';
import 'add_confiscation_screen.dart';
import 'confiscation_detail_sheet.dart';
import 'confiscations_controller.dart';

class ConfiscationListScreen extends ConsumerWidget {
  const ConfiscationListScreen({super.key, required this.eventId});

  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final itemsAsync = ref.watch(confiscationListProvider(eventId));
    final canCreate = ref.watch(authControllerProvider).value?.hasPermission('confiscations.create') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.confiscationsTitle)),
      floatingActionButton: canCreate
          ? FloatingActionButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => AddConfiscationScreen(eventId: eventId)),
              ),
              child: const Icon(Icons.add),
            )
          : null,
      body: itemsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (items) {
          if (items.isEmpty) {
            return Center(child: Text(l10n.noConfiscationsYet));
          }
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              final isHolding = item.status == RestitutionStatus.holding;
              return ListTile(
                leading: Icon(
                  item.itemType == ItemType.phone
                      ? Icons.phone_iphone
                      : item.itemType == ItemType.camera
                      ? Icons.camera_alt
                      : Icons.inventory_2_outlined,
                ),
                title: Text(item.guestName),
                subtitle: Text(item.storageReference),
                trailing: StatusBadge(
                  label: isHolding ? l10n.holding : l10n.returned,
                  color: isHolding ? Colors.orange : Colors.green,
                ),
                onTap: () => showConfiscationDetail(context, item, eventId),
              );
            },
          );
        },
      ),
    );
  }
}
