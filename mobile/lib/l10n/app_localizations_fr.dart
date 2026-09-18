// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'Spotlight';

  @override
  String get appTagline => 'Gestion de salles des fêtes';

  @override
  String get email => 'E-mail';

  @override
  String get password => 'Mot de passe';

  @override
  String get logIn => 'Connexion';

  @override
  String get logOut => 'Déconnexion';

  @override
  String get enterEmailAndPassword =>
      'Saisissez votre e-mail et votre mot de passe.';

  @override
  String get invalidCredentials => 'E-mail ou mot de passe incorrect';

  @override
  String signedInAs(String email) {
    return 'Connecté en tant que $email';
  }

  @override
  String role(String role) {
    return 'Rôle : $role';
  }

  @override
  String get calendarTitle => 'Calendrier';

  @override
  String get noEventsThisDay => 'Aucun événement ce jour-là';

  @override
  String get bookingDetailTitle => 'Détails de la réservation';

  @override
  String get eventDate => 'Date';

  @override
  String get eventTime => 'Heure';

  @override
  String get guestCount => 'Invités';

  @override
  String get totalAmount => 'Montant total';

  @override
  String get advancePayment => 'Acompte';

  @override
  String get remainingBalance => 'Solde restant';

  @override
  String get services => 'Services';

  @override
  String get notes => 'Notes';

  @override
  String get viewCalendar => 'Voir le calendrier';

  @override
  String get guestsTitle => 'Invités';

  @override
  String get addGuest => 'Ajouter un invité';

  @override
  String get fullName => 'Nom complet';

  @override
  String get phoneOptional => 'Téléphone (optionnel)';

  @override
  String get emailOptional => 'E-mail (optionnel)';

  @override
  String get cancel => 'Annuler';

  @override
  String get add => 'Ajouter';

  @override
  String get statTotal => 'Total';

  @override
  String get statInvited => 'Invités';

  @override
  String get statCheckedIn => 'Enregistrés';

  @override
  String get rsvpAccepted => 'Accepté';

  @override
  String get rsvpDeclined => 'Refusé';

  @override
  String get rsvpPending => 'En attente';

  @override
  String get notInvited => 'Non invité';

  @override
  String get noGuestsYet => 'Aucun invité pour le moment';

  @override
  String get viewQrCode => 'Voir le code QR';

  @override
  String get generateInvitation => 'Générer une invitation';

  @override
  String get noInvitationYet => 'Cet invité n\'a pas encore d\'invitation.';

  @override
  String get qrCodeHint =>
      'Scannez ce code à l\'entrée pour l\'enregistrement.';

  @override
  String get checkInTitle => 'Enregistrement';

  @override
  String get scanQrToCheckIn =>
      'Pointez la caméra sur le code QR d\'un invité, ou saisissez son code ci-dessous.';

  @override
  String get checkedInGranted => 'Enregistré';

  @override
  String get checkedInOverride => 'Enregistré à nouveau (dérogation)';

  @override
  String get deniedNoRsvp => 'Refusé - pas de confirmation acceptée';

  @override
  String get deniedWrongEvent => 'Refusé - pas l\'événement d\'aujourd\'hui';

  @override
  String get overrideCheckIn => 'Enregistrer quand même';

  @override
  String get scanNext => 'Scanner le suivant';

  @override
  String get enterCodeManually => 'Saisir le code manuellement';

  @override
  String get checkIn => 'Enregistrer';

  @override
  String get confiscationsTitle => 'Objets déposés';

  @override
  String get addItem => 'Ajouter un objet';

  @override
  String get itemType => 'Type d\'objet';

  @override
  String get itemTypePhone => 'Téléphone';

  @override
  String get itemTypeCamera => 'Appareil photo';

  @override
  String get itemTypeOther => 'Autre';

  @override
  String get itemDescriptionOptional => 'Description (optionnel)';

  @override
  String get storageReference => 'Étiquette / numéro de casier';

  @override
  String get guest => 'Invité';

  @override
  String get selectGuest => 'Sélectionner un invité';

  @override
  String get addPhotoOptional => 'Ajouter une photo (optionnel)';

  @override
  String get retakePhoto => 'Reprendre la photo';

  @override
  String get holding => 'En dépôt';

  @override
  String get returned => 'Restitué';

  @override
  String get returnItem => 'Restituer l\'objet';

  @override
  String get returnedToNoteOptional => 'Restitué à (optionnel)';

  @override
  String get confirmReturn => 'Confirmer la restitution';

  @override
  String depositedBy(String name) {
    return 'Déposé par $name';
  }

  @override
  String get noConfiscationsYet => 'Aucun objet déposé pour le moment';

  @override
  String get selectGuestAndStorageTag =>
      'Sélectionnez un invité et saisissez une étiquette de dépôt.';

  @override
  String get viewPhoto => 'Voir la photo';

  @override
  String get save => 'Enregistrer';

  @override
  String get expensesTitle => 'Dépenses';

  @override
  String get financialSummary => 'Résumé financier';

  @override
  String get revenue => 'Revenu';

  @override
  String get paymentsReceived => 'Paiements reçus';

  @override
  String get outstandingBalance => 'Solde impayé';

  @override
  String get expensesByCategory => 'Dépenses par catégorie';

  @override
  String get addExpense => 'Ajouter une dépense';

  @override
  String get category => 'Catégorie';

  @override
  String get selectCategory => 'Sélectionner une catégorie';

  @override
  String get allCategories => 'Toutes les catégories';

  @override
  String get amount => 'Montant';

  @override
  String get date => 'Date';

  @override
  String get paymentMethod => 'Mode de paiement';

  @override
  String get paymentMethodCash => 'Espèces';

  @override
  String get paymentMethodBankTransfer => 'Virement bancaire';

  @override
  String get paymentMethodCard => 'Carte';

  @override
  String get paymentMethodCheck => 'Chèque';

  @override
  String get descriptionOptional => 'Description (optionnel)';

  @override
  String get noExpensesYet => 'Aucune dépense enregistrée pour le moment';

  @override
  String get selectCategoryAndAmount =>
      'Sélectionnez une catégorie et saisissez un montant.';

  @override
  String get thisMonth => 'Ce mois-ci';

  @override
  String get viewExpenses => 'Voir les dépenses';

  @override
  String get employeesTitle => 'Employés';

  @override
  String get addEmployee => 'Ajouter un employé';

  @override
  String get position => 'Poste';

  @override
  String get baseSalary => 'Salaire de base';

  @override
  String get startDate => 'Date d\'embauche';

  @override
  String get employmentStatus => 'Statut d\'emploi';

  @override
  String get employmentStatusActive => 'Actif';

  @override
  String get employmentStatusOnLeave => 'En congé';

  @override
  String get employmentStatusTerminated => 'Licencié';

  @override
  String get noEmployeesYet => 'Aucun employé pour le moment';

  @override
  String get payrollHistory => 'Historique de paie';

  @override
  String get runPayroll => 'Exécuter la paie';

  @override
  String get periodStart => 'Début de période';

  @override
  String get periodEnd => 'Fin de période';

  @override
  String get bonusesOptional => 'Primes (optionnel)';

  @override
  String get deductionsOptional => 'Retenues (optionnel)';

  @override
  String get netPay => 'Salaire net';

  @override
  String get markPaid => 'Marquer comme payé';

  @override
  String get paymentStatusPaid => 'Payé';

  @override
  String get paymentStatusUnpaid => 'Non payé';

  @override
  String get paymentStatusPartial => 'Partiel';

  @override
  String get noPayrollHistoryYet => 'Aucune paie enregistrée pour le moment';

  @override
  String get selectPeriod => 'Sélectionnez la période de paie.';

  @override
  String get fillRequiredFields => 'Remplissez tous les champs obligatoires.';

  @override
  String get caterersTitle => 'Traiteurs';

  @override
  String get addCaterer => 'Ajouter un traiteur';

  @override
  String get servicesOffered => 'Services proposés';

  @override
  String get assignedBookings => 'Réservations assignées';

  @override
  String get noCaterersYet => 'Aucun traiteur pour le moment';

  @override
  String get suppliersTitle => 'Fournisseurs';

  @override
  String get addSupplier => 'Ajouter un fournisseur';

  @override
  String get productsOffered => 'Produits proposés';

  @override
  String get purchaseHistory => 'Historique des achats';

  @override
  String get linkedEquipment => 'Équipement lié';

  @override
  String get noSuppliersYet => 'Aucun fournisseur pour le moment';

  @override
  String get equipmentTitle => 'Équipement';

  @override
  String get addEquipment => 'Ajouter un équipement';

  @override
  String get quantityTotal => 'Quantité totale';

  @override
  String get quantityAvailable => 'Disponible';

  @override
  String get locationOptional => 'Emplacement (optionnel)';

  @override
  String get noEquipmentYet => 'Aucun équipement pour le moment';

  @override
  String get assignEquipment => 'Assigner à une réservation';

  @override
  String get quantity => 'Quantité';

  @override
  String get bookingIdLabel => 'ID de réservation';

  @override
  String get returnEquipment => 'Retourner';

  @override
  String get assignmentHistory => 'Historique des assignations';

  @override
  String get noAssignmentsYet => 'Aucune assignation pour le moment';

  @override
  String get archivesTitle => 'Archives';

  @override
  String get auditLogTitle => 'Journal d\'audit';

  @override
  String get allTypes => 'Tous les types';

  @override
  String get noArchivesYet => 'Rien n\'a encore été archivé';

  @override
  String get noReasonGiven => 'Aucune raison indiquée';

  @override
  String get noAuditLogEntriesYet => 'Aucune entrée dans le journal d\'audit';

  @override
  String get systemActor => 'Système';

  @override
  String get exportCsv => 'Exporter en CSV';

  @override
  String get exportPdf => 'Exporter en PDF';

  @override
  String get exportFailed => 'Échec de l\'export';

  @override
  String get todaysEvents => 'Événements du jour';

  @override
  String get upcomingBookings => 'À venir (7 jours)';

  @override
  String get pendingRequests => 'Demandes en attente';

  @override
  String get itemsInCustody => 'Objets en dépôt';

  @override
  String get revenueThisMonth => 'Revenu du mois';
}
