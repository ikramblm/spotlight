import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'employees_controller.dart';

Future<bool?> showAddEmployeeDialog(BuildContext context) {
  return showDialog<bool>(context: context, builder: (context) => const _AddEmployeeDialog());
}

class _AddEmployeeDialog extends ConsumerStatefulWidget {
  const _AddEmployeeDialog();

  @override
  ConsumerState<_AddEmployeeDialog> createState() => _AddEmployeeDialogState();
}

class _AddEmployeeDialogState extends ConsumerState<_AddEmployeeDialog> {
  final _nameController = TextEditingController();
  final _positionController = TextEditingController();
  final _salaryController = TextEditingController();
  final _phoneController = TextEditingController();
  DateTime _startDate = DateTime.now();
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _positionController.dispose();
    _salaryController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2015, 1, 1),
      lastDate: DateTime(2035, 12, 31),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    final name = _nameController.text.trim();
    final position = _positionController.text.trim();
    final salary = double.tryParse(_salaryController.text.trim());

    if (name.isEmpty || position.isEmpty || salary == null) {
      setState(() => _error = l10n.fillRequiredFields);
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      await ref
          .read(employeesRepositoryProvider)
          .create(
            fullName: name,
            position: position,
            baseSalary: salary,
            startDate: _startDate,
            phone: _phoneController.text.trim(),
          );
      ref.invalidate(employeeListProvider);
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
    final dateFormat = MaterialLocalizations.of(context).formatMediumDate;

    return AlertDialog(
      title: Text(l10n.addEmployee),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(label: l10n.fullName, controller: _nameController),
            const SizedBox(height: 12),
            AppTextField(label: l10n.position, controller: _positionController),
            const SizedBox(height: 12),
            AppTextField(label: l10n.baseSalary, controller: _salaryController, keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            AppTextField(label: l10n.phoneOptional, controller: _phoneController, keyboardType: TextInputType.phone),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_today),
              label: Text('${l10n.startDate}: ${dateFormat(_startDate)}'),
            ),
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
