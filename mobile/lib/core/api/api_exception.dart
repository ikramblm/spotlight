import 'package:dio/dio.dart';

/// Normalizes the backend's `{ error: { code, message, fields? } }` envelope into
/// something feature code can show directly, instead of every screen parsing Dio errors.
class ApiException implements Exception {
  final int? statusCode;
  final String code;
  final String message;
  final Map<String, String>? fields;

  ApiException({required this.statusCode, required this.code, required this.message, this.fields});

  factory ApiException.fromDioError(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic> && data['error'] is Map<String, dynamic>) {
      final err = data['error'] as Map<String, dynamic>;
      final fieldsRaw = err['fields'];
      return ApiException(
        statusCode: error.response?.statusCode,
        code: err['code'] as String? ?? 'unknown_error',
        message: err['message'] as String? ?? 'Something went wrong',
        fields: fieldsRaw is Map<String, dynamic>
            ? fieldsRaw.map((key, value) => MapEntry(key, value.toString()))
            : null,
      );
    }

    return ApiException(
      statusCode: error.response?.statusCode,
      code: 'network_error',
      message: error.type == DioExceptionType.connectionError || error.type == DioExceptionType.connectionTimeout
          ? 'Could not reach the server. Check your connection and try again.'
          : 'Something went wrong',
    );
  }

  @override
  String toString() => message;
}
