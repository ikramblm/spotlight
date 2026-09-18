import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/guest.dart';
import '../../../core/utils/file_export.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'add_guest_dialog.dart';
import 'guest_qr_screen.dart';
import 'guests_controller.dart';

class GuestListScreen extends ConsumerWidget {
  const GuestListScreen({super.key, required this.eventId});

  final String eventId;

  Color _rsvpColor(BuildContext context, RsvpStatus? status) {
    switch (status) {
      case RsvpStatus.accepted:
        return Colors.green;
      case RsvpStatus.declined:
        return Theme.of(context).colorScheme.error;
      case RsvpStatus.pending:
      case null:
        return Colors.grey;
    }
  }

  String _rsvpLabel(AppLocalizations l10n, RsvpStatus? status) {
    switch (status) {
      case RsvpStatus.accepted:
        return l10n.rsvpAccepted;
      case RsvpStatus.declined:
        return l10n.rsvpDeclined;
      case RsvpStatus.pending:
        return l10n.rsvpPending;
      case null:
        return l10n.notInvited;
    }
  }

  Future<void> _addGuest(BuildContext context, WidgetRef ref) async {
    final result = await showAddGuestDialog(context);
    if (result == null) return;

    try {
      await ref
          .read(guestsRepositoryProvider)
          .addGuest(eventId, fullName: result.fullName, phone: result.phone, email: result.email);
      ref.invalidate(guestListProvider(eventId));
      ref.invalidate(attendanceStatsProvider(eventId));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : '$e')));
    }
  }

  Future<void> _exportCsv(BuildContext context, WidgetRef ref) async {
    try {
      final bytes = await ref.read(guestsRepositoryProvider).exportCsv(eventId);
      await shareExportedFile(bytes: bytes, fileName: 'guests.csv', mimeType: 'text/csv');
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : '$e')));
    }
  }

  Future<void> _generateInvitation(BuildContext context, WidgetRef ref, Guest guest) async {
    try {
      await ref.read(guestsRepositoryProvider).generateInvitation(guest.id);
      ref.invalidate(guestListProvider(eventId));
      ref.invalidate(attendanceStatsProvider(eventId));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : '$e')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final guestsAsync = ref.watch(guestListProvider(eventId));
    final statsAsync = ref.watch(attendanceStatsProvider(eventId));

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.guestsTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download_outlined),
            tooltip: l10n.exportCsv,
            onPressed: () => _exportCsv(context, ref),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _addGuest(context, ref),
        child: const Icon(Icons.person_add),
      ),
      body: Column(
        children: [
          statsAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, _) => const SizedBox.shrink(),
            data: (stats) => Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _StatChip(label: l10n.statTotal, value: stats.totalGuests),
                  _StatChip(label: l10n.statInvited, value: stats.invited),
                  _StatChip(label: l10n.rsvpAccepted, value: stats.rsvpAccepted),
                  _StatChip(label: l10n.rsvpDeclined, value: stats.rsvpDeclined),
                  _StatChip(label: l10n.statCheckedIn, value: stats.checkedIn),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: guestsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text(error.toString())),
              data: (guests) {
                if (guests.isEmpty) {
                  return Center(child: Text(l10n.noGuestsYet));
                }
                return ListView.builder(
                  itemCount: guests.length,
                  itemBuilder: (context, index) {
                    final guest = guests[index];
                    return ListTile(
                      title: Text(guest.fullName),
                      subtitle: Text(guest.phone ?? guest.email ?? ''),
                      leading: guest.checkedIn ? const Icon(Icons.check_circle, color: Colors.green) : null,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          StatusBadge(label: _rsvpLabel(l10n, guest.rsvpStatus), color: _rsvpColor(context, guest.rsvpStatus)),
                          const SizedBox(width: 8),
                          if (guest.hasInvitation)
                            IconButton(
                              icon: const Icon(Icons.qr_code),
                              tooltip: l10n.viewQrCode,
                              onPressed: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => GuestQrScreen(guest: guest)),
                              ),
                            )
                          else
                            IconButton(
                              icon: const Icon(Icons.mail_outline),
                              tooltip: l10n.generateInvitation,
                              onPressed: () => _generateInvitation(context, ref, guest),
                            ),
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

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Chip(label: Text('$label: $value'));
  }
}
