import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/audit_log_entry.dart';

class AuditLogsRepository {
  AuditLogsRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<AuditLogEntry>> list({String? action}) async {
    try {
      final res = await _dio.get(
        '/audit-logs',
        queryParameters: {'pageSize': 200, if (action != null && action.isNotEmpty) 'action': action},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => AuditLogEntry.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
