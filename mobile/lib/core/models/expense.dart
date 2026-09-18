enum PaymentMethod {
  cash,
  bankTransfer,
  card,
  check;

  static PaymentMethod fromApi(String value) {
    switch (value) {
      case 'cash':
        return PaymentMethod.cash;
      case 'bank_transfer':
        return PaymentMethod.bankTransfer;
      case 'card':
        return PaymentMethod.card;
      case 'check':
        return PaymentMethod.check;
      default:
        throw ArgumentError('Unknown payment method from API: $value');
    }
  }

  String toApi() {
    switch (this) {
      case PaymentMethod.cash:
        return 'cash';
      case PaymentMethod.bankTransfer:
        return 'bank_transfer';
      case PaymentMethod.card:
        return 'card';
      case PaymentMethod.check:
        return 'check';
    }
  }
}

class ExpenseCategory {
  final int id;
  final String name;

  const ExpenseCategory({required this.id, required this.name});

  factory ExpenseCategory.fromJson(Map<String, dynamic> json) {
    return ExpenseCategory(id: json['id'] as int, name: json['name'] as String);
  }
}

class Expense {
  final String id;
  final int categoryId;
  final String categoryName;
  final String? bookingId;
  final String amount;
  final String expenseDate;
  final PaymentMethod paymentMethod;
  final String? description;
  final String createdByName;

  const Expense({
    required this.id,
    required this.categoryId,
    required this.categoryName,
    required this.bookingId,
    required this.amount,
    required this.expenseDate,
    required this.paymentMethod,
    required this.description,
    required this.createdByName,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'] as String,
      categoryId: json['category_id'] as int,
      categoryName: json['category_name'] as String,
      bookingId: json['booking_id'] as String?,
      amount: json['amount'] as String,
      expenseDate: json['expense_date'] as String,
      paymentMethod: PaymentMethod.fromApi(json['payment_method'] as String),
      description: json['description'] as String?,
      createdByName: json['created_by_name'] as String,
    );
  }
}

class CategoryBreakdown {
  final int categoryId;
  final String categoryName;
  final String total;

  const CategoryBreakdown({required this.categoryId, required this.categoryName, required this.total});

  factory CategoryBreakdown.fromJson(Map<String, dynamic> json) {
    return CategoryBreakdown(
      categoryId: json['category_id'] as int,
      categoryName: json['category_name'] as String,
      total: json['total'] as String,
    );
  }
}

class FinancialSummary {
  final String revenue;
  final String expenses;
  final String paymentsReceived;
  final String outstandingBalance;
  final List<CategoryBreakdown> expensesByCategory;

  const FinancialSummary({
    required this.revenue,
    required this.expenses,
    required this.paymentsReceived,
    required this.outstandingBalance,
    required this.expensesByCategory,
  });

  factory FinancialSummary.fromJson(Map<String, dynamic> json) {
    return FinancialSummary(
      revenue: json['revenue'] as String,
      expenses: json['expenses'] as String,
      paymentsReceived: json['payments_received'] as String,
      outstandingBalance: json['outstanding_balance'] as String,
      expensesByCategory: (json['expenses_by_category'] as List<dynamic>? ?? const [])
          .map((e) => CategoryBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
