const ar = {
  // ─── App ─────────────────────────────────
  appName: "كِيو وايز",
  appTagline: "إدارة طوابير ذكية للمؤسسات في الجزائر",

  // ─── Common ──────────────────────────────
  loading: "جاري التحميل...",
  save: "حفظ",
  cancel: "إلغاء",
  delete: "حذف",
  edit: "تعديل",
  search: "بحث",
  submit: "تأكيد",
  close: "إغلاق",
  back: "رجوع",
  next: "التالي",
  confirm: "تأكيد",
  yes: "نعم",
  no: "لا",
  success: "تم بنجاح",
  error: "حدث خطأ",
  noData: "لا توجد بيانات",
  refresh: "تحديث",
  actions: "إجراءات",
  status: "الحالة",
  date: "التاريخ",
  time: "الوقت",
  all: "الكل",
  active: "نشط",
  inactive: "غير نشط",
  pending: "قيد الانتظار",
  approved: "مقبول",
  rejected: "مرفوض",
  completed: "مكتمل",
  cancelled: "ملغى",
  viewDetails: "عرض التفاصيل",
  upload: "رفع",
  download: "تحميل",
  name: "الاسم",
  description: "الوصف",
  minutes: "دقائق",
  currency: "د.ج",
  perMonth: "/ شهرياً",

  // ─── Auth ────────────────────────────────
  login: "تسجيل الدخول",
  register: "إنشاء حساب",
  logout: "تسجيل الخروج",
  email: "البريد الإلكتروني",
  username: "اسم المستخدم",
  fullName: "الاسم الكامل",
  password: "كلمة المرور",
  confirmPassword: "تأكيد كلمة المرور",
  phoneNumber: "رقم الهاتف",
  forgotPassword: "نسيت كلمة المرور؟",
  noAccount: "ليس لديك حساب؟",
  hasAccount: "لديك حساب بالفعل؟",
  loginAsCustomer: "دخول كزبون",
  loginAsAgency: "دخول كمؤسسة",
  loginAsAdmin: "دخول كمدير",
  registerSuccess: "تم إنشاء الحساب بنجاح",
  loginSuccess: "تم تسجيل الدخول بنجاح",
  invalidCredentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
  userExists: "اسم المستخدم موجود بالفعل",
  passwordMismatch: "كلمات المرور غير متطابقة",
  requiredField: "هذا الحقل مطلوب",
  invalidPhone: "رقم الهاتف غير صالح",
  phoneOptional: "رقم الهاتف (اختياري)",
  selectRole: "اختر نوع الحساب",
  rememberMe: "تذكرني",
  orContinueWith: "أو تابع باستخدام",

  // ─── Navigation ──────────────────────────
  home: "الرئيسية",
  myQueue: "طابوري",
  history: "السجل",
  profile: "الملف الشخصي",
  dashboard: "لوحة التحكم",
  settings: "الإعدادات",
  agencies: "المؤسسات",
  reservations: "الحجوزات",
  transactions: "المعاملات",
  auditLogs: "سجل المراجعة",
  language: "اللغة",

  // ─── Customer ────────────────────────────
  welcomeTitle: "مرحباً بك في كِيو وايز",
  welcomeSubtitle: "انضم إلى الطوابير عن بُعد، لا حاجة للانتظار!",
  searchAgency: "ابحث عن مؤسسة...",
  searchByCategory: "ابحث حسب التصنيف",
  searchByService: "ابحث حسب الخدمة",
  joinQueue: "انضم للطابور",
  enterAgencyCode: "أدخل كود المؤسسة",
  agencyCodePlaceholder: "مثال: CLINIC01",
  scanQR: "امسح رمز QR",
  yourQueueNumber: "رقمك في الطابور",
  queueNumber: "رقم الدور",
  memberSince: "عضو منذ",
  peopleAhead: "أمامك",
  estimatedWait: "الوقت المتوقع للانتظار",
  currentlyServing: "يُخدم حالياً",
  queuePosition: "موقعك في الطابور",
  noActiveReservations: "لا توجد حجوزات نشطة حالياً",
  reservationJoined: "تم الانضمام للطابور بنجاح!",
  alreadyInQueue: "أنت بالفعل في هذا الطابور",
  queueClosed: "الطابور مغلق حالياً",
  queueFull: "الطابور ممتلئ حالياً",
  cancelReservation: "إلغاء الحجز",
  leaveQueue: "مغادرة الطابور",
  leaving: "جارٍ المغادرة...",
  confirmCancel: "هل أنت متأكد من إلغاء الحجز؟",
  sponsored: "ممول",
  openNow: "مفتوح الآن",
  closed: "مغلق",
  selectService: "اختر الخدمة",
  joinSuccess: "تم الانضمام بنجاح!",
  queueInfo: "معلومات الطابور",
  min: "دقيقة",
  person: "شخص",
  paused: "متوقف مؤقتاً",
  waiting: "في الانتظار",
  services: "خدمات",

  // ─── Categories ──────────────────────────
  catAll: "الكل",
  catClinic: "عيادة",
  catAgency: "وكالة",
  catLawFirm: "مكتب محاماة",
  catLaboratory: "مختبر",
  catGovernment: "إدارة حكومية",
  catOther: "أخرى",
  catFilter: "التصنيف",

  // ─── Queue Statuses ──────────────────────
  statusWaiting: "في الانتظار",
  statusCalled: "تم الاستدعاء",
  statusServed: "يتم الخدمة",
  statusCompleted: "مكتمل",
  statusCancelled: "ملغى",
  statusNoShow: "لم يحضر",

  // ─── Notifications ───────────────────────
  notifQueueJoined: "تم الانضمام للطابور",
  notifTurnApproaching: "دورك يقترب!",
  notifQueueCalled: "تم استدعاؤك!",
  notifCompleted: "تم إنهاء الخدمة",
  notifCancelled: "تم إلغاء الحجز",
  notifNoShow: "تم تسجيلك كغير حاضر",
  notifSystem: "إشعار النظام",

  // ─── SMS Wallet ──────────────────────────
  smsWallet: "محفظة الرسائل",
  freeSmsRemaining: "الرسائل المجانية المتبقية",
  buySms: "شراء رسائل",
  smsPackages: "باقات الرسائل",
  pack20Sms: "20 رسالة",
  pack50Sms: "50 رسالة",

  // ─── Agency Dashboard ────────────────────
  agencyDashboard: "لوحة تحكم المؤسسة",
  callNext: "استدعاء التالي",
  markCompleted: "تمت الخدمة",
  markNoShow: "لم يحضر",
  cancelRes: "إلغاء الحجز",
  markCancelled: "تحديد كملغي",
  pauseQueue: "إيقاف مؤقت",
  resumeQueue: "استئناف",
  queuePaused: "الطابور متوقف مؤقتاً",
  queueResumed: "تم استئناف الطابور",
  noQueue: "لا يوجد عملاء في الطابور",
  todayReservations: "حجوزات اليوم",
  avgWaitTime: "متوسط وقت الانتظار",
  servedToday: "تم خدمتهم اليوم",
  currentlyWaiting: "في الانتظار حالياً",
  queueManagement: "إدارة الطابور",
  waitingList: "قائمة الانتظار",
  currentNumber: "الرقم الحالي",

  // ─── Agency Profile ──────────────────────
  agencyProfile: "ملف المؤسسة",
  agencyName: "اسم المؤسسة",
  agencyAddress: "العنوان",
  agencyCategory: "التصنيف",
  agencyPhone: "الهاتف",
  agencyEmail: "البريد الإلكتروني",
  workingHours: "ساعات العمل",
  uploadLogo: "رفع الشعار",
  uploadCover: "رفع صورة الغلاف",
  generateQR: "إنشاء رمز QR",

  // ─── Agency Settings ─────────────────────
  avgServiceTime: "متوسط مدة الخدمة (بالدقائق)",
  maxReservations: "الحد الأقصى للحجوزات",
  queueOpen: "فتح الطابور",
  queueClosedStatus: "إغلاق الطابور",
  addService: "إضافة خدمة",
  serviceName: "اسم الخدمة",
  servicePrefix: "بادئة رقم الطابور",
  manageServices: "إدارة الخدمات",
  serviceSettings: "إعدادات الخدمات",

  // ─── Subscription ────────────────────────
  subscription: "الاشتراك",
  currentPlan: "الخطة الحالية",
  basicPlan: "الأساسية",
  premiumPlan: "المميزة",
  basicPrice: "2,000 د.ج / شهرياً",
  premiumPrice: "3,000 د.ج / شهرياً",
  basicFeatures: "إدارة الطابور • إحصائيات قياسية",
  premiumFeatures: "عرض ممول • زيادة الظهور • جذب العملاء",
  upgradePlan: "ترقية الخطة",
  submitPayment: "تقديم الدفع",
  uploadReceipt: "رفع إيصال الدفع",
  ccpTransfer: "حوالة بريدية (CCP)",
  bankTransfer: "تحويل بنكي",
  paymentPending: "قيد المراجعة",
  paymentApproved: "تمت الموافقة على الدفع",
  paymentRejected: "تم رفض الدفع",
  selectPlan: "اختر الخطة",
  paymentProof: "إثبات الدفع",
  receiptNote: "يرجى رفع إيصال الدفع بصيغة JPG أو PNG أو PDF",

  // ─── Admin Dashboard ─────────────────────
  adminDashboard: "لوحة تحكم المدير",
  systemStats: "إحصائيات النظام",
  totalAgencies: "إجمالي المؤسسات",
  activeQueues: "الطوابير النشطة",
  dailyReservations: "حجوزات اليوم",
  totalRevenue: "إجمالي الإيرادات",
  pendingTransactions: "المعاملات المعلقة",
  approveTransaction: "موافقة",
  rejectTransaction: "رفض",
  rejectionReason: "سبب الرفض",
  createAgency: "إنشاء مؤسسة",
  editAgency: "تعديل مؤسسة",
  suspendAgency: "تعليق مؤسسة",
  deleteAgency: "حذف مؤسسة",
  activateSubscription: "تفعيل الاشتراك",
  suspendSubscription: "تعليق الاشتراك",
  pendingPayments: "المدفوعات المعلقة",
  agencyManagement: "إدارة المؤسسات",
  recentActivity: "النشاط الأخير",
  reviewPayment: "مراجعة الدفع",

  // ─── Landing Page ────────────────────────
  heroTitle: "لا تنتظر في الطوابير بعد الآن",
  heroSubtitle: "انضم إلى أي طابور من هاتفك، تتبع موقعك في الوقت الحقيقي، واحصل على إشعارات عندما يحين دورك",
  getStarted: "ابدأ الآن",
  learnMore: "اعرف المزيد",
  feature1Title: "انضم عن بُعد",
  feature1Desc: "انضم إلى أي طابور من أي مكان دون الحاجة للحضور المبكر",
  feature2Title: "تتبع مباشر",
  feature2Desc: "تابع موقعك في الطابور في الوقت الحقيقي واعرف متى يحين دورك",
  feature3Title: "إشعارات فورية",
  feature3Desc: "احصل على إشعار فوري عندما يقترب دورك أو يتم استدعاؤك",
  feature4Title: "سهل الاستخدام",
  feature4Desc: "واجهة بسيطة وسهلة للجميع، حتى لأول مرة",
  howItWorks: "كيف يعمل؟",
  step1: "ابحث عن المؤسسة",
  step1Desc: "ابحث بالاسم أو الكود أو امسح رمز QR",
  step2: "انضم للطابور",
  step2Desc: "اختر الخدمة واحصل على رقمك",
  step3: "تابع وانتظر",
  step3Desc: "تابع موقعك وتلق إشعاراً عند اقتراب دورك",

  // ─── Landing Stats ────────────────────────
  landingStatAgencies: "المؤسسات",
  landingStatUsers: "مستخدم",
  landingStatLocation: "الجزائر - المسيلة",

  // ─── Notifications Center ─────────────────
  notifications: "الإشعارات",
  noNotifications: "لا توجد إشعارات",
  markAllRead: "تحديد الكل كمقروء",
  
  // ─── Audit Logs ────────────────────────────
  auditLogsPage: "سجل المراجعة",
  allLogs: "جميع السجلات",
  filterByAction: "تصفية حسب الإجراء",
  todayLogs: "سجلات اليوم",
  
  // ─── Extra ─────────────────────────────────
  searchPlaceholder: "بحث...",
  noResults: "لا توجد نتائج",
  confirmLogout: "هل أنت متأكد من تسجيل الخروج؟",
  poweredBy: "مدعوم بواسطة",
  rightsReserved: "جميع الحقوق محفوظة",
  version: "الإصدار 1.0",

  // ─── Themes ──────────────────────────────
  lightMode: "الوضع الفاتح",
  darkMode: "الوضع الداكن",
  systemTheme: "النظام",

  // ─── Testimonials ─────────────────────────
  testimonialsTitle: "ماذا يقول عملاؤنا",
  testimonial1: "لم أعد أحتاج للانتظار ساعات في العيادة. أنضم من البيت وأذهب فقط عندما يحين دوري!",
  testimonial1Name: "كريم بوعلام",
  testimonial1Role: "زبون",
  testimonial2: "المنصة سهلة الاستخدام جداً. حتى كبار السن يمكنهم استخدامها بسهولة.",
  testimonial2Name: "فاطمة الزهراء",
  testimonial2Role: "زبونة",
  testimonial3: "ساعدتني كيو وايز في تنظيم طابور العيادة بشكل أفضل. العملاء راضون جداً.",
  testimonial3Name: "د. محمد",
  testimonial3Role: "صاحب عيادة",
  trustedBy: "موثوق من قبل",
  trustedClinic: "عيادات",
  trustedLab: "مختبرات",
  trustedLaw: "محامون",
  trustedGov: "حكوميات",

  // ─── Queue Tracker ────────────────────────
  live: "مباشر",
  noHistoryYet: "لا يوجد سجل بعد",
  noHistoryCompleted: "لا توجد حجوزات مكتملة",
  noHistoryCancelled: "لا توجد حجوزات ملغاة",
  noHistoryNoShow: "لا توجد تسجيلات غياب",
  notificationTypeQueue: "طابور",
  notificationTypeSystem: "نظام",
  notificationTypeAlert: "تنبيه",
  nowServing: "يُخدم الآن",
  queueStatus: "حالة الطابور",
  queueOpenStatus: "مفتوح",
  queuePausedStatusLabel: "متوقف",
  appearance: "المظهر",
  appearanceDesc: "تخصيص مظهر التطبيق",

  // ─── Roles ──────────────────────────────
  agencyOwner: "مالك المؤسسة",
  agencyStaff: "موظف المؤسسة",
  platformAdmin: "مدير المنصة",
  superAdmin: "المدير العام",

  // ─── Accessibility ──────────────────────
  changeLanguage: "تغيير اللغة",
  toggleTheme: "تبديل المظهر",

  // ─── Agency Code ────────────────────────
  shareCodeText: "شارك هذا الكود مع عملائك",

  // ─── Bottom Nav / More Menu ──────────────
  more: "المزيد",
  moreMenuTitle: "المزيد من الخيارات",
  quickStats: "إحصائيات سريعة",
  agenciesNearby: "مؤسسات قريبة",
  activeQueuesCount: "طوابير نشطة",
  avgWaitShort: "متوسط الانتظار",
  totalServices: "إجمالي الخدمات",

  // ─── Queue Progress ──────────────────────
  yourPosition: "موقعك",
  peopleAheadOf: "أمامك في الطابور",
  estimatedTimeLeft: "الوقت المتبقي",
  yourTurnAlert: "دورك الآن!",
  yourTurnDesc: "يرجى التوجه إلى مكتب الخدمة",
  turnCalledAt: "تم الاستدعاء في",

  // ─── Agency Dashboard Enhancements ───────
  todayOverview: "نظرة عامة على اليوم",
  queueEfficiency: "كفاءة الطابور",
  serviceBreakdown: "تفصيل الخدمات",
  noServiceData: "لا توجد بيانات بعد",
  completionRate: "معدل الإنجاز",
  noShowRate: "معدل عدم الحضور",

  // ─── Admin Enhancements ──────────────────
  systemHealth: "صحة النظام",
  uptime: "وقت التشغيل",
  responseTime: "زمن الاستجابة",
  activeUsersToday: "المستخدمون النشطون اليوم",
  weeklyGrowth: "النمو الأسبوعي",
  platformVersion: "إصدار المنصة",
  lastUpdated: "آخر تحديث",

  // ─── Weekly Summary ──────────────────────
  weeklySummary: "الملخص الأسبوعي",
  thisWeek: "هذا الأسبوع",
  thisYear: "هذه السنة",
  lastWeek: "الأسبوع الماضي",
  autoRefresh: "تحديث تلقائي كل 10 ثوانٍ",

  // ─── Customer Queue ─────────────────────

  // ─── Countdown Labels ───────────────────
  hours: "ساعة",
  minutesLabel: "دقيقة",
  secondsLabel: "ثانية",

  // ─── Dashboard ──────────────────────────
  dailyActivity: "النشاط اليومي",

  // ─── Agency Profile Extras ──────────────
  agencyCode: "كود المؤسسة",
  copyLink: "نسخ الرابط",
  downloadQr: "تحميل رمز QR",
  linkCopied: "تم نسخ الرابط!",
  copied: "تم النسخ!",
  downloaded: "تم التحميل!",

  // ─── Admin Users ────────────────────────
  userManagement: "إدارة المستخدمين",
  totalUsers: "إجمالي المستخدمين",
  suspendUser: "تعليق",
  activateUser: "تفعيل",
  adminRole: "مدير",
  agencyOwnerRole: "مالك مؤسسة",
  agencyStaffRole: "موظف مؤسسة",
  customerRole: "زبون",
  suspended: "معلّق",

  // ─── Customer History ───────────────────
  bookAgain: "حجز مرة أخرى",

  // ─── QR & Notifications Extras ─────────
  shareCodeWithCustomers: "شارك هذا الكود مع عملائك للانضمام السريع",
  yourTurn: "!دورك الآن",
  turnNotifBody: 'يرجى التوجه إلى مكتب الخدمة.',
  dismissAlert: "فهمت",
  fileTooLarge: "حجم الملف يتجاوز 5 ميغابايت",
  seconds: "ثانية",

  // ─── Admin Analytics ──────────────────
  analytics: "التحليلات",
  totalReservationsAll: "إجمالي الحجوزات",
  avgWaitTimeStat: "متوسط وقت الانتظار",
  busiestDay: "أزدحم يوم",
  peakHour: "ساعة الذروة",
  registrations: "التسجيلات",
  registrationsTrend: "اتجاه التسجيلات",
  last14Days: "آخر 14 يوماً",
  topAgencies: "المؤسسات الأكثر نشاطاً",
  peakHours: "ساعات الذروة",
  hourly: "بالساعة",
  noAnalyticsData: "لا توجد بيانات تحليلية",
  downloadReport: "تحميل التقرير",
  leaderboard: "لوحة المتصدرين",

  // ─── Customer Favorites ──────────────
  favorites: "المفضلات",
  favoriteAgency: "إضافة إلى المفضلات",
  unfavoriteAgency: "إزالة من المفضلات",
  noFavoritesYet: "لا توجد مؤسسات في المفضلات بعد",
  noFavoritesDesc: "اضغط على قلب أي مؤسسة لإضافتها إلى المفضلات",
  joinFromFavorites: "انضم للطابور",

  // ─── Working Hours ──────────────────
  openUntil: "مفتوح حتى",
  closedNow: "مغلق حالياً",
  openFrom: "يفتح من",
  workingHoursStart: "بداية ساعات العمل",
  workingHoursEnd: "نهاية ساعات العمل",

  // ─── Notification Preferences ─────────
  notifPrefs: "إعدادات الإشعارات",
  notifPrefsDesc: "اختر الإشعارات التي تريد تلقيها",
  queueCalledNotif: "إشعار الاستدعاء",
  queueCalledNotifDesc: "احصل على إشعار عندما يتم استدعاء رقمك",
  turnApproachingNotif: "اقتراب الدور",
  turnApproachingNotifDesc: "تنبيه قبل دورك (3 مراكز)",
  completedNotif: "إتمام الخدمة",
  completedNotifDesc: "إشعار عند اكتمال الخدمة",

  // ─── Enhanced Register ──────────────
  algeriaPrefix: "+213",
  phoneWithPrefix: "رقم الهاتف",
  agreeTerms: "أوافق على",
  termsOfService: "شروط الاستخدام",
  andStr: "و",
  privacyPolicy: "سياسة الخ隐私",
  mustAgreeTerms: "يجب الموافقة على الشروط",
  agencyCodeField: "كود المؤسسة (اختياري)",
  agencyCodeFieldDesc: "أدخل كود المؤسسة للانضمام كموظف",
  adminSecretCode: "رمز المدير السري",
  adminCodeDesc: "مطلوب فقط لإنشاء حساب مدير",
  invalidAdminCode: "رمز المدير غير صحيح",
  passwordMinLength: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
  justNow: "الآن",
  timeAgo: "منذ",

  // ─── Slide to Confirm ──────────────
  slideToConfirm: "اسحب للتأكيد",
  pressEnterToConfirm: "اضغط Enter للتأكيد",
  confirmed: "تم التأكيد",
  notificationSoundOn: "تشغيل صوت الإشعار",
  notificationSoundOff: "إيقاف صوت الإشعار",

  // ─── Delete Account ────────────────
  deleteAccount: "حذف الحساب",
  deleteAccountDesc: "سيتم حذف حسابك وجميع بياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء.",
  deleteAccountWarning: "تحذير: هذا الإجراء لا يمكن التراجع عنه!",
  irreversibleActions: "إجراءات لا رجعة فيها",
  typeDeleteToConfirm: "اكتب \"حذف\" للتأكيد",
  accountDeleted: "تم حذف الحساب بنجاح",
  deleteAccountError: "لا يمكن حذف الحساب",

  unsavedChanges: "لديك تغييرات غير محفوظة",
  account: "الحساب",
  reviewInfo: "مراجعة المعلومات",

  // ─── Date Selection ────────────────
  selectDate: "اختر التاريخ",
  reserveForDate: "احجز لتاريخ",
  today: "اليوم",
  tomorrow: "غداً",
  pickDate: "اختر تاريخاً",
  reservedFor: "محجوز لـ",
  noDateSelected: "لم يتم اختيار تاريخ",

  // ─── Misc Labels ────────────────────
  popular: "الأكثر شعبية",
  todayLabel: "حجوزات اليوم",
  confirmDeleteAgency: "هل أنت متأكد أنك تريد حذف هذه الوكالة؟ لا يمكن التراجع عن هذا الإجراء.",

  // ─── Role Labels ──────────────────────
  staffRole: "موظف",
  ownerRole: "مالك",

  // ─── Feature Badges ─────────────────────
  comingSoon: 'قريباً',

  // ─── Auth Role Errors ──────────────────
  wrongRoleError: 'هذا الحساب لا يناسب الدور المحدد',

  // ─── Feature 1: Queue Auto-Refresh ──────
  refreshInterval: 'فاصل التحديث',
  refreshEvery: 'تحديث كل',
  updatedAgo: 'آخر تحديث',
  off: 'إيقاف',
  seconds5: '5 ثوانٍ',
  seconds10: '10 ثوانٍ',
  seconds30: '30 ثانية',

  // ─── Feature 2: Today's Summary ─────────
  todaySummary: 'ملخص اليوم',
  peakHourToday: 'ساعة الذروة اليوم',

  // ─── Feature 3: Nearby Agencies ─────────
  nearby: 'قريبة',
  nearbyAgencies: 'مؤسسات قريبة منك',

  // ─── Feature 4: Quick Actions ────────────
  quickActions: 'إجراءات سريعة',
  addNewAgency: 'إضافة مؤسسة',
  viewAnalytics: 'عرض التحليلات',
  manageUsers: 'إدارة المستخدمين',
  viewTransactions: 'عرض المعاملات',

  // ─── Feature 5: Queue Capacity ───────────
  queueCapacity: 'سعة الطابور',
  maxActiveReservations: 'الحد الأقصى للحجوزات النشطة',
  autoPause: 'إيقاف تلقائي',
  autoPauseDesc: 'إيقاف الطابور تلقائياً عند امتلاء السعة',
  estServiceTime: 'مدة الخدمة المقدرة (بالدقائق)',

  // ─── Feature 6: Customer Stats ──────────
  myStats: 'إحصائياتي',
  totalQueuesJoined: 'إجمالي الطوابير',
  avgWaitTimeExperienced: 'متوسط الانتظار',
  favoriteAgencyStat: 'المؤسسة المفضلة',
  thisMonth: 'هذا الشهر',

  // ─── Feature 1: Turn Overlay ────────────
  itsYourTurn: '!دورك الآن',
  tapToDismiss: 'اضغط للإغلاق',
  proceedToCounter: 'يرجى التوجه إلى مكتب الخدمة',
  vibrationEffect: 'اهتزاز',

  // ─── Feature 2: Activity Feed ───────────
  liveFeed: 'البث المباشر',
  customerJoinedQueue: '{name} انضم للطابور',
  customerWasCalled: '{name} تم استدعاؤه',
  customerCompletedService: '{name} أكمل الخدمة',
  customerCancelledRes: '{name} ألغى الحجز',
  noRecentActivity: 'لا يوجد نشاط حديث',

  // ─── Feature 3: Search Suggestions ──────
  recentSearches: 'عمليات البحث الأخيرة',
  clearAll: 'مسح الكل',
  clearSearch: 'مسح',
  suggestions: 'اقتراحات',
  noSuggestions: 'لا توجد اقتراحات',

  // ─── Feature 4: Enhanced User Mgmt ──────
  viewProfile: 'عرض الملف الشخصي',
  phone: 'الهاتف',
  agencyCol: 'المؤسسة',
  noAgency: 'لا توجد مؤسسة',
  suspendUserFull: 'تعليق المستخدم',
  reactivateUserFull: 'إعادة تفعيل المستخدم',
  roleFilter: 'تصفية حسب الدور',

  // ─── Feature 5: Mark All Read ───────────
  allRead: '✓ الكل مقروء',
  markAllReadSuccess: 'تم تحديد جميع الإشعارات كمقروءة',

  // ─── Feature 6: Social Sharing ──────────
  shareOnWhatsApp: 'مشاركة عبر واتساب',
  shareOnTelegram: 'مشاركة عبر تيليغرام',
  shareOnFacebook: 'مشاركة عبر فيسبوك',
  downloadQrComingSoon: 'تحميل رمز QR',
  copyLinkToast: '!تم نسخ الرابط',
  shareAgency: 'مشاركة المؤسسة',
  sharePosition: 'مشاركة موقعي',

  // ─── Styling Polish Keys ─────────────
  systemUptime: 'النظام يعمل',
  emptyHistoryMsg: 'ستظهر حجوزاتك السابقة هنا',
  recommended: 'موصى به',
  basicToPremium: 'المزيد من الميزات مع الخطة المميزة',
  forgotPasswordHelp: 'هل نسيت كلمة المرور؟',
  landingCarouselTitle: 'آراء عملائنا',
  carouselDot: 'الانتقال للشهادة',

  // ─── Feature: Wait Time Prediction ─────
  remainingTime: 'الوقت المتبقي',

  // ─── Feature: Bulk Queue Actions ─────
  batchMode: 'وضع الدُفعة',
  completeSelected: 'إتمام المحدد',
  selected: 'محدد',
  exitBatchMode: 'إنهاء وضع الدُفعة',
  selectTickets: 'اختر التذاكر',

  // ─── Feature: System Announcements ─────
  systemAnnouncements: 'إعلانات النظام',
  announcement: 'إعلان',
  pinned: 'مثبّت',
  dismiss: 'إغلاق',

  // ─── Feature: QR Code Sharing ─────
  shareViaQR: 'مشاركة عبر QR',
  qrCodeTitle: 'رمز QR للموقع',
  downloadQR: 'تحميل رمز QR',
  qrCodeDesc: 'امسح هذا الرمز لمتابعة حالة الحجز',

  // ─── Feature: Queue Status Widget ─────
  lowWait: 'انتظار قليل',
  mediumWait: 'انتظار متوسط',
  highWait: 'انتظار طويل',

  // ─── Feature: Emergency Cancel ─────
  emergencyCancel: 'إلغاء طوارئ',
  emergencyCancelDesc: 'هل أنت متأكد أنك تريد إلغاء حجزك فوراً؟ لا يمكن التراجع عن هذا الإجراء.',
  emergencyCancelConfirm: 'نعم، إلغاء الحجز',

  // ─── Leave Queue ─────────────
  leaveQueueConfirm: 'هل أنت متأكد أنك تريد مغادرة الطابور؟ سيتم إلغاء حجزك الحالي.',
  leaveQueueDesc: 'سيتم فقدان موقعك في الطابور ولن تتمكن من استعادته.',
  queueLeft: 'تم مغادرة الطابور بنجاح',

  // ─── Admin Reset Password ─────────────
  resetPassword: 'إعادة تعيين كلمة المرور',
  resetPasswordConfirm: 'هل أنت متأكد من إعادة تعيين كلمة المرور لهذا المستخدم؟ سيتم تعيين كلمة مرور افتراضية.',
  passwordReset: 'تم إعادة تعيين كلمة المرور',
  newPasswordIs: 'كلمة المرور الجديدة هي',

  // ─── Agency Rating ─────────────
  rateExperience: 'قيّم تجربتك',
  rateSubmitted: 'شكراً لتقييمك!',
  yourRating: 'تقييمك',

  // ─── Agency Announcements ──────
  announcements: 'الإعلانات',
  addAnnouncement: 'إضافة إعلان',
  announcementMessage: 'الرسالة',
  announcementType: 'النوع',
  announcementInfo: 'معلومة',
  announcementWarning: 'تحذير',
  announcementUrgent: 'عاجل',
  announcementCreated: 'تم إنشاء الإعلان',
  announcementDeleted: 'تم حذف الإعلان',
  announcementPlaceholder: 'اكتب إعلاناً لعملائك...',
  noAnnouncements: 'لا توجد إعلانات',
  agencyAnnouncement: 'إعلان المؤسسة',

  // ─── CSV Export ────────────────
  exportCsv: 'تصدير CSV',
  exportAgencies: 'تصدير المؤسسات (CSV)',
  exportUsers: 'تصدير المستخدمين (CSV)',
  exportSuccess: 'بدأ التصدير',
  exportFailed: 'فشل التصدير',

  // ─── Phase 17: Wait Time Chart ──────
  waitTimeChart: 'وقت الانتظار اليوم',
  waitTimeMinutes: 'دقيقة',
  hourlyData: 'بيانات بالساعة',
  avgServiceTimeLabel: 'متوسط مدة الخدمة',
  throughputLabel: 'معدل الإنجاز',
  customersPerHour: 'زبون/ساعة',

  // ─── Phase 17: Customer Growth ──────
  customerGrowth: 'نمو العملاء',
  newCustomers: 'عملاء جدد',
  totalCustomers: 'إجمالي العملاء',
  growthRate: 'معدل النمو',
  monthOverMonth: 'شهر بشهر',

  // ─── Phase 17: Queue Insights ──────
  queueInsights: 'رؤى الطابور',
  averageServiceDuration: 'متوسط مدة الخدمة',
  fastestService: 'أسرع خدمة',
  slowestService: 'أبطأ خدمة',
  waitTimeTrend: 'اتجاه وقت الانتظار',
  improving: 'يتحسن',
  worsening: 'يتدهور',
  stable: 'مستقر',

  // ─── Phase 17: Enhanced Dashboard ──────
  performanceOverview: 'نظرة عامة على الأداء',
  realTimeMetrics: 'مقاييس في الوقت الحقيقي',
  dailySummary: 'ملخص اليوم',
  weeklyComparison: 'مقارنة أسبوعية',
  monthlyReport: 'التقرير الشهري',
  servicePerformance: 'أداء الخدمات',
  staffPerformance: 'أداء الموظفين',
  customerSatisfaction: 'رضا العملاء',
  averageRating: 'متوسط التقييم',
  totalRatings: 'إجمالي التقييمات',
  ratingDistribution: 'توزيع التقييمات',
};

export default ar;
export type TranslationKeys = keyof typeof ar;
