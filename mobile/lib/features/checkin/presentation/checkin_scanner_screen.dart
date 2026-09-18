import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/checkin_outcome.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/presentation/auth_controller.dart';
import 'checkin_controller.dart';
import 'checkin_result_banner.dart';

/// Security Staff's primary screen (spec §24: "especially simple mobile check-in interface").
/// One camera preview, one result banner, one action at a time - manual entry underneath for
/// when a badge won't scan (or, in this sandbox, for testing without a camera at all).
class CheckinScannerScreen extends ConsumerStatefulWidget {
  const CheckinScannerScreen({super.key});

  @override
  ConsumerState<CheckinScannerScreen> createState() => _CheckinScannerScreenState();
}

class _CheckinScannerScreenState extends ConsumerState<CheckinScannerScreen> {
  final _controller = MobileScannerController();
  final _manualController = TextEditingController();

  CheckinOutcome? _outcome;
  String? _errorMessage;
  bool _lastErrorWasDuplicate = false;
  String? _lastToken;
  bool _isProcessing = false;

  @override
  void dispose() {
    _controller.dispose();
    _manualController.dispose();
    super.dispose();
  }

  void _reset() {
    setState(() {
      _outcome = null;
      _errorMessage = null;
      _lastErrorWasDuplicate = false;
      _lastToken = null;
    });
  }

  Future<void> _submit(String token, {bool asOverride = false}) async {
    if (_isProcessing || token.isEmpty) return;
    setState(() => _isProcessing = true);

    final repository = ref.read(checkinRepositoryProvider);
    try {
      final outcome = asOverride ? await repository.override(token) : await repository.scan(token);
      setState(() {
        _outcome = outcome;
        _errorMessage = null;
        _lastErrorWasDuplicate = false;
        _lastToken = token;
      });
    } catch (e) {
      final isDuplicate = e is ApiException && e.code == 'conflict';
      setState(() {
        _outcome = null;
        _errorMessage = e is ApiException ? e.message : '$e';
        _lastErrorWasDuplicate = isDuplicate;
        _lastToken = token;
      });
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (capture.barcodes.isEmpty) return;
    final token = capture.barcodes.first.rawValue;
    if (token == null || _isProcessing || _outcome != null || _errorMessage != null) return;
    _submit(token);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final canOverride = ref.watch(authControllerProvider).value?.hasPermission('checkin.override') ?? false;
    final showingResult = _outcome != null || _errorMessage != null;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.checkInTitle)),
      body: Column(
        children: [
          SizedBox(
            height: 280,
            child: Stack(
              fit: StackFit.expand,
              children: [
                MobileScanner(controller: _controller, onDetect: _onDetect),
                if (_isProcessing) const Center(child: CircularProgressIndicator()),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  CheckinResultBanner(outcome: _outcome, errorMessage: _errorMessage),
                  const SizedBox(height: 16),
                  if (showingResult) ...[
                    if (_lastErrorWasDuplicate && canOverride && _lastToken != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: PrimaryButton(
                          label: l10n.overrideCheckIn,
                          onPressed: () => _submit(_lastToken!, asOverride: true),
                        ),
                      ),
                    OutlinedButton(onPressed: _reset, child: Text(l10n.scanNext)),
                  ] else ...[
                    AppTextField(label: l10n.enterCodeManually, controller: _manualController),
                    const SizedBox(height: 12),
                    PrimaryButton(
                      label: l10n.checkIn,
                      isLoading: _isProcessing,
                      onPressed: () => _submit(_manualController.text.trim()),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
