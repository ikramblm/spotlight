/// API base URL. Override at build/run time with:
///   flutter run --dart-define=API_BASE_URL=https://api.spotlight.example.com/api/v1
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:4000/api/v1',
);
