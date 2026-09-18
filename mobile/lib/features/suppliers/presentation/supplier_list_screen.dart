import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'add_supplier_dialog.dart';
import 'supplier_detail_screen.dart';
import 'suppliers_controller.dart';

class SupplierListScreen extends ConsumerWidget {
  const SupplierListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final suppliersAsync = ref.watch(supplierListProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.suppliersTitle)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showAddSupplierDialog(context),
        child: const Icon(Icons.add),
      ),
      body: suppliersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (suppliers) {
          if (suppliers.isEmpty) {
            return Center(child: Text(l10n.noSuppliersYet));
          }
          return ListView.builder(
            itemCount: suppliers.length,
            itemBuilder: (context, index) {
              final supplier = suppliers[index];
              return ListTile(
                title: Text(supplier.name),
                subtitle: Text(supplier.products.join(', ')),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => SupplierDetailScreen(supplierId: supplier.id)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
