import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/confiscation.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../../guests/presentation/guests_controller.dart';
import 'confiscations_controller.dart';

class AddConfiscationScreen extends ConsumerStatefulWidget {
  const AddConfiscationScreen({super.key, required this.eventId});

  final String eventId;

  @override
  ConsumerState<AddConfiscationScreen> createState() => _AddConfiscationScreenState();
}

class _AddConfiscationScreenState extends ConsumerState<AddConfiscationScreen> {
  String? _selectedGuestId;
  ItemType _itemType = ItemType.phone;
  final _descriptionController = TextEditingController();
  final _storageRefController = TextEditingController();
  XFile? _photo;
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _descriptionController.dispose();
    _storageRefController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85);
    if (picked != null) setState(() => _photo = picked);
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    final guestId = _selectedGuestId;
    final storageReference = _storageRefController.text.trim();

    if (guestId == null || storageReference.isEmpty) {
      setState(() => _error = l10n.selectGuestAndStorageTag);
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      await ref
          .read(confiscationsRepositoryProvider)
          .create(
            guestId: guestId,
            itemType: _itemType,
            itemDescription: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
            storageReference: storageReference,
            photoPath: _photo?.path,
          );
      ref.invalidate(confiscationListProvider(widget.eventId));
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : '$e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final guestsAsync = ref.watch(guestListProvider(widget.eventId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.addItem)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          guestsAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, _) => Text(error.toString()),
            data: (guests) => DropdownButtonFormField<String>(
              initialValue: _selectedGuestId,
              decoration: InputDecoration(labelText: l10n.guest, border: const OutlineInputBorder()),
              hint: Text(l10n.selectGuest),
              items: guests
                  .map((guest) => DropdownMenuItem(value: guest.id, child: Text(guest.fullName)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedGuestId = value),
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<ItemType>(
            initialValue: _itemType,
            decoration: InputDecoration(labelText: l10n.itemType, border: const OutlineInputBorder()),
            items: [
              DropdownMenuItem(value: ItemType.phone, child: Text(l10n.itemTypePhone)),
              DropdownMenuItem(value: ItemType.camera, child: Text(l10n.itemTypeCamera)),
              DropdownMenuItem(value: ItemType.other, child: Text(l10n.itemTypeOther)),
            ],
            onChanged: (value) => setState(() => _itemType = value ?? ItemType.phone),
          ),
          const SizedBox(height: 16),
          AppTextField(label: l10n.storageReference, controller: _storageRefController),
          const SizedBox(height: 16),
          AppTextField(label: l10n.itemDescriptionOptional, controller: _descriptionController),
          const SizedBox(height: 16),
          if (_photo != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(File(_photo!.path), height: 160, fit: BoxFit.cover),
            ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _pickPhoto,
            icon: const Icon(Icons.camera_alt_outlined),
            label: Text(_photo == null ? l10n.addPhotoOptional : l10n.retakePhoto),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 24),
          PrimaryButton(label: l10n.save, isLoading: _isSaving, onPressed: _save),
        ],
      ),
    );
  }
}
