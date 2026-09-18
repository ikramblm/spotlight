enum AccessResult {
  granted,
  override,
  deniedWrongEvent,
  deniedNoRsvp;

  static AccessResult fromApi(String value) {
    switch (value) {
      case 'granted':
        return AccessResult.granted;
      case 'override':
        return AccessResult.override;
      case 'denied_wrong_event':
        return AccessResult.deniedWrongEvent;
      case 'denied_no_rsvp':
        return AccessResult.deniedNoRsvp;
      default:
        throw ArgumentError('Unknown access result from API: $value');
    }
  }

  bool get isGranted => this == AccessResult.granted || this == AccessResult.override;
}

class CheckinOutcome {
  final String guestName;
  final AccessResult accessResult;
  final DateTime checkedInAt;

  const CheckinOutcome({required this.guestName, required this.accessResult, required this.checkedInAt});

  factory CheckinOutcome.fromJson(Map<String, dynamic> json) {
    return CheckinOutcome(
      guestName: json['guestName'] as String,
      accessResult: AccessResult.fromApi(json['accessResult'] as String),
      checkedInAt: DateTime.parse(json['checkedInAt'] as String).toLocal(),
    );
  }
}
