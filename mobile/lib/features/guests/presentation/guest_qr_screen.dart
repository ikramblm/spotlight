import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_config.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/guest.dart';
import '../../../l10n/app_localizations.dart';

/// The QR staff show/print for a guest - fetched as an authenticated image so it can't be
/// scraped by hitting the URL directly without a valid session.
class GuestQrScreen extends ConsumerWidget {
  const GuestQrScreen({super.key, required this.guest});

  final Guest guest;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final apiClient = ref.watch(apiClientProvider);
    final invitationId = guest.invitationId;

    return Scaffold(
      appBar: AppBar(title: Text(guest.fullName)),
      body: Center(
        child: invitationId == null
            ? Text(l10n.noInvitationYet)
            : Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.network(
                    '$apiBaseUrl/invitations/$invitationId/qr.png',
                    headers: apiClient.accessToken != null ? {'Authorization': 'Bearer ${apiClient.accessToken}'} : null,
                    width: 260,
                    height: 260,
                    errorBuilder: (context, error, stackTrace) => const Icon(Icons.error_outline, size: 48),
                  ),
                  const SizedBox(height: 16),
                  Text(l10n.qrCodeHint, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
      ),
    );
  }
}
