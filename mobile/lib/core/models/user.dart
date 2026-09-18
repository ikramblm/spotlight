enum UserRole {
  businessOwner,
  operationsManager,
  eventCoordinator,
  securityStaff;

  static UserRole fromApi(String value) {
    switch (value) {
      case 'business_owner':
        return UserRole.businessOwner;
      case 'operations_manager':
        return UserRole.operationsManager;
      case 'event_coordinator':
        return UserRole.eventCoordinator;
      case 'security_staff':
        return UserRole.securityStaff;
      default:
        throw ArgumentError('Unknown role from API: $value');
    }
  }
}

class AuthenticatedUser {
  final String id;
  final String email;
  final UserRole role;
  final List<String> permissions;

  const AuthenticatedUser({
    required this.id,
    required this.email,
    required this.role,
    required this.permissions,
  });

  bool hasPermission(String code) => permissions.contains(code);

  factory AuthenticatedUser.fromJson(Map<String, dynamic> json) {
    return AuthenticatedUser(
      id: json['id'] as String,
      email: json['email'] as String,
      role: UserRole.fromApi(json['role'] as String),
      permissions: (json['permissions'] as List<dynamic>? ?? const [])
          .map((e) => e as String)
          .toList(),
    );
  }
}
