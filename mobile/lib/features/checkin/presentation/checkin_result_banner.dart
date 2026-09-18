import 'package:flutter/material.dart';
import '../../../core/models/checkin_outcome.dart';
import '../../../l10n/app_localizations.dart';

/// The single most important piece of UI in the security-staff shell (spec §24: "especially
/// simple"): one glance tells you granted (green), denied (red), or an error (grey) - no
/// reading required at a glance, the label is there for when you do read it.
class CheckinResultBanner extends StatelessWidget {
  const CheckinResultBanner({super.key, required this.outcome, required this.errorMessage});

  final CheckinOutcome? outcome;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    if (outcome == null && errorMessage == null) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Text(l10n.scanQrToCheckIn, textAlign: TextAlign.center),
      );
    }

    final Color color;
    final IconData icon;
    final String title;
    final String? subtitle;

    if (errorMessage != null) {
      color = Colors.grey.shade700;
      icon = Icons.error_outline;
      title = errorMessage!;
      subtitle = null;
    } else {
      final result = outcome!;
      switch (result.accessResult) {
        case AccessResult.granted:
          color = Colors.green;
          icon = Icons.check_circle;
          title = result.guestName;
          subtitle = l10n.checkedInGranted;
        case AccessResult.override:
          color = Colors.orange;
          icon = Icons.warning_amber;
          title = result.guestName;
          subtitle = l10n.checkedInOverride;
        case AccessResult.deniedNoRsvp:
          color = Theme.of(context).colorScheme.error;
          icon = Icons.cancel;
          title = result.guestName;
          subtitle = l10n.deniedNoRsvp;
        case AccessResult.deniedWrongEvent:
          color = Theme.of(context).colorScheme.error;
          icon = Icons.cancel;
          title = result.guestName;
          subtitle = l10n.deniedWrongEvent;
      }
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      color: color.withValues(alpha: 0.15),
      child: Column(
        children: [
          Icon(icon, color: color, size: 48),
          const SizedBox(height: 8),
          Text(title, style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
          if (subtitle != null) Text(subtitle, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
