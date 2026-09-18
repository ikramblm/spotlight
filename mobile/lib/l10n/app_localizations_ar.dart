// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'سبوتلايت';

  @override
  String get appTagline => 'إدارة قاعات المناسبات';

  @override
  String get email => 'البريد الإلكتروني';

  @override
  String get password => 'كلمة المرور';

  @override
  String get logIn => 'تسجيل الدخول';

  @override
  String get logOut => 'تسجيل الخروج';

  @override
  String get enterEmailAndPassword => 'أدخل بريدك الإلكتروني وكلمة المرور.';

  @override
  String get invalidCredentials => 'البريد الإلكتروني أو كلمة المرور غير صحيحة';

  @override
  String signedInAs(String email) {
    return 'تم تسجيل الدخول باسم $email';
  }

  @override
  String role(String role) {
    return 'الدور: $role';
  }

  @override
  String get calendarTitle => 'التقويم';

  @override
  String get noEventsThisDay => 'لا توجد فعاليات في هذا اليوم';

  @override
  String get bookingDetailTitle => 'تفاصيل الحجز';

  @override
  String get eventDate => 'التاريخ';

  @override
  String get eventTime => 'الوقت';

  @override
  String get guestCount => 'عدد الضيوف';

  @override
  String get totalAmount => 'المبلغ الإجمالي';

  @override
  String get advancePayment => 'الدفعة المقدمة';

  @override
  String get remainingBalance => 'الرصيد المتبقي';

  @override
  String get services => 'الخدمات';

  @override
  String get notes => 'ملاحظات';

  @override
  String get viewCalendar => 'عرض التقويم';

  @override
  String get guestsTitle => 'الضيوف';

  @override
  String get addGuest => 'إضافة ضيف';

  @override
  String get fullName => 'الاسم الكامل';

  @override
  String get phoneOptional => 'الهاتف (اختياري)';

  @override
  String get emailOptional => 'البريد الإلكتروني (اختياري)';

  @override
  String get cancel => 'إلغاء';

  @override
  String get add => 'إضافة';

  @override
  String get statTotal => 'الإجمالي';

  @override
  String get statInvited => 'المدعوون';

  @override
  String get statCheckedIn => 'الحاضرون';

  @override
  String get rsvpAccepted => 'مقبول';

  @override
  String get rsvpDeclined => 'مرفوض';

  @override
  String get rsvpPending => 'قيد الانتظار';

  @override
  String get notInvited => 'غير مدعو';

  @override
  String get noGuestsYet => 'لا يوجد ضيوف بعد';

  @override
  String get viewQrCode => 'عرض رمز QR';

  @override
  String get generateInvitation => 'إنشاء دعوة';

  @override
  String get noInvitationYet => 'لا تتوفر دعوة لهذا الضيف بعد.';

  @override
  String get qrCodeHint => 'امسح هذا الرمز عند المدخل لتسجيل الحضور.';

  @override
  String get checkInTitle => 'تسجيل الحضور';

  @override
  String get scanQrToCheckIn =>
      'وجّه الكاميرا نحو رمز QR الخاص بالضيف، أو أدخل الرمز أدناه.';

  @override
  String get checkedInGranted => 'تم تسجيل الحضور';

  @override
  String get checkedInOverride => 'تم تسجيل الحضور مجددًا (تجاوز)';

  @override
  String get deniedNoRsvp => 'مرفوض - لا يوجد تأكيد حضور مقبول';

  @override
  String get deniedWrongEvent => 'مرفوض - ليس فعالية اليوم';

  @override
  String get overrideCheckIn => 'تسجيل الحضور رغم ذلك';

  @override
  String get scanNext => 'مسح التالي';

  @override
  String get enterCodeManually => 'إدخال الرمز يدويًا';

  @override
  String get checkIn => 'تسجيل الحضور';

  @override
  String get confiscationsTitle => 'الأغراض المودعة';

  @override
  String get addItem => 'إضافة غرض';

  @override
  String get itemType => 'نوع الغرض';

  @override
  String get itemTypePhone => 'هاتف';

  @override
  String get itemTypeCamera => 'كاميرا';

  @override
  String get itemTypeOther => 'أخرى';

  @override
  String get itemDescriptionOptional => 'الوصف (اختياري)';

  @override
  String get storageReference => 'رقم البطاقة / الخزانة';

  @override
  String get guest => 'الضيف';

  @override
  String get selectGuest => 'اختر ضيفًا';

  @override
  String get addPhotoOptional => 'إضافة صورة (اختياري)';

  @override
  String get retakePhoto => 'إعادة التقاط الصورة';

  @override
  String get holding => 'قيد الإيداع';

  @override
  String get returned => 'تم الإرجاع';

  @override
  String get returnItem => 'إرجاع الغرض';

  @override
  String get returnedToNoteOptional => 'أُرجع إلى (اختياري)';

  @override
  String get confirmReturn => 'تأكيد الإرجاع';

  @override
  String depositedBy(String name) {
    return 'أودعه $name';
  }

  @override
  String get noConfiscationsYet => 'لا توجد أغراض مودعة بعد';

  @override
  String get selectGuestAndStorageTag => 'اختر ضيفًا وأدخل رقم بطاقة الإيداع.';

  @override
  String get viewPhoto => 'عرض الصورة';

  @override
  String get save => 'حفظ';

  @override
  String get expensesTitle => 'المصروفات';

  @override
  String get financialSummary => 'الملخص المالي';

  @override
  String get revenue => 'الإيرادات';

  @override
  String get paymentsReceived => 'المدفوعات المستلمة';

  @override
  String get outstandingBalance => 'الرصيد المستحق';

  @override
  String get expensesByCategory => 'المصروفات حسب الفئة';

  @override
  String get addExpense => 'إضافة مصروف';

  @override
  String get category => 'الفئة';

  @override
  String get selectCategory => 'اختر فئة';

  @override
  String get allCategories => 'جميع الفئات';

  @override
  String get amount => 'المبلغ';

  @override
  String get date => 'التاريخ';

  @override
  String get paymentMethod => 'طريقة الدفع';

  @override
  String get paymentMethodCash => 'نقدًا';

  @override
  String get paymentMethodBankTransfer => 'تحويل بنكي';

  @override
  String get paymentMethodCard => 'بطاقة';

  @override
  String get paymentMethodCheck => 'شيك';

  @override
  String get descriptionOptional => 'الوصف (اختياري)';

  @override
  String get noExpensesYet => 'لا توجد مصروفات مسجلة بعد';

  @override
  String get selectCategoryAndAmount => 'اختر فئة وأدخل مبلغًا.';

  @override
  String get thisMonth => 'هذا الشهر';

  @override
  String get viewExpenses => 'عرض المصروفات';

  @override
  String get employeesTitle => 'الموظفون';

  @override
  String get addEmployee => 'إضافة موظف';

  @override
  String get position => 'المنصب';

  @override
  String get baseSalary => 'الراتب الأساسي';

  @override
  String get startDate => 'تاريخ التوظيف';

  @override
  String get employmentStatus => 'حالة التوظيف';

  @override
  String get employmentStatusActive => 'نشط';

  @override
  String get employmentStatusOnLeave => 'في إجازة';

  @override
  String get employmentStatusTerminated => 'منتهي الخدمة';

  @override
  String get noEmployeesYet => 'لا يوجد موظفون بعد';

  @override
  String get payrollHistory => 'سجل الرواتب';

  @override
  String get runPayroll => 'تسيير الراتب';

  @override
  String get periodStart => 'بداية الفترة';

  @override
  String get periodEnd => 'نهاية الفترة';

  @override
  String get bonusesOptional => 'المكافآت (اختياري)';

  @override
  String get deductionsOptional => 'الخصومات (اختياري)';

  @override
  String get netPay => 'صافي الراتب';

  @override
  String get markPaid => 'تحديد كمدفوع';

  @override
  String get paymentStatusPaid => 'مدفوع';

  @override
  String get paymentStatusUnpaid => 'غير مدفوع';

  @override
  String get paymentStatusPartial => 'جزئي';

  @override
  String get noPayrollHistoryYet => 'لا يوجد سجل رواتب بعد';

  @override
  String get selectPeriod => 'اختر فترة الراتب.';

  @override
  String get fillRequiredFields => 'املأ جميع الحقول المطلوبة.';

  @override
  String get caterersTitle => 'مقدمو الطعام';

  @override
  String get addCaterer => 'إضافة مقدم طعام';

  @override
  String get servicesOffered => 'الخدمات المقدمة';

  @override
  String get assignedBookings => 'الحجوزات المسندة';

  @override
  String get noCaterersYet => 'لا يوجد مقدمو طعام بعد';

  @override
  String get suppliersTitle => 'الموردون';

  @override
  String get addSupplier => 'إضافة مورد';

  @override
  String get productsOffered => 'المنتجات المقدمة';

  @override
  String get purchaseHistory => 'سجل المشتريات';

  @override
  String get linkedEquipment => 'المعدات المرتبطة';

  @override
  String get noSuppliersYet => 'لا يوجد موردون بعد';

  @override
  String get equipmentTitle => 'المعدات';

  @override
  String get addEquipment => 'إضافة معدات';

  @override
  String get quantityTotal => 'الكمية الإجمالية';

  @override
  String get quantityAvailable => 'المتاح';

  @override
  String get locationOptional => 'الموقع (اختياري)';

  @override
  String get noEquipmentYet => 'لا توجد معدات بعد';

  @override
  String get assignEquipment => 'إسناد إلى حجز';

  @override
  String get quantity => 'الكمية';

  @override
  String get bookingIdLabel => 'معرّف الحجز';

  @override
  String get returnEquipment => 'إرجاع';

  @override
  String get assignmentHistory => 'سجل الإسناد';

  @override
  String get noAssignmentsYet => 'لا توجد إسنادات بعد';

  @override
  String get archivesTitle => 'الأرشيف';

  @override
  String get auditLogTitle => 'سجل التدقيق';

  @override
  String get allTypes => 'كل الأنواع';

  @override
  String get noArchivesYet => 'لا يوجد شيء مؤرشف بعد';

  @override
  String get noReasonGiven => 'لم يُذكر سبب';

  @override
  String get noAuditLogEntriesYet => 'لا توجد إدخالات في سجل التدقيق بعد';

  @override
  String get systemActor => 'النظام';

  @override
  String get exportCsv => 'تصدير CSV';

  @override
  String get exportPdf => 'تصدير PDF';

  @override
  String get exportFailed => 'فشل التصدير';

  @override
  String get todaysEvents => 'فعاليات اليوم';

  @override
  String get upcomingBookings => 'القادمة (7 أيام)';

  @override
  String get pendingRequests => 'الطلبات المعلّقة';

  @override
  String get itemsInCustody => 'الأغراض المحتجزة';

  @override
  String get revenueThisMonth => 'إيرادات هذا الشهر';
}
