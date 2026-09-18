class AuditLogEntry {
  final String id;
  final String? userName;
  final String action;
  final String? entityType;
  final String? entityId;
  final DateTime createdAt;

  const AuditLogEntry({
    required this.id,
    required this.userName,
    required this.action,
    required this.entityType,
    required this.entityId,
    required this.createdAt,
  });

  factory AuditLogEntry.fromJson(Map<String, dynamic> json) {
    return AuditLogEntry(
      id: json['id'].toString(),
      userName: json['user_name'] as String?,
      action: json['action'] as String,
      entityType: json['entity_type'] as String?,
      entityId: json['entity_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
