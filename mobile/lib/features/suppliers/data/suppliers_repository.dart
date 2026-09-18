import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/supplier.dart';

class SuppliersRepository {
  SuppliersRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<List<Supplier>> list({String? query}) async {
    try {
      final res = await _dio.get(
        '/suppliers',
        queryParameters: {'pageSize': 200, if (query != null && query.isNotEmpty) 'q': query},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => Supplier.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Supplier> get(String id) async {
    try {
      final res = await _dio.get('/suppliers/$id');
      return Supplier.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Supplier> create({required String name, String? phone, String? email, List<String> products = const []}) async {
    try {
      final res = await _dio.post(
        '/suppliers',
        data: {
          'name': name,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          if (email != null && email.isNotEmpty) 'email': email,
          'products': products,
        },
      );
      return Supplier.fromJson((res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
