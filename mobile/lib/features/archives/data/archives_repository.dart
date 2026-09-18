import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/archive_entry.dart';

class ArchivesRepository {
  ArchivesRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<ArchiveEntry>> list({String? entityType}) async {
    try {
      final res = await _dio.get(
        '/archives',
        queryParameters: {'pageSize': 200, if (entityType != null && entityType.isNotEmpty) 'entityType': entityType},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => ArchiveEntry.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
