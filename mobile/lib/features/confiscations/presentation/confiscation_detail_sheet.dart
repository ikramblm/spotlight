import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/api/providers.dart';
import '../../../core/models/confiscation.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/presentation/auth_controller.dart';
import 'confiscations_controller.dart';

Future<void> showConfiscationDetail(BuildContext context, Confiscation item, String eventId) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (context) => _ConfiscationDetailSheet(item: item, eventId: eventId),
  );
}

class _ConfiscationDetailSheet extends ConsumerStatefulWidget {
  const _ConfiscationDetailSheet({required this.item, required this.eventId});

  final Confiscation item;
  final String eventId;

  @override
  ConsumerState<_ConfiscationDetailSheet> createState() => _ConfiscationDetailSheetState();
}

class _ConfiscationDetailSheetState extends ConsumerState<_ConfiscationDetailSheet> {
  final _noteController = TextEditingController();
  bool _isReturning = false;
  String? _error;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _confirmReturn() async {
    setState(() {
      _isReturning = true;
      _error = null;
    });
    try {
      await ref
          .read(confiscationsRepositoryProvider)
          .returnItem(widget.item.id, returnedToNote: _noteController.text.trim());
      ref.invalidate(confiscationListProvider(widget.eventId));
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : '$e');
    } finally {
      if (mounted) setState(() => _isReturning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final item = widget.item;
    final apiClient = ref.watch(apiClientProvider);
    final canReturn = ref.watch(authControllerProvider).value?.hasPermission('confiscations.return') ?? false;

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.guestName, style: Theme.of(context).textTheme.titleLarge),
            Text(item.storageReference, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 8),
            StatusBadge(
              label: item.status == RestitutionStatus.holding ? l10n.holding : l10n.returned,
              color: item.status == RestitutionStatus.holding ? Colors.orange : Colors.green,
            ),
            const SizedBox(height: 12),
            Text(l10n.depositedBy(item.depositedByName)),
            if (item.itemDescription != null && item.itemDescription!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(item.itemDescription!),
            ],
            if (item.hasPhoto) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  ref.read(confiscationsRepositoryProvider).photoUrl(item.id),
                  headers: apiClient.accessToken != null ? {'Authorization': 'Bearer ${apiClient.accessToken}'} : null,
                  height: 180,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.error_outline),
                ),
              ),
            ],
            if (item.status == RestitutionStatus.returned && item.restitution != null) ...[
              const Divider(height: 32),
              if (item.restitution!.returnedToNote != null) Text(item.restitution!.returnedToNote!),
            ] else if (canReturn) ...[
              const Divider(height: 32),
              AppTextField(label: l10n.returnedToNoteOptional, controller: _noteController),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 12),
              PrimaryButton(label: l10n.confirmReturn, isLoading: _isReturning, onPressed: _confirmReturn),
            ],
          ],
        ),
      ),
    );
  }
}
