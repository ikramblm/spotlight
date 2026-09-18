import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/booking_detail.dart';
import '../../../core/models/calendar_entry.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/presentation/auth_controller.dart';
import 'bookings_controller.dart';

/// Read-only booking detail. `fromCalendar`, when the screen was reached by tapping a
/// calendar entry, supplies the hall/customer names immediately (the booking API itself
/// doesn't join those in) so the header isn't blank while the rest of the detail loads.
class BookingDetailScreen extends ConsumerWidget {
  const BookingDetailScreen({super.key, required this.bookingId, this.fromCalendar});

  final String bookingId;
  final CalendarEntry? fromCalendar;

  Color _bookingStatusColor(BuildContext context, BookingStatus status) {
    switch (status) {
      case BookingStatus.confirmed:
        return Theme.of(context).colorScheme.primary;
      case BookingStatus.completed:
        return Colors.green;
      case BookingStatus.canceled:
        return Theme.of(context).colorScheme.error;
    }
  }

  Color _paymentStatusColor(BuildContext context, PaymentStatus status) {
    switch (status) {
      case PaymentStatus.paid:
        return Colors.green;
      case PaymentStatus.partial:
        return Colors.orange;
      case PaymentStatus.unpaid:
        return Theme.of(context).colorScheme.error;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final detailAsync = ref.watch(bookingDetailProvider(bookingId));
    final calendarEntry = fromCalendar;

    return Scaffold(
      appBar: AppBar(title: Text(calendarEntry?.eventType ?? l10n.bookingDetailTitle)),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(error.toString()))),
        data: (detail) {
          final dateFormat = MaterialLocalizations.of(context).formatMediumDate;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (calendarEntry != null) ...[
                Text(calendarEntry.hallName, style: Theme.of(context).textTheme.titleLarge),
                Text(calendarEntry.customerName, style: Theme.of(context).textTheme.bodyLarge),
                const SizedBox(height: 8),
              ],
              Wrap(
                spacing: 8,
                children: [
                  StatusBadge(
                    label: detail.status.name,
                    color: _bookingStatusColor(context, detail.status),
                  ),
                  StatusBadge(
                    label: detail.paymentStatus.name,
                    color: _paymentStatusColor(context, detail.paymentStatus),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _InfoRow(label: l10n.eventDate, value: dateFormat(detail.startTime)),
              _InfoRow(
                label: l10n.eventTime,
                value:
                    '${TimeOfDay.fromDateTime(detail.startTime).format(context)} - '
                    '${TimeOfDay.fromDateTime(detail.endTime).format(context)}',
              ),
              if (detail.guestCount != null) _InfoRow(label: l10n.guestCount, value: '${detail.guestCount}'),
              const Divider(height: 32),
              _InfoRow(label: l10n.totalAmount, value: '${detail.totalAmount} DZD'),
              _InfoRow(label: l10n.advancePayment, value: '${detail.advancePayment} DZD'),
              _InfoRow(label: l10n.remainingBalance, value: '${detail.remainingBalance} DZD'),
              if (detail.services.isNotEmpty) ...[
                const Divider(height: 32),
                Text(l10n.services, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ...detail.services.map(
                  (s) => _InfoRow(label: '${s.quantity} × ${s.serviceId}', value: '${s.unitPrice} DZD'),
                ),
              ],
              if (detail.notes != null && detail.notes!.isNotEmpty) ...[
                const Divider(height: 32),
                Text(l10n.notes, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(detail.notes!),
              ],
              if (detail.eventId != null &&
                  (ref.watch(authControllerProvider).value?.hasPermission('guests.view') ?? false)) ...[
                const Divider(height: 32),
                PrimaryButton(
                  label: l10n.guestsTitle,
                  onPressed: () => context.push('/events/${detail.eventId}/guests'),
                ),
              ],
              if (detail.eventId != null &&
                  (ref.watch(authControllerProvider).value?.hasPermission('confiscations.view') ?? false)) ...[
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => context.push('/events/${detail.eventId}/confiscations'),
                  child: Text(l10n.confiscationsTitle),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
          Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
