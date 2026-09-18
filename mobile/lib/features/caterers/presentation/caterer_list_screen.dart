import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'add_caterer_dialog.dart';
import 'caterer_detail_screen.dart';
import 'caterers_controller.dart';

class CatererListScreen extends ConsumerWidget {
  const CatererListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final caterersAsync = ref.watch(catererListProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.caterersTitle)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showAddCatererDialog(context),
        child: const Icon(Icons.add),
      ),
      body: caterersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (caterers) {
          if (caterers.isEmpty) {
            return Center(child: Text(l10n.noCaterersYet));
          }
          return ListView.builder(
            itemCount: caterers.length,
            itemBuilder: (context, index) {
              final caterer = caterers[index];
              return ListTile(
                title: Text(caterer.name),
                subtitle: Text(caterer.services.join(', ')),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => CatererDetailScreen(catererId: caterer.id)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
