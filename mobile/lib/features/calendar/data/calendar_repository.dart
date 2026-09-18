import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/calendar_entry.dart';

class CalendarRepository {
  CalendarRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<CalendarEntry>> fetchRange({required DateTime from, required DateTime to, String? hallId}) async {
    try {
      final res = await _dio.get(
        '/calendar',
        queryParameters: {
          'from': from.toUtc().toIso8601String(),
          'to': to.toUtc().toIso8601String(),
          if (hallId != null) 'hallId': hallId,
        },
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => CalendarEntry.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<CalendarEntry>> fetchToday({String? hallId}) async {
    try {
      final res = await _dio.get('/calendar/today', queryParameters: {if (hallId != null) 'hallId': hallId});
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => CalendarEntry.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
