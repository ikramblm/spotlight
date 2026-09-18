import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'add_expense_dialog.dart';
import 'expenses_controller.dart';

class ExpensesListScreen extends ConsumerStatefulWidget {
  const ExpensesListScreen({super.key});

  @override
  ConsumerState<ExpensesListScreen> createState() => _ExpensesListScreenState();
}

class _ExpensesListScreenState extends ConsumerState<ExpensesListScreen> {
  int? _categoryId;

  Future<void> _addExpense() async {
    final saved = await showAddExpenseDialog(context);
    if (saved == true) {
      ref.invalidate(expenseListProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final filter = (from: null, to: null, categoryId: _categoryId);
    final expensesAsync = ref.watch(expenseListProvider(filter));
    final categoriesAsync = ref.watch(expenseCategoriesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.expensesTitle)),
      floatingActionButton: FloatingActionButton(onPressed: _addExpense, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: categoriesAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (categories) => DropdownButtonFormField<int?>(
                initialValue: _categoryId,
                decoration: InputDecoration(labelText: l10n.category, border: const OutlineInputBorder()),
                items: [
                  DropdownMenuItem<int?>(value: null, child: Text(l10n.allCategories)),
                  ...categories.map((c) => DropdownMenuItem<int?>(value: c.id, child: Text(c.name))),
                ],
                onChanged: (value) => setState(() => _categoryId = value),
              ),
            ),
          ),
          Expanded(
            child: expensesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text(error.toString())),
              data: (expenses) {
                if (expenses.isEmpty) {
                  return Center(child: Text(l10n.noExpensesYet));
                }
                return ListView.builder(
                  itemCount: expenses.length,
                  itemBuilder: (context, index) {
                    final expense = expenses[index];
                    return ListTile(
                      title: Text(expense.description?.isNotEmpty == true ? expense.description! : expense.categoryName),
                      subtitle: Text('${expense.categoryName} · ${expense.expenseDate}'),
                      trailing: Text('${expense.amount} DZD', style: const TextStyle(fontWeight: FontWeight.bold)),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
