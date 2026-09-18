import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/caterer.dart';

class CaterersRepository {
  CaterersRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<Caterer>> list({String? query}) async {
    try {
      final res = await _dio.get(
        '/caterers',
        queryParameters: {'pageSize': 200, if (query != null && query.isNotEmpty) 'q': query},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => Caterer.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Caterer> get(String id) async {
    try {
      final res = await _dio.get('/caterers/$id');
      return Caterer.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Caterer> create({required String name, String? phone, String? email, List<String> services = const []}) async {
    try {
      final res = await _dio.post(
        '/caterers',
        data: {
          'name': name,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          if (email != null && email.isNotEmpty) 'email': email,
          'services': services,
        },
      );
      return Caterer.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
