import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'suppliers_controller.dart';

class SupplierDetailScreen extends ConsumerWidget {
  const SupplierDetailScreen({super.key, required this.supplierId});

  final String supplierId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final supplierAsync = ref.watch(supplierDetailProvider(supplierId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.suppliersTitle)),
      body: supplierAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (supplier) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(supplier.name, style: Theme.of(context).textTheme.titleLarge),
              if (supplier.phone != null) Text(supplier.phone!),
              if (supplier.products.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(l10n.productsOffered, style: Theme.of(context).textTheme.titleMedium),
                Wrap(spacing: 8, children: supplier.products.map((p) => Chip(label: Text(p))).toList()),
              ],
              const Divider(height: 32),
              Text(l10n.linkedEquipment, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (supplier.equipment.isEmpty)
                Text(l10n.noEquipmentYet)
              else
                ...supplier.equipment.map(
                  (e) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(e.name),
                    subtitle: Text(e.category),
                    trailing: Text('${e.quantityAvailable}/${e.quantityTotal}'),
                  ),
                ),
              const Divider(height: 32),
              Text(l10n.purchaseHistory, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (supplier.purchaseHistory.isEmpty)
                Text(l10n.noExpensesYet)
              else
                ...supplier.purchaseHistory.map(
                  (e) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(e.description?.isNotEmpty == true ? e.description! : e.categoryName),
                    subtitle: Text(e.expenseDate),
                    trailing: Text('${e.amount} DZD'),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
