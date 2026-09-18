import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/equipment.dart';

class EquipmentRepository {
  EquipmentRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<Equipment>> list({String? query}) async {
    try {
      final res = await _dio.get(
        '/equipment',
        queryParameters: {'pageSize': 200, if (query != null && query.isNotEmpty) 'q': query},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => Equipment.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Equipment> get(String id) async {
    try {
      final res = await _dio.get('/equipment/$id');
      return Equipment.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Equipment> create({required String name, required String category, required int quantityTotal, String? location}) async {
    try {
      final res = await _dio.post(
        '/equipment',
        data: {
          'name': name,
          'category': category,
          'quantityTotal': quantityTotal,
          if (location != null && location.isNotEmpty) 'location': location,
        },
      );
      return Equipment.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> assign({required String equipmentId, required String bookingId, required int quantity}) async {
    try {
      await _dio.post('/equipment/$equipmentId/assignments', data: {'bookingId': bookingId, 'quantity': quantity});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> returnAssignment(String assignmentId) async {
    try {
      await _dio.post('/equipment/assignments/$assignmentId/return');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
