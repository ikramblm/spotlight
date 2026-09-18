enum PayrollPaymentStatus {
  unpaid,
  partial,
  paid;

  static PayrollPaymentStatus fromApi(String value) {
    switch (value) {
      case 'unpaid':
        return PayrollPaymentStatus.unpaid;
      case 'partial':
        return PayrollPaymentStatus.partial;
      case 'paid':
        return PayrollPaymentStatus.paid;
      default:
        throw ArgumentError('Unknown payroll payment status from API: $value');
    }
  }
}

class PayrollRun {
  final String id;
  final String employeeId;
  final String employeeName;
  final String periodStart;
  final String periodEnd;
  final String baseSalary;
  final String bonuses;
  final String deductions;
  final String netPay;
  final String? paymentDate;
  final PayrollPaymentStatus paymentStatus;

  const PayrollRun({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.periodStart,
    required this.periodEnd,
    required this.baseSalary,
    required this.bonuses,
    required this.deductions,
    required this.netPay,
    required this.paymentDate,
    required this.paymentStatus,
  });

  factory PayrollRun.fromJson(Map<String, dynamic> json) {
    return PayrollRun(
      id: json['id'] as String,
      employeeId: json['employee_id'] as String,
      employeeName: json['employee_name'] as String,
      periodStart: json['period_start'] as String,
      periodEnd: json['period_end'] as String,
      baseSalary: json['base_salary'] as String,
      bonuses: json['bonuses'] as String,
      deductions: json['deductions'] as String,
      netPay: json['net_pay'] as String,
      paymentDate: json['payment_date'] as String?,
      paymentStatus: PayrollPaymentStatus.fromApi(json['payment_status'] as String),
    );
  }
}
