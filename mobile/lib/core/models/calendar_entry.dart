enum BookingStatus {
  confirmed,
  completed,
  canceled;

  static BookingStatus fromApi(String value) {
    switch (value) {
      case 'confirmed':
        return BookingStatus.confirmed;
      case 'completed':
        return BookingStatus.completed;
      case 'canceled':
        return BookingStatus.canceled;
      default:
        throw ArgumentError('Unknown booking status from API: $value');
    }
  }
}

class CalendarEntry {
  final String bookingId;
  final String eventId;
  final String hallId;
  final String hallName;
  final String customerId;
  final String customerName;
  final String eventType;
  final DateTime eventDate;
  final DateTime startTime;
  final DateTime endTime;
  final BookingStatus status;
  final int? guestCount;
  final String totalAmount;
  final String remainingBalance;

  const CalendarEntry({
    required this.bookingId,
    required this.eventId,
    required this.hallId,
    required this.hallName,
    required this.customerId,
    required this.customerName,
    required this.eventType,
    required this.eventDate,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.guestCount,
    required this.totalAmount,
    required this.remainingBalance,
  });

  factory CalendarEntry.fromJson(Map<String, dynamic> json) {
    return CalendarEntry(
      bookingId: json['booking_id'] as String,
      eventId: json['event_id'] as String,
      hallId: json['hall_id'] as String,
      hallName: json['hall_name'] as String,
      customerId: json['customer_id'] as String,
      customerName: json['customer_name'] as String,
      eventType: json['event_type'] as String,
      eventDate: DateTime.parse(json['event_date'] as String),
      startTime: DateTime.parse(json['start_time'] as String).toLocal(),
      endTime: DateTime.parse(json['end_time'] as String).toLocal(),
      status: BookingStatus.fromApi(json['status'] as String),
      guestCount: json['guest_count'] as int?,
      totalAmount: json['total_amount'] as String,
      remainingBalance: json['remaining_balance'] as String,
    );
  }
}
