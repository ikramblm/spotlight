import 'package:dio/dio.dart';
import 'api_config.dart';
import 'api_exception.dart';

/// Login result on the wire: the raw tokens plus the user payload from /auth/login,
/// /auth/refresh or /auth/me.
class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final Map<String, dynamic> user;

  AuthResponse({required this.accessToken, required this.refreshToken, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return AuthResponse(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      user: data['user'] as Map<String, dynamic>,
    );
  }
}

/// Talks to the auth endpoints on a bare Dio instance with no auth interceptor attached -
/// deliberately separate from [ApiClient] so token refresh never recurses back into itself.
class AuthApi {
  AuthApi({Dio? dio}) : _dio = dio ?? Dio(BaseOptions(baseUrl: apiBaseUrl));

  final Dio _dio;

  Future<AuthResponse> login({required String email, required String password}) async {
    try {
      final res = await _dio.post('/auth/login', data: {'email': email, 'password': password});
      return AuthResponse.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<AuthResponse> refresh(String refreshToken) async {
    try {
      final res = await _dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
      return AuthResponse.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> logout(String refreshToken) async {
    try {
      await _dio.post('/auth/logout', data: {'refreshToken': refreshToken});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> requestPasswordReset(String email) async {
    try {
      await _dio.post('/auth/password-reset/request', data: {'email': email});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> confirmPasswordReset({required String token, required String newPassword}) async {
    try {
      await _dio.post('/auth/password-reset/confirm', data: {'token': token, 'newPassword': newPassword});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
