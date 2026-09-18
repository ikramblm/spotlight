enum RsvpStatus {
  pending,
  accepted,
  declined;

  static RsvpStatus? fromApi(String? value) {
    switch (value) {
      case null:
        return null;
      case 'pending':
        return RsvpStatus.pending;
      case 'accepted':
        return RsvpStatus.accepted;
      case 'declined':
        return RsvpStatus.declined;
      default:
        throw ArgumentError('Unknown RSVP status from API: $value');
    }
  }
}

class Guest {
  final String id;
  final String eventId;
  final String fullName;
  final String? phone;
  final String? email;
  final String? notes;
  final String? invitationId;
  final String? publicToken;
  final DateTime? sentAt;
  final RsvpStatus? rsvpStatus;
  final bool checkedIn;

  const Guest({
    required this.id,
    required this.eventId,
    required this.fullName,
    required this.phone,
    required this.email,
    required this.notes,
    required this.invitationId,
    required this.publicToken,
    required this.sentAt,
    required this.rsvpStatus,
    required this.checkedIn,
  });

  bool get hasInvitation => invitationId != null;

  factory Guest.fromJson(Map<String, dynamic> json) {
    return Guest(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      fullName: json['full_name'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      notes: json['notes'] as String?,
      invitationId: json['invitation_id'] as String?,
      publicToken: json['public_token'] as String?,
      sentAt: json['sent_at'] != null ? DateTime.parse(json['sent_at'] as String) : null,
      rsvpStatus: RsvpStatus.fromApi(json['rsvp_status'] as String?),
      checkedIn: json['checked_in'] as bool? ?? false,
    );
  }
}

class AttendanceStats {
  final int totalGuests;
  final int invited;
  final int rsvpAccepted;
  final int rsvpDeclined;
  final int rsvpPending;
  final int checkedIn;

  const AttendanceStats({
    required this.totalGuests,
    required this.invited,
    required this.rsvpAccepted,
    required this.rsvpDeclined,
    required this.rsvpPending,
    required this.checkedIn,
  });

  factory AttendanceStats.fromJson(Map<String, dynamic> json) {
    int parse(String key) => int.parse(json[key] as String);
    return AttendanceStats(
      totalGuests: parse('total_guests'),
      invited: parse('invited'),
      rsvpAccepted: parse('rsvp_accepted'),
      rsvpDeclined: parse('rsvp_declined'),
      rsvpPending: parse('rsvp_pending'),
      checkedIn: parse('checked_in'),
    );
  }
}
