import 'package:flutter/material.dart';

/// Single source of truth for the app's look, so every screen (owner dashboard, security
/// check-in) shares one visual identity instead of each feature reinventing it.
ThemeData buildSpotlightTheme() {
  const seedColor = Color(0xFF1F4E5F);

  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: seedColor),
    inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
    ),
  );
}
