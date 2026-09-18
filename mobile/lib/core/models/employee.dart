enum EmploymentStatus {
  active,
  onLeave,
  terminated;

  static EmploymentStatus fromApi(String value) {
    switch (value) {
      case 'active':
        return EmploymentStatus.active;
      case 'on_leave':
        return EmploymentStatus.onLeave;
      case 'terminated':
        return EmploymentStatus.terminated;
      default:
        throw ArgumentError('Unknown employment status from API: $value');
    }
  }

  String toApi() {
    switch (this) {
      case EmploymentStatus.active:
        return 'active';
      case EmploymentStatus.onLeave:
        return 'on_leave';
      case EmploymentStatus.terminated:
        return 'terminated';
    }
  }
}

class Employee {
  final String id;
  final String? userId;
  final String fullName;
  final String? phone;
  final String position;
  final String baseSalary;
  final EmploymentStatus employmentStatus;
  final String startDate;
  final String? notes;
  final String status;

  const Employee({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.phone,
    required this.position,
    required this.baseSalary,
    required this.employmentStatus,
    required this.startDate,
    required this.notes,
    required this.status,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] as String,
      userId: json['user_id'] as String?,
      fullName: json['full_name'] as String,
      phone: json['phone'] as String?,
      position: json['position'] as String,
      baseSalary: json['base_salary'] as String,
      employmentStatus: EmploymentStatus.fromApi(json['employment_status'] as String),
      startDate: json['start_date'] as String,
      notes: json['notes'] as String?,
      status: json['status'] as String,
    );
  }
}
