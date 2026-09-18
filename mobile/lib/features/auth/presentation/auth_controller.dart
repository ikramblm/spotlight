import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/user.dart';
import '../data/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(apiClient: ref.watch(apiClientProvider));
});

/// `AsyncValue<AuthenticatedUser?>`: loading while restoring/logging in, data(null) when
/// logged out, data(user) when authenticated, error on an unexpected failure. The router
/// (app/router.dart) watches this to decide which shell to show.
class AuthController extends AsyncNotifier<AuthenticatedUser?> {
  @override
  Future<AuthenticatedUser?> build() async {
    final repository = ref.watch(authRepositoryProvider);
    final apiClient = ref.watch(apiClientProvider);
    apiClient.onSessionExpired = () => state = const AsyncData(null);
    return repository.restoreSession();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    final repository = ref.read(authRepositoryProvider);
    state = await AsyncValue.guard(() => repository.login(email, password));
  }

  Future<void> logout() async {
    final repository = ref.read(authRepositoryProvider);
    await repository.logout();
    state = const AsyncData(null);
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, AuthenticatedUser?>(
  AuthController.new,
);
