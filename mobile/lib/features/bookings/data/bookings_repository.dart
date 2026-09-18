import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/booking_detail.dart';

class BookingsRepository {
  BookingsRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<BookingDetail> fetchById(String id) async {
    try {
      final res = await _dio.get('/bookings/$id');
      return BookingDetail.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
