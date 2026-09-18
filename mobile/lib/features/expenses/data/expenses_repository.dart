import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/expense.dart';

String formatDateOnly(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

class ExpensesRepository {
  ExpensesRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<ExpenseCategory>> listCategories() async {
    try {
      final res = await _dio.get('/expense-categories');
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => ExpenseCategory.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<Expense>> list({DateTime? from, DateTime? to, int? categoryId}) async {
    try {
      final res = await _dio.get(
        '/expenses',
        queryParameters: {
          'pageSize': 200,
          if (from != null) 'from': formatDateOnly(from),
          if (to != null) 'to': formatDateOnly(to),
          'categoryId': ?categoryId,
        },
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => Expense.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Expense> create({
    required int categoryId,
    required double amount,
    required DateTime expenseDate,
    required PaymentMethod paymentMethod,
    String? description,
    String? bookingId,
  }) async {
    try {
      final res = await _dio.post(
        '/expenses',
        data: {
          'categoryId': categoryId,
          'amount': amount,
          'expenseDate': formatDateOnly(expenseDate),
          'paymentMethod': paymentMethod.toApi(),
          if (description != null && description.isNotEmpty) 'description': description,
          'bookingId': ?bookingId,
        },
      );
      return Expense.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<FinancialSummary> getSummary({DateTime? from, DateTime? to}) async {
    try {
      final res = await _dio.get(
        '/expenses/summary',
        queryParameters: {if (from != null) 'from': formatDateOnly(from), if (to != null) 'to': formatDateOnly(to)},
      );
      return FinancialSummary.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<int>> exportSummaryPdf({DateTime? from, DateTime? to}) async {
    try {
      final res = await _dio.get<List<int>>(
        '/expenses/summary/export',
        queryParameters: {if (from != null) 'from': formatDateOnly(from), if (to != null) 'to': formatDateOnly(to)},
        options: Options(responseType: ResponseType.bytes),
      );
      return res.data!;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
