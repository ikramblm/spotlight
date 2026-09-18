import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:spotlight/core/models/checkin_outcome.dart';
import 'package:spotlight/features/checkin/presentation/checkin_result_banner.dart';
import 'package:spotlight/l10n/app_localizations.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: Scaffold(body: child),
  );
}

void main() {
  testWidgets('shows the prompt when there is no outcome yet', (tester) async {
    await tester.pumpWidget(_wrap(const CheckinResultBanner(outcome: null, errorMessage: null)));
    expect(find.textContaining('Point the camera'), findsOneWidget);
  });

  testWidgets('shows the guest name and a granted label for a granted result', (tester) async {
    await tester.pumpWidget(
      _wrap(
        CheckinResultBanner(
          outcome: CheckinOutcome(guestName: 'Sarah Amrani', accessResult: AccessResult.granted, checkedInAt: DateTime.now()),
          errorMessage: null,
        ),
      ),
    );
    expect(find.text('Sarah Amrani'), findsOneWidget);
    expect(find.text('Checked in'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle), findsOneWidget);
  });

  testWidgets('shows a denial reason for denied_no_rsvp', (tester) async {
    await tester.pumpWidget(
      _wrap(
        CheckinResultBanner(
          outcome: CheckinOutcome(guestName: 'Karim Belaid', accessResult: AccessResult.deniedNoRsvp, checkedInAt: DateTime.now()),
          errorMessage: null,
        ),
      ),
    );
    expect(find.text('Karim Belaid'), findsOneWidget);
    expect(find.textContaining('no accepted RSVP'), findsOneWidget);
    expect(find.byIcon(Icons.cancel), findsOneWidget);
  });

  testWidgets('shows the raw error message when the scan itself failed', (tester) async {
    await tester.pumpWidget(_wrap(const CheckinResultBanner(outcome: null, errorMessage: "This QR code doesn't match any invitation")));
    expect(find.textContaining("doesn't match any invitation"), findsOneWidget);
    expect(find.byIcon(Icons.error_outline), findsOneWidget);
  });
}
