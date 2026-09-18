import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'caterers_controller.dart';

Future<bool?> showAddCatererDialog(BuildContext context) {
  return showDialog<bool>(context: context, builder: (context) => const _AddCatererDialog());
}

class _AddCatererDialog extends ConsumerStatefulWidget {
  const _AddCatererDialog();

  @override
  ConsumerState<_AddCatererDialog> createState() => _AddCatererDialogState();
}

class _AddCatererDialogState extends ConsumerState<_AddCatererDialog> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _servicesController = TextEditingController();
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _servicesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = l10n.fillRequiredFields);
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      final services = _servicesController.text
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();
      await ref
          .read(caterersRepositoryProvider)
          .create(name: name, phone: _phoneController.text.trim(), services: services);
      ref.invalidate(catererListProvider);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : '$e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return AlertDialog(
      title: Text(l10n.addCaterer),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(label: l10n.fullName, controller: _nameController),
            const SizedBox(height: 12),
            AppTextField(label: l10n.phoneOptional, controller: _phoneController, keyboardType: TextInputType.phone),
            const SizedBox(height: 12),
            AppTextField(label: l10n.servicesOffered, controller: _servicesController),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(l10n.cancel)),
        PrimaryButton(label: l10n.save, isLoading: _isSaving, onPressed: _save),
      ],
    );
  }
}
