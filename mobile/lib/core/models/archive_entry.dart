class ArchiveEntry {
  final String id;
  final String entityType;
  final String entityId;
  final String? reason;
  final String archivedByName;
  final DateTime archivedAt;

  const ArchiveEntry({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.reason,
    required this.archivedByName,
    required this.archivedAt,
  });

  factory ArchiveEntry.fromJson(Map<String, dynamic> json) {
    return ArchiveEntry(
      id: json['id'] as String,
      entityType: json['entity_type'] as String,
      entityId: json['entity_id'] as String,
      reason: json['reason'] as String?,
      archivedByName: json['archived_by_name'] as String,
      archivedAt: DateTime.parse(json['archived_at'] as String),
    );
  }
}
