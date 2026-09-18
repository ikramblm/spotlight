import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:spotlight/app/app.dart';
import 'package:spotlight/core/models/user.dart';
import 'package:spotlight/features/auth/presentation/auth_controller.dart';

/// Skips AuthController's real build() (which would hit flutter_secure_storage's platform
/// channel - unavailable in widget tests) and starts the app already "logged out".
class _LoggedOutAuthController extends AuthController {
  @override
  Future<AuthenticatedUser?> build() async => null;
}

void main() {
  testWidgets('shows the login form when there is no active session', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authControllerProvider.overrideWith(_LoggedOutAuthController.new)],
        child: const SpotlightApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Spotlight'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Email'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Password'), findsOneWidget);
  });

  testWidgets('shows a validation message when submitting an empty form', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authControllerProvider.overrideWith(_LoggedOutAuthController.new)],
        child: const SpotlightApp(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
    await tester.pumpAndSettle();

    expect(find.text('Enter your email and password.'), findsOneWidget);
  });
}
