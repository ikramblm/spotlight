import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'equipment_controller.dart';

Future<bool?> showAddEquipmentDialog(BuildContext context) {
  return showDialog<bool>(context: context, builder: (context) => const _AddEquipmentDialog());
}

class _AddEquipmentDialog extends ConsumerStatefulWidget {
  const _AddEquipmentDialog();

  @override
  ConsumerState<_AddEquipmentDialog> createState() => _AddEquipmentDialogState();
}

class _AddEquipmentDialogState extends ConsumerState<_AddEquipmentDialog> {
  final _nameController = TextEditingController();
  final _categoryController = TextEditingController();
  final _quantityController = TextEditingController();
  final _locationController = TextEditingController();
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _categoryController.dispose();
    _quantityController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    final name = _nameController.text.trim();
    final category = _categoryController.text.trim();
    final quantity = int.tryParse(_quantityController.text.trim());

    if (name.isEmpty || category.isEmpty || quantity == null) {
      setState(() => _error = l10n.fillRequiredFields);
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      await ref
          .read(equipmentRepositoryProvider)
          .create(name: name, category: category, quantityTotal: quantity, location: _locationController.text.trim());
      ref.invalidate(equipmentListProvider);
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
      title: Text(l10n.addEquipment),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(label: l10n.fullName, controller: _nameController),
            const SizedBox(height: 12),
            AppTextField(label: l10n.category, controller: _categoryController),
            const SizedBox(height: 12),
            AppTextField(label: l10n.quantityTotal, controller: _quantityController, keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            AppTextField(label: l10n.locationOptional, controller: _locationController),
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
