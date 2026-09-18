import 'dart:typed_data';
import 'package:share_plus/share_plus.dart';

/// Hands exported report bytes (CSV/PDF) to the platform share sheet - or, on web, a browser
/// download - without ever writing a temp file to disk ourselves.
Future<void> shareExportedFile({
  required List<int> bytes,
  required String fileName,
  required String mimeType,
}) async {
  final file = XFile.fromData(Uint8List.fromList(bytes), name: fileName, mimeType: mimeType);
  await SharePlus.instance.share(ShareParams(files: [file]));
}
