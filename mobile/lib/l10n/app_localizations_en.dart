// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Spotlight';

  @override
  String get appTagline => 'Event venue management';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get logIn => 'Log in';

  @override
  String get logOut => 'Log out';

  @override
  String get enterEmailAndPassword => 'Enter your email and password.';

  @override
  String get invalidCredentials => 'Invalid email or password';

  @override
  String signedInAs(String email) {
    return 'Signed in as $email';
  }

  @override
  String role(String role) {
    return 'Role: $role';
  }

  @override
  String get calendarTitle => 'Calendar';

  @override
  String get noEventsThisDay => 'No events on this day';

  @override
  String get bookingDetailTitle => 'Booking details';

  @override
  String get eventDate => 'Date';

  @override
  String get eventTime => 'Time';

  @override
  String get guestCount => 'Guests';

  @override
  String get totalAmount => 'Total amount';

  @override
  String get advancePayment => 'Advance payment';

  @override
  String get remainingBalance => 'Remaining balance';

  @override
  String get services => 'Services';

  @override
  String get notes => 'Notes';

  @override
  String get viewCalendar => 'View calendar';

  @override
  String get guestsTitle => 'Guests';

  @override
  String get addGuest => 'Add guest';

  @override
  String get fullName => 'Full name';

  @override
  String get phoneOptional => 'Phone (optional)';

  @override
  String get emailOptional => 'Email (optional)';

  @override
  String get cancel => 'Cancel';

  @override
  String get add => 'Add';

  @override
  String get statTotal => 'Total';

  @override
  String get statInvited => 'Invited';

  @override
  String get statCheckedIn => 'Checked in';

  @override
  String get rsvpAccepted => 'Accepted';

  @override
  String get rsvpDeclined => 'Declined';

  @override
  String get rsvpPending => 'Pending';

  @override
  String get notInvited => 'Not invited';

  @override
  String get noGuestsYet => 'No guests yet';

  @override
  String get viewQrCode => 'View QR code';

  @override
  String get generateInvitation => 'Generate invitation';

  @override
  String get noInvitationYet => 'This guest doesn\'t have an invitation yet.';

  @override
  String get qrCodeHint => 'Scan this at the entrance to check in.';

  @override
  String get checkInTitle => 'Check-in';

  @override
  String get scanQrToCheckIn =>
      'Point the camera at a guest\'s QR code, or enter their code below.';

  @override
  String get checkedInGranted => 'Checked in';

  @override
  String get checkedInOverride => 'Checked in again (override)';

  @override
  String get deniedNoRsvp => 'Denied - no accepted RSVP';

  @override
  String get deniedWrongEvent => 'Denied - not today\'s event';

  @override
  String get overrideCheckIn => 'Check in anyway';

  @override
  String get scanNext => 'Scan next';

  @override
  String get enterCodeManually => 'Enter code manually';

  @override
  String get checkIn => 'Check in';

  @override
  String get confiscationsTitle => 'Deposited items';

  @override
  String get addItem => 'Add item';

  @override
  String get itemType => 'Item type';

  @override
  String get itemTypePhone => 'Phone';

  @override
  String get itemTypeCamera => 'Camera';

  @override
  String get itemTypeOther => 'Other';

  @override
  String get itemDescriptionOptional => 'Description (optional)';

  @override
  String get storageReference => 'Storage tag / locker number';

  @override
  String get guest => 'Guest';

  @override
  String get selectGuest => 'Select a guest';

  @override
  String get addPhotoOptional => 'Add photo (optional)';

  @override
  String get retakePhoto => 'Retake photo';

  @override
  String get holding => 'Holding';

  @override
  String get returned => 'Returned';

  @override
  String get returnItem => 'Return item';

  @override
  String get returnedToNoteOptional => 'Returned to (optional)';

  @override
  String get confirmReturn => 'Confirm return';

  @override
  String depositedBy(String name) {
    return 'Deposited by $name';
  }

  @override
  String get noConfiscationsYet => 'No deposited items yet';

  @override
  String get selectGuestAndStorageTag =>
      'Select a guest and enter a storage tag.';

  @override
  String get viewPhoto => 'View photo';

  @override
  String get save => 'Save';

  @override
  String get expensesTitle => 'Expenses';

  @override
  String get financialSummary => 'Financial summary';

  @override
  String get revenue => 'Revenue';

  @override
  String get paymentsReceived => 'Payments received';

  @override
  String get outstandingBalance => 'Outstanding balance';

  @override
  String get expensesByCategory => 'Expenses by category';

  @override
  String get addExpense => 'Add expense';

  @override
  String get category => 'Category';

  @override
  String get selectCategory => 'Select a category';

  @override
  String get allCategories => 'All categories';

  @override
  String get amount => 'Amount';

  @override
  String get date => 'Date';

  @override
  String get paymentMethod => 'Payment method';

  @override
  String get paymentMethodCash => 'Cash';

  @override
  String get paymentMethodBankTransfer => 'Bank transfer';

  @override
  String get paymentMethodCard => 'Card';

  @override
  String get paymentMethodCheck => 'Check';

  @override
  String get descriptionOptional => 'Description (optional)';

  @override
  String get noExpensesYet => 'No expenses recorded yet';

  @override
  String get selectCategoryAndAmount =>
      'Select a category and enter an amount.';

  @override
  String get thisMonth => 'This month';

  @override
  String get viewExpenses => 'View expenses';

  @override
  String get employeesTitle => 'Employees';

  @override
  String get addEmployee => 'Add employee';

  @override
  String get position => 'Position';

  @override
  String get baseSalary => 'Base salary';

  @override
  String get startDate => 'Start date';

  @override
  String get employmentStatus => 'Employment status';

  @override
  String get employmentStatusActive => 'Active';

  @override
  String get employmentStatusOnLeave => 'On leave';

  @override
  String get employmentStatusTerminated => 'Terminated';

  @override
  String get noEmployeesYet => 'No employees yet';

  @override
  String get payrollHistory => 'Payroll history';

  @override
  String get runPayroll => 'Run payroll';

  @override
  String get periodStart => 'Period start';

  @override
  String get periodEnd => 'Period end';

  @override
  String get bonusesOptional => 'Bonuses (optional)';

  @override
  String get deductionsOptional => 'Deductions (optional)';

  @override
  String get netPay => 'Net pay';

  @override
  String get markPaid => 'Mark as paid';

  @override
  String get paymentStatusPaid => 'Paid';

  @override
  String get paymentStatusUnpaid => 'Unpaid';

  @override
  String get paymentStatusPartial => 'Partial';

  @override
  String get noPayrollHistoryYet => 'No payroll runs yet';

  @override
  String get selectPeriod => 'Select the pay period.';

  @override
  String get fillRequiredFields => 'Fill in all required fields.';

  @override
  String get caterersTitle => 'Caterers';

  @override
  String get addCaterer => 'Add caterer';

  @override
  String get servicesOffered => 'Services offered';

  @override
  String get assignedBookings => 'Assigned bookings';

  @override
  String get noCaterersYet => 'No caterers yet';

  @override
  String get suppliersTitle => 'Suppliers';

  @override
  String get addSupplier => 'Add supplier';

  @override
  String get productsOffered => 'Products offered';

  @override
  String get purchaseHistory => 'Purchase history';

  @override
  String get linkedEquipment => 'Linked equipment';

  @override
  String get noSuppliersYet => 'No suppliers yet';

  @override
  String get equipmentTitle => 'Equipment';

  @override
  String get addEquipment => 'Add equipment';

  @override
  String get quantityTotal => 'Total quantity';

  @override
  String get quantityAvailable => 'Available';

  @override
  String get locationOptional => 'Location (optional)';

  @override
  String get noEquipmentYet => 'No equipment yet';

  @override
  String get assignEquipment => 'Assign to booking';

  @override
  String get quantity => 'Quantity';

  @override
  String get bookingIdLabel => 'Booking ID';

  @override
  String get returnEquipment => 'Return';

  @override
  String get assignmentHistory => 'Assignment history';

  @override
  String get noAssignmentsYet => 'No assignments yet';

  @override
  String get archivesTitle => 'Archives';

  @override
  String get auditLogTitle => 'Audit log';

  @override
  String get allTypes => 'All types';

  @override
  String get noArchivesYet => 'Nothing archived yet';

  @override
  String get noReasonGiven => 'No reason given';

  @override
  String get noAuditLogEntriesYet => 'No audit log entries yet';

  @override
  String get systemActor => 'System';

  @override
  String get exportCsv => 'Export CSV';

  @override
  String get exportPdf => 'Export PDF';

  @override
  String get exportFailed => 'Export failed';

  @override
  String get todaysEvents => 'Today\'s events';

  @override
  String get upcomingBookings => 'Upcoming (7 days)';

  @override
  String get pendingRequests => 'Pending requests';

  @override
  String get itemsInCustody => 'Items in custody';

  @override
  String get revenueThisMonth => 'Revenue this month';
}
