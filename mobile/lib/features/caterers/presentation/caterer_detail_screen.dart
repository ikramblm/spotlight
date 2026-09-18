import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'caterers_controller.dart';

class CatererDetailScreen extends ConsumerWidget {
  const CatererDetailScreen({super.key, required this.catererId});

  final String catererId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final catererAsync = ref.watch(catererDetailProvider(catererId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.caterersTitle)),
      body: catererAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (caterer) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(caterer.name, style: Theme.of(context).textTheme.titleLarge),
              if (caterer.phone != null) Text(caterer.phone!),
              if (caterer.services.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(l10n.servicesOffered, style: Theme.of(context).textTheme.titleMedium),
                Wrap(spacing: 8, children: caterer.services.map((s) => Chip(label: Text(s))).toList()),
              ],
              const Divider(height: 32),
              Text(l10n.assignedBookings, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (caterer.assignedBookings.isEmpty)
                Text(l10n.noEventsThisDay)
              else
                ...caterer.assignedBookings.map(
                  (b) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${b.eventType} — ${b.customerName}'),
                    subtitle: Text(b.eventDate),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
