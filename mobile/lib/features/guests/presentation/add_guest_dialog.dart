import 'package:flutter/material.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';

class AddGuestResult {
  final String fullName;
  final String? phone;
  final String? email;

  const AddGuestResult({required this.fullName, this.phone, this.email});
}

/// Returns null if the dialog was dismissed without submitting.
Future<AddGuestResult?> showAddGuestDialog(BuildContext context) {
  final l10n = AppLocalizations.of(context)!;
  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();

  return showDialog<AddGuestResult>(
    context: context,
    builder: (context) {
      return AlertDialog(
        title: Text(l10n.addGuest),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(label: l10n.fullName, controller: nameController),
            const SizedBox(height: 12),
            AppTextField(label: l10n.phoneOptional, controller: phoneController, keyboardType: TextInputType.phone),
            const SizedBox(height: 12),
            AppTextField(label: l10n.emailOptional, controller: emailController, keyboardType: TextInputType.emailAddress),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(l10n.cancel)),
          FilledButton(
            onPressed: () {
              final fullName = nameController.text.trim();
              if (fullName.isEmpty) return;
              Navigator.of(context).pop(
                AddGuestResult(
                  fullName: fullName,
                  phone: phoneController.text.trim().isEmpty ? null : phoneController.text.trim(),
                  email: emailController.text.trim().isEmpty ? null : emailController.text.trim(),
                ),
              );
            },
            child: Text(l10n.add),
          ),
        ],
      );
    },
  );
}
