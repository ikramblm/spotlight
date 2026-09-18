import '../../../core/api/api_client.dart';
import '../../../core/api/auth_api.dart';
import '../../../core/api/token_storage.dart';
import '../../../core/models/user.dart';

class AuthRepository {
  AuthRepository({required this.apiClient, AuthApi? authApi, TokenStorage? tokenStorage})
      : _authApi = authApi ?? AuthApi(),
        _tokenStorage = tokenStorage ?? TokenStorage();

  final ApiClient apiClient;
  final AuthApi _authApi;
  final TokenStorage _tokenStorage;

  Future<AuthenticatedUser> login(String email, String password) async {
    final response = await _authApi.login(email: email, password: password);
    apiClient.setAccessToken(response.accessToken);
    await _tokenStorage.saveRefreshToken(response.refreshToken);
    return AuthenticatedUser.fromJson(response.user);
  }

  /// Called on app startup: if a refresh token is stored, exchange it for a fresh
  /// access token so the user doesn't have to log in again every launch.
  Future<AuthenticatedUser?> restoreSession() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null) return null;

    try {
      final response = await _authApi.refresh(refreshToken);
      apiClient.setAccessToken(response.accessToken);
      await _tokenStorage.saveRefreshToken(response.refreshToken);
      return AuthenticatedUser.fromJson(response.user);
    } catch (_) {
      await _tokenStorage.clear();
      return null;
    }
  }

  Future<void> logout() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    apiClient.clearAccessToken();
    await _tokenStorage.clear();
    if (refreshToken != null) {
      // Best-effort: the local session is already cleared either way.
      try {
        await _authApi.logout(refreshToken);
      } catch (_) {}
    }
  }

  Future<void> requestPasswordReset(String email) => _authApi.requestPasswordReset(email);

  Future<void> confirmPasswordReset({required String token, required String newPassword}) =>
      _authApi.confirmPasswordReset(token: token, newPassword: newPassword);
}
