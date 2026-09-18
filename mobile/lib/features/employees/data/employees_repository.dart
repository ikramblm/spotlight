import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/payroll.dart';

String formatDateOnly(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

class EmployeesRepository {
  EmployeesRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<Employee>> list({String? query}) async {
    try {
      final res = await _dio.get(
        '/employees',
        queryParameters: {'pageSize': 200, if (query != null && query.isNotEmpty) 'q': query},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => Employee.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Employee> create({
    required String fullName,
    String? phone,
    required String position,
    required double baseSalary,
    required DateTime startDate,
    String? notes,
  }) async {
    try {
      final res = await _dio.post(
        '/employees',
        data: {
          'fullName': fullName,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          'position': position,
          'baseSalary': baseSalary,
          'startDate': formatDateOnly(startDate),
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );
      return Employee.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Employee> updateEmploymentStatus(String id, EmploymentStatus status) async {
    try {
      final res = await _dio.patch('/employees/$id', data: {'employmentStatus': status.toApi()});
      return Employee.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<PayrollRun>> payrollHistory(String employeeId) async {
    try {
      final res = await _dio.get('/employees/$employeeId/payroll', queryParameters: {'pageSize': 100});
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => PayrollRun.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<PayrollRun> runPayroll({
    required String employeeId,
    required DateTime periodStart,
    required DateTime periodEnd,
    double? baseSalary,
    double bonuses = 0,
    double deductions = 0,
  }) async {
    try {
      final res = await _dio.post(
        '/payroll',
        data: {
          'employeeId': employeeId,
          'periodStart': formatDateOnly(periodStart),
          'periodEnd': formatDateOnly(periodEnd),
          'baseSalary': ?baseSalary,
          'bonuses': bonuses,
          'deductions': deductions,
        },
      );
      return PayrollRun.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<PayrollRun> markPaid(String payrollId) async {
    try {
      final res = await _dio.post('/payroll/$payrollId/pay');
      return PayrollRun.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
