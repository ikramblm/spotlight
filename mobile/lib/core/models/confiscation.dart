enum ItemType {
  phone,
  camera,
  other;

  static ItemType fromApi(String value) {
    switch (value) {
      case 'phone':
        return ItemType.phone;
      case 'camera':
        return ItemType.camera;
      case 'other':
        return ItemType.other;
      default:
        throw ArgumentError('Unknown item type from API: $value');
    }
  }

  String toApi() => name;
}

enum RestitutionStatus {
  holding,
  returned;

  static RestitutionStatus fromApi(String value) {
    switch (value) {
      case 'holding':
        return RestitutionStatus.holding;
      case 'returned':
        return RestitutionStatus.returned;
      default:
        throw ArgumentError('Unknown restitution status from API: $value');
    }
  }
}

class Restitution {
  final String returnedBy;
  final String? returnedToNote;
  final DateTime returnedAt;

  const Restitution({required this.returnedBy, required this.returnedToNote, required this.returnedAt});

  factory Restitution.fromJson(Map<String, dynamic> json) {
    return Restitution(
      returnedBy: json['returned_by'] as String,
      returnedToNote: json['returned_to_note'] as String?,
      returnedAt: DateTime.parse(json['returned_at'] as String).toLocal(),
    );
  }
}

class Confiscation {
  final String id;
  final String guestId;
  final String guestName;
  final String eventId;
  final ItemType itemType;
  final String? itemDescription;
  final bool hasPhoto;
  final String storageReference;
  final String depositedByName;
  final DateTime depositedAt;
  final RestitutionStatus status;
  final Restitution? restitution;

  const Confiscation({
    required this.id,
    required this.guestId,
    required this.guestName,
    required this.eventId,
    required this.itemType,
    required this.itemDescription,
    required this.hasPhoto,
    required this.storageReference,
    required this.depositedByName,
    required this.depositedAt,
    required this.status,
    required this.restitution,
  });

  factory Confiscation.fromJson(Map<String, dynamic> json) {
    return Confiscation(
      id: json['id'] as String,
      guestId: json['guest_id'] as String,
      guestName: json['guest_name'] as String,
      eventId: json['event_id'] as String,
      itemType: ItemType.fromApi(json['item_type'] as String),
      itemDescription: json['item_description'] as String?,
      hasPhoto: json['has_photo'] as bool? ?? false,
      storageReference: json['storage_reference'] as String,
      depositedByName: json['deposited_by_name'] as String,
      depositedAt: DateTime.parse(json['deposited_at'] as String).toLocal(),
      status: RestitutionStatus.fromApi(json['status'] as String),
      restitution: json['restitution'] != null
          ? Restitution.fromJson(json['restitution'] as Map<String, dynamic>)
          : null,
    );
  }
}
