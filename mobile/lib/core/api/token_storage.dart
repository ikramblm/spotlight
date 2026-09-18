import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Refresh tokens are the long-lived credential, so they belong in the platform
/// keychain/keystore (via flutter_secure_storage), never SharedPreferences or a plain file.
/// The access token is short-lived (15 min) and kept in memory only - see AuthController.
class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _refreshTokenKey = 'spotlight_refresh_token';

  Future<void> saveRefreshToken(String token) => _storage.write(key: _refreshTokenKey, value: token);

  Future<String?> readRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> clear() => _storage.delete(key: _refreshTokenKey);
}
