enum EquipmentCondition {
  good,
  needsRepair,
  retired;

  static EquipmentCondition fromApi(String value) {
    switch (value) {
      case 'good':
        return EquipmentCondition.good;
      case 'needs_repair':
        return EquipmentCondition.needsRepair;
      case 'retired':
        return EquipmentCondition.retired;
      default:
        throw ArgumentError('Unknown equipment condition from API: $value');
    }
  }
}

class EquipmentAssignment {
  final String id;
  final String bookingId;
  final String eventType;
  final String eventDate;
  final int quantity;
  final String? returnedAt;

  const EquipmentAssignment({
    required this.id,
    required this.bookingId,
    required this.eventType,
    required this.eventDate,
    required this.quantity,
    required this.returnedAt,
  });

  bool get isReturned => returnedAt != null;

  factory EquipmentAssignment.fromJson(Map<String, dynamic> json) {
    return EquipmentAssignment(
      id: json['id'] as String,
      bookingId: json['booking_id'] as String,
      eventType: json['event_type'] as String,
      eventDate: json['event_date'] as String,
      quantity: json['quantity'] as int,
      returnedAt: json['returned_at'] as String?,
    );
  }
}

class Equipment {
  final String id;
  final String name;
  final String category;
  final int quantityTotal;
  final int quantityAvailable;
  final EquipmentCondition condition;
  final String? location;
  final String? supplierId;
  final String? notes;
  final String status;
  final List<EquipmentAssignment> assignments;

  const Equipment({
    required this.id,
    required this.name,
    required this.category,
    required this.quantityTotal,
    required this.quantityAvailable,
    required this.condition,
    required this.location,
    required this.supplierId,
    required this.notes,
    required this.status,
    required this.assignments,
  });

  factory Equipment.fromJson(Map<String, dynamic> json) {
    return Equipment(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      quantityTotal: json['quantity_total'] as int,
      quantityAvailable: json['quantity_available'] as int,
      condition: EquipmentCondition.fromApi(json['condition'] as String),
      location: json['location'] as String?,
      supplierId: json['supplier_id'] as String?,
      notes: json['notes'] as String?,
      status: json['status'] as String? ?? 'active',
      assignments: (json['assignments'] as List<dynamic>? ?? const [])
          .map((e) => EquipmentAssignment.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
