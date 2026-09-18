class SupplierExpense {
  final String id;
  final String amount;
  final String expenseDate;
  final String categoryName;
  final String? description;

  const SupplierExpense({
    required this.id,
    required this.amount,
    required this.expenseDate,
    required this.categoryName,
    required this.description,
  });

  factory SupplierExpense.fromJson(Map<String, dynamic> json) {
    return SupplierExpense(
      id: json['id'] as String,
      amount: json['amount'] as String,
      expenseDate: json['expense_date'] as String,
      categoryName: json['category_name'] as String,
      description: json['description'] as String?,
    );
  }
}

class SupplierEquipmentSummary {
  final String id;
  final String name;
  final String category;
  final int quantityTotal;
  final int quantityAvailable;

  const SupplierEquipmentSummary({
    required this.id,
    required this.name,
    required this.category,
    required this.quantityTotal,
    required this.quantityAvailable,
  });

  factory SupplierEquipmentSummary.fromJson(Map<String, dynamic> json) {
    return SupplierEquipmentSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      quantityTotal: json['quantity_total'] as int,
      quantityAvailable: json['quantity_available'] as int,
    );
  }
}

class Supplier {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final List<String> products;
  final String? notes;
  final String status;
  final List<SupplierExpense> purchaseHistory;
  final List<SupplierEquipmentSummary> equipment;

  const Supplier({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.products,
    required this.notes,
    required this.status,
    required this.purchaseHistory,
    required this.equipment,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      products: (json['products'] as List<dynamic>? ?? const []).map((e) => e as String).toList(),
      notes: json['notes'] as String?,
      status: json['status'] as String? ?? 'active',
      purchaseHistory: (json['purchaseHistory'] as List<dynamic>? ?? const [])
          .map((e) => SupplierExpense.fromJson(e as Map<String, dynamic>))
          .toList(),
      equipment: (json['equipment'] as List<dynamic>? ?? const [])
          .map((e) => SupplierEquipmentSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
