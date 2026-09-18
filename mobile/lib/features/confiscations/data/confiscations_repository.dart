import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_config.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/confiscation.dart';

class ConfiscationsRepository {
  ConfiscationsRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<Confiscation>> listForEvent(String eventId) async {
    try {
      final res = await _dio.get('/confiscations', queryParameters: {'eventId': eventId, 'pageSize': 200});
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => Confiscation.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Confiscation> create({
    required String guestId,
    required ItemType itemType,
    String? itemDescription,
    required String storageReference,
    String? photoPath,
  }) async {
    try {
      final form = FormData.fromMap({
        'guestId': guestId,
        'itemType': itemType.toApi(),
        'storageReference': storageReference,
        if (itemDescription != null && itemDescription.isNotEmpty) 'itemDescription': itemDescription,
        if (photoPath != null) 'photo': await MultipartFile.fromFile(photoPath, filename: 'photo.jpg'),
      });
      final res = await _dio.post('/confiscations', data: form);
      return Confiscation.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Confiscation> returnItem(String id, {String? returnedToNote}) async {
    try {
      final res = await _dio.post(
        '/confiscations/$id/return',
        data: {if (returnedToNote != null && returnedToNote.isNotEmpty) 'returnedToNote': returnedToNote},
      );
      return Confiscation.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  String photoUrl(String confiscationId) {
    // Consumed via Image.network with the Authorization header attached by the caller,
    // same pattern as GuestQrScreen's QR image.
    return '$apiBaseUrl/confiscations/$confiscationId/photo';
  }
}
