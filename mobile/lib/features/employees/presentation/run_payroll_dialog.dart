import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'employees_controller.dart';

Future<bool?> showRunPayrollDialog(BuildContext context, String employeeId) {
  return showDialog<bool>(context: context, builder: (context) => _RunPayrollDialog(employeeId: employeeId));
}

class _RunPayrollDialog extends ConsumerStatefulWidget {
  const _RunPayrollDialog({required this.employeeId});

  final String employeeId;

  @override
  ConsumerState<_RunPayrollDialog> createState() => _RunPayrollDialogState();
}

class _RunPayrollDialogState extends ConsumerState<_RunPayrollDialog> {
  DateTime? _periodStart;
  DateTime? _periodEnd;
  final _bonusesController = TextEditingController();
  final _deductionsController = TextEditingController();
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _bonusesController.dispose();
    _deductionsController.dispose();
    super.dispose();
  }

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020, 1, 1),
      lastDate: DateTime(2035, 12, 31),
      initialDateRange: DateTimeRange(start: DateTime(now.year, now.month, 1), end: DateTime(now.year, now.month + 1, 0)),
    );
    if (range != null) {
      setState(() {
        _periodStart = range.start;
        _periodEnd = range.end;
      });
    }
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    if (_periodStart == null || _periodEnd == null) {
      setState(() => _error = l10n.selectPeriod);
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      await ref
          .read(employeesRepositoryProvider)
          .runPayroll(
            employeeId: widget.employeeId,
            periodStart: _periodStart!,
            periodEnd: _periodEnd!,
            bonuses: double.tryParse(_bonusesController.text.trim()) ?? 0,
            deductions: double.tryParse(_deductionsController.text.trim()) ?? 0,
          );
      ref.invalidate(payrollHistoryProvider(widget.employeeId));
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
    final periodStart = _periodStart;
    final periodEnd = _periodEnd;

    return AlertDialog(
      title: Text(l10n.runPayroll),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            OutlinedButton.icon(
              onPressed: _pickRange,
              icon: const Icon(Icons.date_range),
              label: Text(
                periodStart != null && periodEnd != null
                    ? '${dateFormat(periodStart)} – ${dateFormat(periodEnd)}'
                    : l10n.selectPeriod,
              ),
            ),
            const SizedBox(height: 12),
            AppTextField(label: l10n.bonusesOptional, controller: _bonusesController, keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            AppTextField(
              label: l10n.deductionsOptional,
              controller: _deductionsController,
              keyboardType: TextInputType.number,
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
