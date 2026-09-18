import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/checkin_outcome.dart';

class CheckinRepository {
  CheckinRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<CheckinOutcome> scan(String token) => _post('/checkin/scan', {'token': token});

  Future<CheckinOutcome> override(String token) => _post('/checkin/override', {'token': token});

  Future<CheckinOutcome> checkInByGuestId(String guestId) => _post('/checkin/guest/$guestId', null);

  Future<CheckinOutcome> _post(String path, Map<String, dynamic>? data) async {
    try {
      final res = await _dio.post(path, data: data);
      return CheckinOutcome.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
