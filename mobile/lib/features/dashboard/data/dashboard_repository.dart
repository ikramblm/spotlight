import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/dashboard_summary.dart';

class DashboardRepository {
  DashboardRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<DashboardSummary> getSummary() async {
    try {
      final res = await _dio.get('/dashboard');
      return DashboardSummary.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
