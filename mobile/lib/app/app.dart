import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../l10n/app_localizations.dart';
import 'router.dart';
import 'theme.dart';

class SpotlightApp extends ConsumerWidget {
  const SpotlightApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = buildSpotlightTheme();
    final authState = ref.watch(authControllerProvider);
    final isRestoringSession = authState.isLoading && !authState.hasValue;

    if (isRestoringSession) {
      return MaterialApp(
        theme: theme,
        debugShowCheckedModeBanner: false,
        home: const Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Spotlight',
      theme: theme,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}
