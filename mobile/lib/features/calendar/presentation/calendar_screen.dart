import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../core/models/calendar_entry.dart';
import '../../../l10n/app_localizations.dart';
import 'calendar_controller.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _focusedMonth = DateTime.now();
  DateTime _selectedDay = DateTime.now();

  DateTime _dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);

  Map<DateTime, List<CalendarEntry>> _groupByDay(List<CalendarEntry> entries) {
    final map = <DateTime, List<CalendarEntry>>{};
    for (final entry in entries) {
      final day = _dateOnly(entry.startTime);
      map.putIfAbsent(day, () => []).add(entry);
    }
    return map;
  }

  Color _statusColor(BuildContext context, BookingStatus status) {
    switch (status) {
      case BookingStatus.confirmed:
        return Theme.of(context).colorScheme.primary;
      case BookingStatus.completed:
        return Colors.green;
      case BookingStatus.canceled:
        return Theme.of(context).colorScheme.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final monthAsync = ref.watch(monthEntriesProvider(DateTime(_focusedMonth.year, _focusedMonth.month, 1)));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.calendarTitle)),
      body: monthAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (entries) {
          final byDay = _groupByDay(entries);
          final selectedEntries = byDay[_dateOnly(_selectedDay)] ?? const <CalendarEntry>[];

          return Column(
            children: [
              TableCalendar<CalendarEntry>(
                firstDay: DateTime(2020, 1, 1),
                lastDay: DateTime(2035, 12, 31),
                focusedDay: _focusedMonth,
                selectedDayPredicate: (day) => isSameDay(day, _selectedDay),
                eventLoader: (day) => byDay[_dateOnly(day)] ?? const [],
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    _selectedDay = selectedDay;
                    _focusedMonth = focusedDay;
                  });
                },
                onPageChanged: (focusedDay) {
                  setState(() => _focusedMonth = focusedDay);
                },
                calendarStyle: const CalendarStyle(markersMaxCount: 3),
              ),
              const Divider(height: 1),
              Expanded(
                child: selectedEntries.isEmpty
                    ? Center(child: Text(l10n.noEventsThisDay))
                    : ListView.builder(
                        itemCount: selectedEntries.length,
                        itemBuilder: (context, index) {
                          final entry = selectedEntries[index];
                          final timeRange =
                              '${TimeOfDay.fromDateTime(entry.startTime).format(context)} - '
                              '${TimeOfDay.fromDateTime(entry.endTime).format(context)}';
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: _statusColor(context, entry.status),
                              child: Text(entry.hallName.isNotEmpty ? entry.hallName[0] : '?'),
                            ),
                            title: Text('${entry.eventType} — ${entry.customerName}'),
                            subtitle: Text('${entry.hallName} · $timeRange'),
                            onTap: () => context.push('/bookings/${entry.bookingId}', extra: entry),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
