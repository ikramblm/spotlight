import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/expense.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'expenses_controller.dart';

Future<bool?> showAddExpenseDialog(BuildContext context) {
  return showDialog<bool>(context: context, builder: (context) => const _AddExpenseDialog());
}

class _AddExpenseDialog extends ConsumerStatefulWidget {
  const _AddExpenseDialog();

  @override
  ConsumerState<_AddExpenseDialog> createState() => _AddExpenseDialogState();
}

class _AddExpenseDialogState extends ConsumerState<_AddExpenseDialog> {
  int? _categoryId;
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime _date = DateTime.now();
  PaymentMethod _paymentMethod = PaymentMethod.cash;
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020, 1, 1),
      lastDate: DateTime(2035, 12, 31),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    final amount = double.tryParse(_amountController.text.trim());

    if (_categoryId == null || amount == null) {
      setState(() => _error = l10n.selectCategoryAndAmount);
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      await ref
          .read(expensesRepositoryProvider)
          .create(
            categoryId: _categoryId!,
            amount: amount,
            expenseDate: _date,
            paymentMethod: _paymentMethod,
            description: _descriptionController.text.trim(),
          );
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
    final categoriesAsync = ref.watch(expenseCategoriesProvider);
    final dateFormat = MaterialLocalizations.of(context).formatMediumDate;

    return AlertDialog(
      title: Text(l10n.addExpense),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            categoriesAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (error, _) => Text(error.toString()),
              data: (categories) => DropdownButtonFormField<int>(
                initialValue: _categoryId,
                decoration: InputDecoration(labelText: l10n.category, border: const OutlineInputBorder()),
                hint: Text(l10n.selectCategory),
                items: categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                onChanged: (value) => setState(() => _categoryId = value),
              ),
            ),
            const SizedBox(height: 12),
            AppTextField(label: l10n.amount, controller: _amountController, keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_today),
              label: Text(dateFormat(_date)),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<PaymentMethod>(
              initialValue: _paymentMethod,
              decoration: InputDecoration(labelText: l10n.paymentMethod, border: const OutlineInputBorder()),
              items: [
                DropdownMenuItem(value: PaymentMethod.cash, child: Text(l10n.paymentMethodCash)),
                DropdownMenuItem(value: PaymentMethod.bankTransfer, child: Text(l10n.paymentMethodBankTransfer)),
                DropdownMenuItem(value: PaymentMethod.card, child: Text(l10n.paymentMethodCard)),
                DropdownMenuItem(value: PaymentMethod.check, child: Text(l10n.paymentMethodCheck)),
              ],
              onChanged: (value) => setState(() => _paymentMethod = value ?? PaymentMethod.cash),
            ),
            const SizedBox(height: 12),
            AppTextField(label: l10n.descriptionOptional, controller: _descriptionController),
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
