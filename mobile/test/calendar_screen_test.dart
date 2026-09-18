import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:spotlight/core/models/calendar_entry.dart';
import 'package:spotlight/features/calendar/presentation/calendar_controller.dart';
import 'package:spotlight/features/calendar/presentation/calendar_screen.dart';
import 'package:spotlight/l10n/app_localizations.dart';

CalendarEntry _entryToday() {
  final today = DateTime.now();
  return CalendarEntry(
    bookingId: 'b1',
    eventId: 'e1',
    hallId: 'h1',
    hallName: 'Grand Hall',
    customerId: 'c1',
    customerName: 'Amel Bensalem',
    eventType: 'wedding',
    eventDate: DateTime(today.year, today.month, today.day),
    startTime: DateTime(today.year, today.month, today.day, 18),
    endTime: DateTime(today.year, today.month, today.day, 23),
    status: BookingStatus.confirmed,
    guestCount: 150,
    totalAmount: '300000.00',
    remainingBalance: '100000.00',
  );
}

void main() {
  testWidgets("shows today's calendar entry in the selected-day list", (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [monthEntriesProvider.overrideWith((ref, month) async => [_entryToday()])],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const CalendarScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Amel Bensalem'), findsOneWidget);
    expect(find.textContaining('Grand Hall'), findsWidgets);
  });

  testWidgets('shows the empty state when the selected day has no events', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [monthEntriesProvider.overrideWith((ref, month) async => [])],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const CalendarScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('No events on this day'), findsOneWidget);
  });
}
