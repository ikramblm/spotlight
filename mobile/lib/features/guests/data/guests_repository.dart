import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/guest.dart';

class GuestsRepository {
  GuestsRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<Guest>> listForEvent(String eventId, {String? query}) async {
    try {
      final res = await _dio.get(
        '/events/$eventId/guests',
        queryParameters: {'pageSize': 200, if (query != null && query.isNotEmpty) 'q': query},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => Guest.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<AttendanceStats> stats(String eventId) async {
    try {
      final res = await _dio.get('/events/$eventId/guests/stats');
      return AttendanceStats.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Guest> addGuest(String eventId, {required String fullName, String? phone, String? email}) async {
    try {
      final res = await _dio.post(
        '/events/$eventId/guests',
        data: {'fullName': fullName, if (phone != null && phone.isNotEmpty) 'phone': phone, if (email != null && email.isNotEmpty) 'email': email},
      );
      return Guest.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Guest> generateInvitation(String guestId) async {
    try {
      await _dio.post('/invitations/guest/$guestId');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
    return getGuest(guestId);
  }

  Future<Guest> sendInvitation(String invitationId, String guestId) async {
    try {
      await _dio.post('/invitations/$invitationId/send');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
    return getGuest(guestId);
  }

  Future<Guest> getGuest(String guestId) async {
    try {
      final res = await _dio.get('/guests/$guestId');
      return Guest.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<int>> exportCsv(String eventId) async {
    try {
      final res = await _dio.get<List<int>>(
        '/events/$eventId/guests/export',
        options: Options(responseType: ResponseType.bytes),
      );
      return res.data!;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
