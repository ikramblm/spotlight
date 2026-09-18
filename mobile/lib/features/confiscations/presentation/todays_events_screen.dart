import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../l10n/app_localizations.dart';
import '../../calendar/presentation/calendar_controller.dart';

/// Security Staff has no guests.view/bookings.view permission, so they can't reach a hall
/// booking's detail screen to find its eventId - but they do hold calendar.view_today, so
/// "today's events" is how they get to the confiscations module for the event they're at.
class TodaysEventsScreen extends ConsumerWidget {
  const TodaysEventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final todayAsync = ref.watch(todayEntriesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.confiscationsTitle)),
      body: todayAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (entries) {
          if (entries.isEmpty) {
            return Center(child: Text(l10n.noEventsThisDay));
          }
          return ListView.builder(
            itemCount: entries.length,
            itemBuilder: (context, index) {
              final entry = entries[index];
              return ListTile(
                title: Text('${entry.eventType} — ${entry.hallName}'),
                subtitle: Text(entry.customerName),
                onTap: () => context.push('/events/${entry.eventId}/confiscations'),
              );
            },
          );
        },
      ),
    );
  }
}
