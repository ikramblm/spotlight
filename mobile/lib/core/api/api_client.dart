import 'package:dio/dio.dart';
import 'api_config.dart';
import 'auth_api.dart';
import 'token_storage.dart';

/// The Dio instance every feature repository is built on. Attaches the access token to
/// every request and transparently refreshes + retries once on a 401, so feature code
/// never has to think about token expiry (architecture doc §7).
class ApiClient {
  ApiClient({AuthApi? authApi, TokenStorage? tokenStorage})
      : _authApi = authApi ?? AuthApi(),
        _tokenStorage = tokenStorage ?? TokenStorage(),
        dio = Dio(BaseOptions(baseUrl: apiBaseUrl, connectTimeout: const Duration(seconds: 15))) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_accessToken != null) {
            options.headers['Authorization'] = 'Bearer $_accessToken';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final isUnauthorized = error.response?.statusCode == 401;
          final alreadyRetried = error.requestOptions.extra['retried'] == true;

          if (!isUnauthorized || alreadyRetried) {
            return handler.next(error);
          }

          final refreshed = await _tryRefresh();
          if (!refreshed) {
            onSessionExpired?.call();
            return handler.next(error);
          }

          final retryOptions = error.requestOptions;
          retryOptions.extra['retried'] = true;
          retryOptions.headers['Authorization'] = 'Bearer $_accessToken';
          try {
            final response = await dio.fetch(retryOptions);
            return handler.resolve(response);
          } on DioException catch (retryError) {
            return handler.next(retryError);
          }
        },
      ),
    );
  }

  final Dio dio;
  final AuthApi _authApi;
  final TokenStorage _tokenStorage;

  String? _accessToken;

  /// Called when a refresh attempt fails outright (refresh token expired/revoked) -
  /// the app should treat this as a logout and return to the login screen.
  void Function()? onSessionExpired;

  void setAccessToken(String token) => _accessToken = token;

  void clearAccessToken() => _accessToken = null;

  /// For requests outside Dio (e.g. `Image.network`'s own header map) that still need to
  /// carry the current access token, such as fetching a QR code PNG.
  String? get accessToken => _accessToken;

  Future<bool> _tryRefresh() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null) return false;

    try {
      final response = await _authApi.refresh(refreshToken);
      _accessToken = response.accessToken;
      await _tokenStorage.saveRefreshToken(response.refreshToken);
      return true;
    } catch (_) {
      await _tokenStorage.clear();
      _accessToken = null;
      return false;
    }
  }
}
