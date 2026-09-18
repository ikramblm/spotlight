import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/payroll.dart';
import '../data/employees_repository.dart';

final employeesRepositoryProvider = Provider<EmployeesRepository>((ref) {
  return EmployeesRepository(apiClient: ref.watch(apiClientProvider));
});

final employeeListProvider = FutureProvider<List<Employee>>((ref) async {
  return ref.watch(employeesRepositoryProvider).list();
});

final payrollHistoryProvider = FutureProvider.family<List<PayrollRun>, String>((ref, employeeId) async {
  return ref.watch(employeesRepositoryProvider).payrollHistory(employeeId);
});
