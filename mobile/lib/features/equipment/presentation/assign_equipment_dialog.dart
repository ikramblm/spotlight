import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'equipment_controller.dart';

Future<bool?> showAssignEquipmentDialog(BuildContext context, String equipmentId) {
  return showDialog<bool>(context: context, builder: (context) => _AssignEquipmentDialog(equipmentId: equipmentId));
}

class _AssignEquipmentDialog extends ConsumerStatefulWidget {
  const _AssignEquipmentDialog({required this.equipmentId});

  final String equipmentId;

  @override
  ConsumerState<_AssignEquipmentDialog> createState() => _AssignEquipmentDialogState();
}

class _AssignEquipmentDialogState extends ConsumerState<_AssignEquipmentDialog> {
  final _bookingIdController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _bookingIdController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    final bookingId = _bookingIdController.text.trim();
    final quantity = int.tryParse(_quantityController.text.trim());

    if (bookingId.isEmpty || quantity == null) {
      setState(() => _error = l10n.fillRequiredFields);
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      await ref.read(equipmentRepositoryProvider).assign(equipmentId: widget.equipmentId, bookingId: bookingId, quantity: quantity);
      ref.invalidate(equipmentDetailProvider(widget.equipmentId));
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
      title: Text(l10n.assignEquipment),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(label: l10n.bookingIdLabel, controller: _bookingIdController),
            const SizedBox(height: 12),
            AppTextField(label: l10n.quantity, controller: _quantityController, keyboardType: TextInputType.number),
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
