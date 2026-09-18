import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

/// One ApiClient (and its underlying Dio) for the whole app lifetime, shared by every
/// feature's repository provider.
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
