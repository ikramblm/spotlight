import 'calendar_entry.dart';

enum PaymentStatus {
  unpaid,
  partial,
  paid;

  static PaymentStatus fromApi(String value) {
    switch (value) {
      case 'unpaid':
        return PaymentStatus.unpaid;
      case 'partial':
        return PaymentStatus.partial;
      case 'paid':
        return PaymentStatus.paid;
      default:
        throw ArgumentError('Unknown payment status from API: $value');
    }
  }
}

class BookingServiceLine {
  final String serviceId;
  final int quantity;
  final String unitPrice;

  const BookingServiceLine({required this.serviceId, required this.quantity, required this.unitPrice});

  factory BookingServiceLine.fromJson(Map<String, dynamic> json) {
    return BookingServiceLine(
      serviceId: json['service_id'] as String,
      quantity: json['quantity'] as int,
      unitPrice: json['unit_price'] as String,
    );
  }
}

class BookingDetail {
  final String id;
  final String? eventId;
  final String customerId;
  final String hallId;
  final String eventType;
  final DateTime startTime;
  final DateTime endTime;
  final int? guestCount;
  final String totalAmount;
  final String advancePayment;
  final String remainingBalance;
  final PaymentStatus paymentStatus;
  final BookingStatus status;
  final String? notes;
  final List<BookingServiceLine> services;

  const BookingDetail({
    required this.id,
    required this.eventId,
    required this.customerId,
    required this.hallId,
    required this.eventType,
    required this.startTime,
    required this.endTime,
    required this.guestCount,
    required this.totalAmount,
    required this.advancePayment,
    required this.remainingBalance,
    required this.paymentStatus,
    required this.status,
    required this.notes,
    required this.services,
  });

  factory BookingDetail.fromJson(Map<String, dynamic> json) {
    return BookingDetail(
      id: json['id'] as String,
      eventId: json['eventId'] as String?,
      customerId: json['customer_id'] as String,
      hallId: json['hall_id'] as String,
      eventType: json['event_type'] as String,
      startTime: DateTime.parse(json['start_time'] as String).toLocal(),
      endTime: DateTime.parse(json['end_time'] as String).toLocal(),
      guestCount: json['guest_count'] as int?,
      totalAmount: json['total_amount'] as String,
      advancePayment: json['advance_payment'] as String,
      remainingBalance: json['remaining_balance'] as String,
      paymentStatus: PaymentStatus.fromApi(json['payment_status'] as String),
      status: BookingStatus.fromApi(json['status'] as String),
      notes: json['notes'] as String?,
      services: (json['services'] as List<dynamic>? ?? const [])
          .map((e) => BookingServiceLine.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
