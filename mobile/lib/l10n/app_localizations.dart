import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('fr'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Spotlight'**
  String get appTitle;

  /// No description provided for @appTagline.
  ///
  /// In en, this message translates to:
  /// **'Event venue management'**
  String get appTagline;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @logIn.
  ///
  /// In en, this message translates to:
  /// **'Log in'**
  String get logIn;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get logOut;

  /// No description provided for @enterEmailAndPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter your email and password.'**
  String get enterEmailAndPassword;

  /// No description provided for @invalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'Invalid email or password'**
  String get invalidCredentials;

  /// No description provided for @signedInAs.
  ///
  /// In en, this message translates to:
  /// **'Signed in as {email}'**
  String signedInAs(String email);

  /// No description provided for @role.
  ///
  /// In en, this message translates to:
  /// **'Role: {role}'**
  String role(String role);

  /// No description provided for @calendarTitle.
  ///
  /// In en, this message translates to:
  /// **'Calendar'**
  String get calendarTitle;

  /// No description provided for @noEventsThisDay.
  ///
  /// In en, this message translates to:
  /// **'No events on this day'**
  String get noEventsThisDay;

  /// No description provided for @bookingDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Booking details'**
  String get bookingDetailTitle;

  /// No description provided for @eventDate.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get eventDate;

  /// No description provided for @eventTime.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get eventTime;

  /// No description provided for @guestCount.
  ///
  /// In en, this message translates to:
  /// **'Guests'**
  String get guestCount;

  /// No description provided for @totalAmount.
  ///
  /// In en, this message translates to:
  /// **'Total amount'**
  String get totalAmount;

  /// No description provided for @advancePayment.
  ///
  /// In en, this message translates to:
  /// **'Advance payment'**
  String get advancePayment;

  /// No description provided for @remainingBalance.
  ///
  /// In en, this message translates to:
  /// **'Remaining balance'**
  String get remainingBalance;

  /// No description provided for @services.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get services;

  /// No description provided for @notes.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get notes;

  /// No description provided for @viewCalendar.
  ///
  /// In en, this message translates to:
  /// **'View calendar'**
  String get viewCalendar;

  /// No description provided for @guestsTitle.
  ///
  /// In en, this message translates to:
  /// **'Guests'**
  String get guestsTitle;

  /// No description provided for @addGuest.
  ///
  /// In en, this message translates to:
  /// **'Add guest'**
  String get addGuest;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// No description provided for @phoneOptional.
  ///
  /// In en, this message translates to:
  /// **'Phone (optional)'**
  String get phoneOptional;

  /// No description provided for @emailOptional.
  ///
  /// In en, this message translates to:
  /// **'Email (optional)'**
  String get emailOptional;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @add.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get add;

  /// No description provided for @statTotal.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get statTotal;

  /// No description provided for @statInvited.
  ///
  /// In en, this message translates to:
  /// **'Invited'**
  String get statInvited;

  /// No description provided for @statCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'Checked in'**
  String get statCheckedIn;

  /// No description provided for @rsvpAccepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get rsvpAccepted;

  /// No description provided for @rsvpDeclined.
  ///
  /// In en, this message translates to:
  /// **'Declined'**
  String get rsvpDeclined;

  /// No description provided for @rsvpPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get rsvpPending;

  /// No description provided for @notInvited.
  ///
  /// In en, this message translates to:
  /// **'Not invited'**
  String get notInvited;

  /// No description provided for @noGuestsYet.
  ///
  /// In en, this message translates to:
  /// **'No guests yet'**
  String get noGuestsYet;

  /// No description provided for @viewQrCode.
  ///
  /// In en, this message translates to:
  /// **'View QR code'**
  String get viewQrCode;

  /// No description provided for @generateInvitation.
  ///
  /// In en, this message translates to:
  /// **'Generate invitation'**
  String get generateInvitation;

  /// No description provided for @noInvitationYet.
  ///
  /// In en, this message translates to:
  /// **'This guest doesn\'t have an invitation yet.'**
  String get noInvitationYet;

  /// No description provided for @qrCodeHint.
  ///
  /// In en, this message translates to:
  /// **'Scan this at the entrance to check in.'**
  String get qrCodeHint;

  /// No description provided for @checkInTitle.
  ///
  /// In en, this message translates to:
  /// **'Check-in'**
  String get checkInTitle;

  /// No description provided for @scanQrToCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Point the camera at a guest\'s QR code, or enter their code below.'**
  String get scanQrToCheckIn;

  /// No description provided for @checkedInGranted.
  ///
  /// In en, this message translates to:
  /// **'Checked in'**
  String get checkedInGranted;

  /// No description provided for @checkedInOverride.
  ///
  /// In en, this message translates to:
  /// **'Checked in again (override)'**
  String get checkedInOverride;

  /// No description provided for @deniedNoRsvp.
  ///
  /// In en, this message translates to:
  /// **'Denied - no accepted RSVP'**
  String get deniedNoRsvp;

  /// No description provided for @deniedWrongEvent.
  ///
  /// In en, this message translates to:
  /// **'Denied - not today\'s event'**
  String get deniedWrongEvent;

  /// No description provided for @overrideCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Check in anyway'**
  String get overrideCheckIn;

  /// No description provided for @scanNext.
  ///
  /// In en, this message translates to:
  /// **'Scan next'**
  String get scanNext;

  /// No description provided for @enterCodeManually.
  ///
  /// In en, this message translates to:
  /// **'Enter code manually'**
  String get enterCodeManually;

  /// No description provided for @checkIn.
  ///
  /// In en, this message translates to:
  /// **'Check in'**
  String get checkIn;

  /// No description provided for @confiscationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Deposited items'**
  String get confiscationsTitle;

  /// No description provided for @addItem.
  ///
  /// In en, this message translates to:
  /// **'Add item'**
  String get addItem;

  /// No description provided for @itemType.
  ///
  /// In en, this message translates to:
  /// **'Item type'**
  String get itemType;

  /// No description provided for @itemTypePhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get itemTypePhone;

  /// No description provided for @itemTypeCamera.
  ///
  /// In en, this message translates to:
  /// **'Camera'**
  String get itemTypeCamera;

  /// No description provided for @itemTypeOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get itemTypeOther;

  /// No description provided for @itemDescriptionOptional.
  ///
  /// In en, this message translates to:
  /// **'Description (optional)'**
  String get itemDescriptionOptional;

  /// No description provided for @storageReference.
  ///
  /// In en, this message translates to:
  /// **'Storage tag / locker number'**
  String get storageReference;

  /// No description provided for @guest.
  ///
  /// In en, this message translates to:
  /// **'Guest'**
  String get guest;

  /// No description provided for @selectGuest.
  ///
  /// In en, this message translates to:
  /// **'Select a guest'**
  String get selectGuest;

  /// No description provided for @addPhotoOptional.
  ///
  /// In en, this message translates to:
  /// **'Add photo (optional)'**
  String get addPhotoOptional;

  /// No description provided for @retakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Retake photo'**
  String get retakePhoto;

  /// No description provided for @holding.
  ///
  /// In en, this message translates to:
  /// **'Holding'**
  String get holding;

  /// No description provided for @returned.
  ///
  /// In en, this message translates to:
  /// **'Returned'**
  String get returned;

  /// No description provided for @returnItem.
  ///
  /// In en, this message translates to:
  /// **'Return item'**
  String get returnItem;

  /// No description provided for @returnedToNoteOptional.
  ///
  /// In en, this message translates to:
  /// **'Returned to (optional)'**
  String get returnedToNoteOptional;

  /// No description provided for @confirmReturn.
  ///
  /// In en, this message translates to:
  /// **'Confirm return'**
  String get confirmReturn;

  /// No description provided for @depositedBy.
  ///
  /// In en, this message translates to:
  /// **'Deposited by {name}'**
  String depositedBy(String name);

  /// No description provided for @noConfiscationsYet.
  ///
  /// In en, this message translates to:
  /// **'No deposited items yet'**
  String get noConfiscationsYet;

  /// No description provided for @selectGuestAndStorageTag.
  ///
  /// In en, this message translates to:
  /// **'Select a guest and enter a storage tag.'**
  String get selectGuestAndStorageTag;

  /// No description provided for @viewPhoto.
  ///
  /// In en, this message translates to:
  /// **'View photo'**
  String get viewPhoto;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @expensesTitle.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get expensesTitle;

  /// No description provided for @financialSummary.
  ///
  /// In en, this message translates to:
  /// **'Financial summary'**
  String get financialSummary;

  /// No description provided for @revenue.
  ///
  /// In en, this message translates to:
  /// **'Revenue'**
  String get revenue;

  /// No description provided for @paymentsReceived.
  ///
  /// In en, this message translates to:
  /// **'Payments received'**
  String get paymentsReceived;

  /// No description provided for @outstandingBalance.
  ///
  /// In en, this message translates to:
  /// **'Outstanding balance'**
  String get outstandingBalance;

  /// No description provided for @expensesByCategory.
  ///
  /// In en, this message translates to:
  /// **'Expenses by category'**
  String get expensesByCategory;

  /// No description provided for @addExpense.
  ///
  /// In en, this message translates to:
  /// **'Add expense'**
  String get addExpense;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @selectCategory.
  ///
  /// In en, this message translates to:
  /// **'Select a category'**
  String get selectCategory;

  /// No description provided for @allCategories.
  ///
  /// In en, this message translates to:
  /// **'All categories'**
  String get allCategories;

  /// No description provided for @amount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get amount;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @paymentMethod.
  ///
  /// In en, this message translates to:
  /// **'Payment method'**
  String get paymentMethod;

  /// No description provided for @paymentMethodCash.
  ///
  /// In en, this message translates to:
  /// **'Cash'**
  String get paymentMethodCash;

  /// No description provided for @paymentMethodBankTransfer.
  ///
  /// In en, this message translates to:
  /// **'Bank transfer'**
  String get paymentMethodBankTransfer;

  /// No description provided for @paymentMethodCard.
  ///
  /// In en, this message translates to:
  /// **'Card'**
  String get paymentMethodCard;

  /// No description provided for @paymentMethodCheck.
  ///
  /// In en, this message translates to:
  /// **'Check'**
  String get paymentMethodCheck;

  /// No description provided for @descriptionOptional.
  ///
  /// In en, this message translates to:
  /// **'Description (optional)'**
  String get descriptionOptional;

  /// No description provided for @noExpensesYet.
  ///
  /// In en, this message translates to:
  /// **'No expenses recorded yet'**
  String get noExpensesYet;

  /// No description provided for @selectCategoryAndAmount.
  ///
  /// In en, this message translates to:
  /// **'Select a category and enter an amount.'**
  String get selectCategoryAndAmount;

  /// No description provided for @thisMonth.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get thisMonth;

  /// No description provided for @viewExpenses.
  ///
  /// In en, this message translates to:
  /// **'View expenses'**
  String get viewExpenses;

  /// No description provided for @employeesTitle.
  ///
  /// In en, this message translates to:
  /// **'Employees'**
  String get employeesTitle;

  /// No description provided for @addEmployee.
  ///
  /// In en, this message translates to:
  /// **'Add employee'**
  String get addEmployee;

  /// No description provided for @position.
  ///
  /// In en, this message translates to:
  /// **'Position'**
  String get position;

  /// No description provided for @baseSalary.
  ///
  /// In en, this message translates to:
  /// **'Base salary'**
  String get baseSalary;

  /// No description provided for @startDate.
  ///
  /// In en, this message translates to:
  /// **'Start date'**
  String get startDate;

  /// No description provided for @employmentStatus.
  ///
  /// In en, this message translates to:
  /// **'Employment status'**
  String get employmentStatus;

  /// No description provided for @employmentStatusActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get employmentStatusActive;

  /// No description provided for @employmentStatusOnLeave.
  ///
  /// In en, this message translates to:
  /// **'On leave'**
  String get employmentStatusOnLeave;

  /// No description provided for @employmentStatusTerminated.
  ///
  /// In en, this message translates to:
  /// **'Terminated'**
  String get employmentStatusTerminated;

  /// No description provided for @noEmployeesYet.
  ///
  /// In en, this message translates to:
  /// **'No employees yet'**
  String get noEmployeesYet;

  /// No description provided for @payrollHistory.
  ///
  /// In en, this message translates to:
  /// **'Payroll history'**
  String get payrollHistory;

  /// No description provided for @runPayroll.
  ///
  /// In en, this message translates to:
  /// **'Run payroll'**
  String get runPayroll;

  /// No description provided for @periodStart.
  ///
  /// In en, this message translates to:
  /// **'Period start'**
  String get periodStart;

  /// No description provided for @periodEnd.
  ///
  /// In en, this message translates to:
  /// **'Period end'**
  String get periodEnd;

  /// No description provided for @bonusesOptional.
  ///
  /// In en, this message translates to:
  /// **'Bonuses (optional)'**
  String get bonusesOptional;

  /// No description provided for @deductionsOptional.
  ///
  /// In en, this message translates to:
  /// **'Deductions (optional)'**
  String get deductionsOptional;

  /// No description provided for @netPay.
  ///
  /// In en, this message translates to:
  /// **'Net pay'**
  String get netPay;

  /// No description provided for @markPaid.
  ///
  /// In en, this message translates to:
  /// **'Mark as paid'**
  String get markPaid;

  /// No description provided for @paymentStatusPaid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get paymentStatusPaid;

  /// No description provided for @paymentStatusUnpaid.
  ///
  /// In en, this message translates to:
  /// **'Unpaid'**
  String get paymentStatusUnpaid;

  /// No description provided for @paymentStatusPartial.
  ///
  /// In en, this message translates to:
  /// **'Partial'**
  String get paymentStatusPartial;

  /// No description provided for @noPayrollHistoryYet.
  ///
  /// In en, this message translates to:
  /// **'No payroll runs yet'**
  String get noPayrollHistoryYet;

  /// No description provided for @selectPeriod.
  ///
  /// In en, this message translates to:
  /// **'Select the pay period.'**
  String get selectPeriod;

  /// No description provided for @fillRequiredFields.
  ///
  /// In en, this message translates to:
  /// **'Fill in all required fields.'**
  String get fillRequiredFields;

  /// No description provided for @caterersTitle.
  ///
  /// In en, this message translates to:
  /// **'Caterers'**
  String get caterersTitle;

  /// No description provided for @addCaterer.
  ///
  /// In en, this message translates to:
  /// **'Add caterer'**
  String get addCaterer;

  /// No description provided for @servicesOffered.
  ///
  /// In en, this message translates to:
  /// **'Services offered'**
  String get servicesOffered;

  /// No description provided for @assignedBookings.
  ///
  /// In en, this message translates to:
  /// **'Assigned bookings'**
  String get assignedBookings;

  /// No description provided for @noCaterersYet.
  ///
  /// In en, this message translates to:
  /// **'No caterers yet'**
  String get noCaterersYet;

  /// No description provided for @suppliersTitle.
  ///
  /// In en, this message translates to:
  /// **'Suppliers'**
  String get suppliersTitle;

  /// No description provided for @addSupplier.
  ///
  /// In en, this message translates to:
  /// **'Add supplier'**
  String get addSupplier;

  /// No description provided for @productsOffered.
  ///
  /// In en, this message translates to:
  /// **'Products offered'**
  String get productsOffered;

  /// No description provided for @purchaseHistory.
  ///
  /// In en, this message translates to:
  /// **'Purchase history'**
  String get purchaseHistory;

  /// No description provided for @linkedEquipment.
  ///
  /// In en, this message translates to:
  /// **'Linked equipment'**
  String get linkedEquipment;

  /// No description provided for @noSuppliersYet.
  ///
  /// In en, this message translates to:
  /// **'No suppliers yet'**
  String get noSuppliersYet;

  /// No description provided for @equipmentTitle.
  ///
  /// In en, this message translates to:
  /// **'Equipment'**
  String get equipmentTitle;

  /// No description provided for @addEquipment.
  ///
  /// In en, this message translates to:
  /// **'Add equipment'**
  String get addEquipment;

  /// No description provided for @quantityTotal.
  ///
  /// In en, this message translates to:
  /// **'Total quantity'**
  String get quantityTotal;

  /// No description provided for @quantityAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get quantityAvailable;

  /// No description provided for @locationOptional.
  ///
  /// In en, this message translates to:
  /// **'Location (optional)'**
  String get locationOptional;

  /// No description provided for @noEquipmentYet.
  ///
  /// In en, this message translates to:
  /// **'No equipment yet'**
  String get noEquipmentYet;

  /// No description provided for @assignEquipment.
  ///
  /// In en, this message translates to:
  /// **'Assign to booking'**
  String get assignEquipment;

  /// No description provided for @quantity.
  ///
  /// In en, this message translates to:
  /// **'Quantity'**
  String get quantity;

  /// No description provided for @bookingIdLabel.
  ///
  /// In en, this message translates to:
  /// **'Booking ID'**
  String get bookingIdLabel;

  /// No description provided for @returnEquipment.
  ///
  /// In en, this message translates to:
  /// **'Return'**
  String get returnEquipment;

  /// No description provided for @assignmentHistory.
  ///
  /// In en, this message translates to:
  /// **'Assignment history'**
  String get assignmentHistory;

  /// No description provided for @noAssignmentsYet.
  ///
  /// In en, this message translates to:
  /// **'No assignments yet'**
  String get noAssignmentsYet;

  /// No description provided for @archivesTitle.
  ///
  /// In en, this message translates to:
  /// **'Archives'**
  String get archivesTitle;

  /// No description provided for @auditLogTitle.
  ///
  /// In en, this message translates to:
  /// **'Audit log'**
  String get auditLogTitle;

  /// No description provided for @allTypes.
  ///
  /// In en, this message translates to:
  /// **'All types'**
  String get allTypes;

  /// No description provided for @noArchivesYet.
  ///
  /// In en, this message translates to:
  /// **'Nothing archived yet'**
  String get noArchivesYet;

  /// No description provided for @noReasonGiven.
  ///
  /// In en, this message translates to:
  /// **'No reason given'**
  String get noReasonGiven;

  /// No description provided for @noAuditLogEntriesYet.
  ///
  /// In en, this message translates to:
  /// **'No audit log entries yet'**
  String get noAuditLogEntriesYet;

  /// No description provided for @systemActor.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get systemActor;

  /// No description provided for @exportCsv.
  ///
  /// In en, this message translates to:
  /// **'Export CSV'**
  String get exportCsv;

  /// No description provided for @exportPdf.
  ///
  /// In en, this message translates to:
  /// **'Export PDF'**
  String get exportPdf;

  /// No description provided for @exportFailed.
  ///
  /// In en, this message translates to:
  /// **'Export failed'**
  String get exportFailed;

  /// No description provided for @todaysEvents.
  ///
  /// In en, this message translates to:
  /// **'Today\'s events'**
  String get todaysEvents;

  /// No description provided for @upcomingBookings.
  ///
  /// In en, this message translates to:
  /// **'Upcoming (7 days)'**
  String get upcomingBookings;

  /// No description provided for @pendingRequests.
  ///
  /// In en, this message translates to:
  /// **'Pending requests'**
  String get pendingRequests;

  /// No description provided for @itemsInCustody.
  ///
  /// In en, this message translates to:
  /// **'Items in custody'**
  String get itemsInCustody;

  /// No description provided for @revenueThisMonth.
  ///
  /// In en, this message translates to:
  /// **'Revenue this month'**
  String get revenueThisMonth;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
