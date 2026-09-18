import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/expense.dart';
import '../data/expenses_repository.dart';

final expensesRepositoryProvider = Provider<ExpensesRepository>((ref) {
  return ExpensesRepository(apiClient: ref.watch(apiClientProvider));
});

final expenseCategoriesProvider = FutureProvider<List<ExpenseCategory>>((ref) async {
  return ref.watch(expensesRepositoryProvider).listCategories();
});

typedef ExpenseFilter = ({DateTime? from, DateTime? to, int? categoryId});

final expenseListProvider = FutureProvider.family<List<Expense>, ExpenseFilter>((ref, filter) async {
  final repository = ref.watch(expensesRepositoryProvider);
  return repository.list(from: filter.from, to: filter.to, categoryId: filter.categoryId);
});

typedef SummaryFilter = ({DateTime? from, DateTime? to});

final financialSummaryProvider = FutureProvider.family<FinancialSummary, SummaryFilter>((ref, filter) async {
  final repository = ref.watch(expensesRepositoryProvider);
  return repository.getSummary(from: filter.from, to: filter.to);
});
