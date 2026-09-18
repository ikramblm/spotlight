class AssignedBooking {
  final String bookingId;
  final String eventType;
  final String eventDate;
  final String customerName;

  const AssignedBooking({
    required this.bookingId,
    required this.eventType,
    required this.eventDate,
    required this.customerName,
  });

  factory AssignedBooking.fromJson(Map<String, dynamic> json) {
    return AssignedBooking(
      bookingId: json['booking_id'] as String,
      eventType: json['event_type'] as String,
      eventDate: json['event_date'] as String,
      customerName: json['customer_name'] as String,
    );
  }
}

class Caterer {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final List<String> services;
  final String? notes;
  final String status;
  final List<AssignedBooking> assignedBookings;

  const Caterer({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.services,
    required this.notes,
    required this.status,
    required this.assignedBookings,
  });

  factory Caterer.fromJson(Map<String, dynamic> json) {
    return Caterer(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      services: (json['services'] as List<dynamic>? ?? const []).map((e) => e as String).toList(),
      notes: json['notes'] as String?,
      status: json['status'] as String? ?? 'active',
      assignedBookings: (json['assignedBookings'] as List<dynamic>? ?? const [])
          .map((e) => AssignedBooking.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
