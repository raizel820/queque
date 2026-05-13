import type { TranslationKeys } from './ar';

const en: Record<TranslationKeys, string> = {
  // ─── App ─────────────────────────────────
  appName: "QueueWise",
  appTagline: "Smart Queue Management for Businesses in Algeria",

  // ─── Common ──────────────────────────────
  loading: "Loading...",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  search: "Search",
  submit: "Submit",
  close: "Close",
  back: "Back",
  next: "Next",
  confirm: "Confirm",
  yes: "Yes",
  no: "No",
  success: "Success",
  error: "Error",
  noData: "No data",
  refresh: "Refresh",
  actions: "Actions",
  status: "Status",
  date: "Date",
  time: "Time",
  all: "All",
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
  viewDetails: "View Details",
  upload: "Upload",
  download: "Download",
  name: "Name",
  description: "Description",
  minutes: "minutes",
  currency: "DZD",
  perMonth: "/ month",

  // ─── Auth ────────────────────────────────
  login: "Login",
  register: "Register",
  logout: "Logout",
  email: "Email",
  username: "Username",
  fullName: "Full Name",
  password: "Password",
  confirmPassword: "Confirm Password",
  phoneNumber: "Phone Number",
  forgotPassword: "Forgot password?",
  noAccount: "Don't have an account?",
  hasAccount: "Already have an account?",
  loginAsCustomer: "Login as Customer",
  loginAsAgency: "Login as Agency",
  loginAsAdmin: "Login as Admin",
  registerSuccess: "Account created successfully",
  loginSuccess: "Login successful",
  invalidCredentials: "Invalid username or password",
  userExists: "Username already exists",
  passwordMismatch: "Passwords do not match",
  requiredField: "This field is required",
  invalidPhone: "Invalid phone number",
  phoneOptional: "Phone (optional)",
  selectRole: "Select account type",
  rememberMe: "Remember me",
  orContinueWith: "Or continue with",

  // ─── Navigation ──────────────────────────
  home: "Home",
  myQueue: "My Queue",
  history: "History",
  profile: "Profile",
  dashboard: "Dashboard",
  settings: "Settings",
  agencies: "Agencies",
  reservations: "Reservations",
  transactions: "Transactions",
  auditLogs: "Audit Logs",
  language: "Language",

  // ─── Customer ────────────────────────────
  welcomeTitle: "Welcome to QueueWise",
  welcomeSubtitle: "Join queues remotely, no need to wait in line!",
  searchAgency: "Search for an agency...",
  searchByCategory: "Search by category",
  searchByService: "Search by service",
  joinQueue: "Join Queue",
  enterAgencyCode: "Enter agency code",
  agencyCodePlaceholder: "e.g. CLINIC01",
  scanQR: "Scan QR Code",
  yourQueueNumber: "Your Queue Number",
  queueNumber: "Queue Number",
  memberSince: "Member Since",
  peopleAhead: "people ahead",
  estimatedWait: "Estimated Wait Time",
  currentlyServing: "Currently Serving",
  queuePosition: "Your Position",
  noActiveReservations: "No active reservations",
  reservationJoined: "Successfully joined the queue!",
  alreadyInQueue: "You are already in this queue",
  queueClosed: "Queue is currently closed",
  queueFull: "Queue is currently full",
  cancelReservation: "Cancel Reservation",
  leaveQueue: "Leave Queue",
  leaveQueueConfirm: "Are you sure you want to leave the queue?",
  leaveQueueDesc: "Your reservation will be cancelled and you won't be able to recover it.",
  queueLeft: "You have left the queue successfully",
  leaving: "Leaving...",
  confirmCancel: "Are you sure you want to cancel?",
  sponsored: "Sponsored",
  openNow: "Open Now",
  closed: "Closed",
  selectService: "Select Service",
  joinSuccess: "Successfully joined!",
  queueInfo: "Queue Info",
  min: "min",
  person: "person",
  paused: "Paused",
  waiting: "waiting",
  services: "services",

  // ─── Categories ──────────────────────────
  catAll: "All",
  catClinic: "Clinic",
  catAgency: "Agency",
  catLawFirm: "Law Firm",
  catLaboratory: "Laboratory",
  catGovernment: "Government",
  catOther: "Other",
  catFilter: "Category",

  // ─── Queue Statuses ──────────────────────
  statusWaiting: "Waiting",
  statusCalled: "Called",
  statusServed: "Being Served",
  statusCompleted: "Completed",
  statusCancelled: "Cancelled",
  statusNoShow: "No Show",

  // ─── Notifications ───────────────────────
  notifQueueJoined: "Queue joined",
  notifTurnApproaching: "Your turn is approaching!",
  notifQueueCalled: "You're being called!",
  notifCompleted: "Service completed",
  notifCancelled: "Reservation cancelled",
  notifNoShow: "Marked as no-show",
  notifSystem: "System notification",

  // ─── SMS Wallet ──────────────────────────
  smsWallet: "SMS Wallet",
  freeSmsRemaining: "Free SMS Remaining",
  buySms: "Buy SMS",
  smsPackages: "SMS Packages",
  pack20Sms: "20 SMS",
  pack50Sms: "50 SMS",

  // ─── Agency Dashboard ────────────────────
  agencyDashboard: "Agency Dashboard",
  callNext: "Call Next",
  markCompleted: "Completed",
  markNoShow: "No Show",
  cancelRes: "Cancel",
  markCancelled: "Mark Cancelled",
  pauseQueue: "Pause",
  resumeQueue: "Resume",
  queuePaused: "Queue paused",
  queueResumed: "Queue resumed",
  noQueue: "No customers in queue",
  todayReservations: "Today's Reservations",
  avgWaitTime: "Avg. Wait Time",
  servedToday: "Served Today",
  currentlyWaiting: "Currently Waiting",
  queueManagement: "Queue Management",
  waitingList: "Waiting List",
  currentNumber: "Current Number",

  // ─── Agency Profile ──────────────────────
  agencyProfile: "Agency Profile",
  agencyName: "Agency Name",
  agencyAddress: "Address",
  agencyCategory: "Category",
  agencyPhone: "Phone",
  agencyEmail: "Email",
  workingHours: "Working Hours",
  uploadLogo: "Upload Logo",
  uploadCover: "Upload Cover",
  generateQR: "Generate QR Code",

  // ─── Agency Settings ─────────────────────
  avgServiceTime: "Avg. Service Time (minutes)",
  maxReservations: "Max Active Reservations",
  queueOpen: "Open Queue",
  queueClosedStatus: "Close Queue",
  addService: "Add Service",
  serviceName: "Service Name",
  servicePrefix: "Queue Number Prefix",
  manageServices: "Manage Services",
  serviceSettings: "Service Settings",

  // ─── Subscription ────────────────────────
  subscription: "Subscription",
  currentPlan: "Current Plan",
  basicPlan: "Basic",
  premiumPlan: "Premium",
  basicPrice: "2,000 DZD / month",
  premiumPrice: "3,000 DZD / month",
  basicFeatures: "Queue management • Standard analytics",
  premiumFeatures: "Sponsored placement • Increased visibility • Lead generation",
  upgradePlan: "Change Plan",
  submitPayment: "Submit Payment",
  uploadReceipt: "Upload Receipt",
  ccpTransfer: "CCP Transfer",
  bankTransfer: "Bank Transfer",
  paymentPending: "Pending verification",
  paymentApproved: "Payment approved",
  paymentRejected: "Payment rejected",
  selectPlan: "Select Plan",
  paymentProof: "Payment Proof",
  receiptNote: "Please upload your receipt in JPG, PNG or PDF format",

  // ─── Admin Dashboard ─────────────────────
  adminDashboard: "Admin Dashboard",
  systemStats: "System Statistics",
  totalAgencies: "Total Agencies",
  activeQueues: "Active Queues",
  dailyReservations: "Daily Reservations",
  totalRevenue: "Total Revenue",
  pendingTransactions: "Pending Transactions",
  approveTransaction: "Approve",
  rejectTransaction: "Reject",
  rejectionReason: "Rejection Reason",
  createAgency: "Create Agency",
  editAgency: "Edit Agency",
  suspendAgency: "Suspend Agency",
  deleteAgency: "Delete Agency",
  activateSubscription: "Activate Subscription",
  suspendSubscription: "Suspend Subscription",
  pendingPayments: "Pending Payments",
  agencyManagement: "Agency Management",
  recentActivity: "Recent Activity",
  reviewPayment: "Review Payment",

  // ─── Landing Page ────────────────────────
  heroTitle: "No More Waiting in Lines",
  heroSubtitle: "Join any queue from your phone, track your position in real time, and get notified when it's your turn",
  getStarted: "Get Started",
  learnMore: "Learn More",
  feature1Title: "Join Remotely",
  feature1Desc: "Join any queue from anywhere without arriving early",
  feature2Title: "Live Tracking",
  feature2Desc: "Track your queue position in real time",
  feature3Title: "Instant Notifications",
  feature3Desc: "Get notified when your turn approaches",
  feature4Title: "Easy to Use",
  feature4Desc: "Simple and intuitive for everyone",
  howItWorks: "How It Works",
  step1: "Find the Agency",
  step1Desc: "Search by name, code, or scan QR",
  step2: "Join the Queue",
  step2Desc: "Select a service and get your number",
  step3: "Track & Wait",
  step3Desc: "Track your position and get notified",

  // ─── Landing Stats ────────────────────────
  landingStatAgencies: "Agencies",
  landingStatUsers: "Users Served",
  landingStatLocation: "Algeria - M'Sila",

  // ─── Notifications Center ─────────────────
  notifications: "Notifications",
  noNotifications: "No notifications",
  noNotificationsDesc: "Notifications about your queue status will appear here",
  markAllRead: "Mark all as read",
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
  veryStrong: "Very Strong",
  usernameMinLength: "Username must be at least 3 characters",
  landingLocation: "M'Sila",
  
  // ─── Audit Logs ────────────────────────────
  auditLogsPage: "Audit Logs",
  allLogs: "All Logs",
  filterByAction: "Filter by action",
  todayLogs: "Today's Logs",
  
  // ─── Extra ─────────────────────────────────
  searchPlaceholder: "Search...",
  noResults: "No results found",
  confirmLogout: "Are you sure you want to logout?",
  poweredBy: "Powered by",
  rightsReserved: "All rights reserved",
  version: "Version 1.0",

  // ─── Themes ──────────────────────────────
  lightMode: "Light Mode",
  darkMode: "Dark Mode",
  systemTheme: "System",

  // ─── Testimonials ─────────────────────────
  testimonialsTitle: "What Our Customers Say",
  testimonial1: "No more waiting hours at the clinic. I join from home and go when it's my turn!",
  testimonial1Name: "Karim B.",
  testimonial1Role: "Customer",
  testimonial2: "The platform is very easy to use. Even elderly people can use it easily.",
  testimonial2Name: "Fatima Z.",
  testimonial2Role: "Customer",
  testimonial3: "QueueWise helped me organize the clinic queue better. Customers are very satisfied.",
  testimonial3Name: "Dr. Mohamed",
  testimonial3Role: "Clinic Owner",
  trustedBy: "Trusted By",
  trustedClinic: "Clinics",
  trustedLab: "Labs",
  trustedLaw: "Lawyers",
  trustedGov: "Government",

  // ─── Queue Tracker ────────────────────────
  live: "Live",
  noHistoryYet: "No history yet",
  noHistoryCompleted: "No completed reservations",
  noHistoryCancelled: "No cancelled reservations",
  noHistoryNoShow: "No no-show records",
  notificationTypeQueue: "Queue",
  notificationTypeSystem: "System",
  notificationTypeAlert: "Alert",
  nowServing: "Now Serving",
  queueStatus: "Queue Status",
  queueOpenStatus: "Open",
  queuePausedStatusLabel: "Paused",
  appearance: "Appearance",
  appearanceDesc: "Customize the app appearance",

  // ─── Roles ──────────────────────────────
  agencyOwner: "Agency Owner",
  agencyStaff: "Agency Staff",
  platformAdmin: "Platform Admin",
  superAdmin: "Super Admin",

  // ─── Accessibility ──────────────────────
  changeLanguage: "Change language",
  toggleTheme: "Toggle theme",

  // ─── Agency Code ────────────────────────
  shareCodeText: "Share this code with your customers",

  // ─── Bottom Nav / More Menu ──────────────
  more: "More",
  moreMenuTitle: "More Options",
  quickStats: "Quick Stats",
  agenciesNearby: "Agencies Nearby",
  activeQueuesCount: "Active Queues",
  avgWaitShort: "Avg Wait",
  totalServices: "Total Services",

  // ─── Queue Progress ──────────────────────
  yourPosition: "Your Position",
  peopleAheadOf: "people ahead",
  estimatedTimeLeft: "Time Left",
  yourTurnAlert: "IT'S YOUR TURN!",
  yourTurnDesc: "Please proceed to the service counter",
  turnCalledAt: "Called at",

  // ─── Agency Dashboard Enhancements ───────
  todayOverview: "Today's Overview",
  queueEfficiency: "Queue Efficiency",
  serviceBreakdown: "Service Breakdown",
  noServiceData: "No service data yet",
  completionRate: "Completion Rate",
  noShowRate: "No-Show Rate",

  // ─── Admin Enhancements ──────────────────
  systemHealth: "System Health",
  uptime: "Uptime",
  responseTime: "Response Time",
  activeUsersToday: "Active Users Today",
  weeklyGrowth: "Weekly Growth",
  platformVersion: "Platform Version",
  lastUpdated: "Last Updated",

  // ─── Weekly Summary ──────────────────────
  weeklySummary: "Weekly Summary",
  thisWeek: "This Week",
  thisYear: "This Year",
  lastWeek: "Last Week",
  autoRefresh: "Auto-refreshing every 10s",

  // ─── Customer Queue ─────────────────────

  // ─── Countdown Labels ───────────────────
  hours: "Hours",
  minutesLabel: "Minutes",
  secondsLabel: "Seconds",

  // ─── Dashboard ──────────────────────────
  dailyActivity: "Daily Activity",

  // ─── Agency Profile Extras ──────────────
  agencyCode: "Agency Code",
  copyLink: "Copy Link",
  downloadQr: "Download QR",
  linkCopied: "Link copied!",
  copied: "Copied!",
  downloaded: "Downloaded!",

  // ─── Admin Users ────────────────────────
  userManagement: "User Management",
  totalUsers: "Total Users",
  suspendUser: "Suspend",
  activateUser: "Activate",
  adminRole: "Admin",
  agencyOwnerRole: "Agency Owner",
  agencyStaffRole: "Agency Staff",
  customerRole: "Customer",
  suspended: "Suspended",

  // ─── Customer History ───────────────────
  bookAgain: "Book Again",

  // ─── QR & Notifications Extras ─────────
  shareCodeWithCustomers: "Share this code with your customers for quick access",
  yourTurn: "Your Turn!",
  turnNotifBody: 'Please proceed to the service counter.',
  dismissAlert: "Got it",
  fileTooLarge: "File size exceeds 5 MB limit",
  seconds: "Seconds",

  // ─── Admin Analytics ──────────────────
  analytics: "Analytics",
  totalReservationsAll: "Total Reservations",
  avgWaitTimeStat: "Avg. Wait Time",
  busiestDay: "Busiest Day",
  peakHour: "Peak Hour",
  registrations: "Registrations",
  registrationsTrend: "Registrations Trend",
  last14Days: "Last 14 days",
  topAgencies: "Top Agencies",
  peakHours: "Peak Hours",
  hourly: "Hourly",
  noAnalyticsData: "No analytics data available",
  downloadReport: "Download Report",
  leaderboard: "Leaderboard",

  // ─── Customer Favorites ──────────────
  favorites: "Favorites",
  favoriteAgency: "Add to Favorites",
  unfavoriteAgency: "Remove from Favorites",
  noFavoritesYet: "No favorites yet",
  noFavoritesDesc: "Tap the heart on any agency to add it to your favorites",
  joinFromFavorites: "Join Queue",

  // ─── Working Hours ──────────────────
  openUntil: "Open Until",
  closedNow: "Currently Closed",
  openFrom: "Open From",
  workingHoursStart: "Working Hours Start",
  workingHoursEnd: "Working Hours End",

  // ─── Notification Preferences ─────────
  notifPrefs: "Notification Preferences",
  notifPrefsDesc: "Choose which notifications you want to receive",
  queueCalledNotif: "Called Notification",
  queueCalledNotifDesc: "Get notified when your queue number is called",
  turnApproachingNotif: "Turn Approaching",
  turnApproachingNotifDesc: "Alert before your turn (3 positions away)",
  completedNotif: "Completed",
  completedNotifDesc: "Notification when service is completed",

  // ─── Enhanced Register ──────────────
  algeriaPrefix: "+213",
  phoneWithPrefix: "Phone Number",
  agreeTerms: "I agree to the",
  termsOfService: "Terms of Service",
  andStr: "and",
  privacyPolicy: "Privacy Policy",
  mustAgreeTerms: "You must agree to the terms",
  agencyCodeField: "Agency Code (optional)",
  agencyCodeFieldDesc: "Enter agency code to join as staff",
  adminSecretCode: "Secret Admin Code",
  adminCodeDesc: "Required only for admin account creation",
  invalidAdminCode: "Invalid admin code",
  passwordMinLength: "Password must be at least 6 characters",
  justNow: "just now",
  timeAgo: "ago",

  // ─── Slide to Confirm ──────────────
  slideToConfirm: "Slide to confirm",
  pressEnterToConfirm: "Press Enter to confirm",
  confirmed: "Confirmed",
  notificationSoundOn: "Notification sound on",
  notificationSoundOff: "Notification sound off",

  // ─── Delete Account ────────────────
  deleteAccount: "Delete Account",
  deleteAccountDesc: "Your account and all data will be permanently deleted. This action cannot be undone.",
  deleteAccountWarning: "Warning: This action cannot be undone!",
  irreversibleActions: "Irreversible Actions",
  typeDeleteToConfirm: 'Type "delete" to confirm',
  accountDeleted: "Account deleted successfully",
  deleteAccountError: "Cannot delete account",

  unsavedChanges: "You have unsaved changes",
  account: "Account",
  reviewInfo: "Review Information",

  // ─── Date Selection ────────────────
  selectDate: "Select Date",
  reserveForDate: "Reserve for Date",
  today: "Today",
  tomorrow: "Tomorrow",
  pickDate: "Pick a date",
  reservedFor: "Reserved for",
  noDateSelected: "No date selected",

  // ─── Misc Labels ────────────────────
  popular: "Popular",
  todayLabel: "reservations today",
  confirmDeleteAgency: "Are you sure you want to delete this agency? This action cannot be undone.",

  // ─── Role Labels ──────────────────────
  staffRole: "Staff",
  ownerRole: "Owner",

  // ─── Feature Badges ─────────────────────
  comingSoon: "Coming Soon",

  // ─── Auth Role Errors ──────────────────
  wrongRoleError: "This account does not match the selected role",

  // ─── Feature 1: Queue Auto-Refresh ──────
  refreshInterval: "Refresh Interval",
  refreshEvery: "Refresh every",
  updatedAgo: "Updated",
  off: "Off",
  seconds5: "5s",
  seconds10: "10s",
  seconds30: "30s",

  // ─── Feature 2: Today's Summary ─────────
  todaySummary: "Today's Summary",
  peakHourToday: "Peak Hour Today",

  // ─── Feature 3: Nearby Agencies ─────────
  nearby: "Nearby",
  nearbyAgencies: "Nearby Agencies",

  // ─── Feature 4: Quick Actions ────────────
  quickActions: "Quick Actions",
  addNewAgency: "Add Agency",
  viewAnalytics: "View Analytics",
  manageUsers: "Manage Users",
  viewTransactions: "View Transactions",

  // ─── Feature 5: Queue Capacity ───────────
  queueCapacity: "Queue Capacity",
  maxActiveReservations: "Max Active Reservations",
  autoPause: "Auto-Pause",
  autoPauseDesc: "Automatically pause queue when capacity is full",
  estServiceTime: "Est. Service Time (minutes)",

  // ─── Feature 6: Customer Stats ──────────
  myStats: "My Queue Stats",
  totalQueuesJoined: "Total Queues Joined",
  avgWaitTimeExperienced: "Avg. Wait Time",
  favoriteAgencyStat: "Favorite Agency",
  thisMonth: "This Month",

  // ─── Feature 1: Turn Overlay ────────────
  itsYourTurn: "IT'S YOUR TURN!",
  tapToDismiss: "Tap to dismiss",
  proceedToCounter: "Please proceed to the service counter",
  vibrationEffect: "Vibrate",

  // ─── Feature 2: Activity Feed ───────────
  liveFeed: "Live Feed",
  customerJoinedQueue: "{name} joined the queue",
  customerWasCalled: "{name} was called",
  customerCompletedService: "{name} completed service",
  customerCancelledRes: "{name} cancelled",
  noRecentActivity: "No recent activity",

  // ─── Feature 3: Search Suggestions ──────
  recentSearches: "Recent Searches",
  clearAll: "Clear All",
  clearSearch: "Clear",
  suggestions: "Suggestions",
  noSuggestions: "No suggestions found",

  // ─── Feature 4: Enhanced User Mgmt ──────
  viewProfile: "View Profile",
  phone: "Phone",
  agencyCol: "Agency",
  noAgency: "No agency",
  suspendUserFull: "Suspend User",
  reactivateUserFull: "Reactivate User",
  roleFilter: "Role Filter",

  // ─── Feature 5: Mark All Read ───────────
  allRead: "All read ✓",
  markAllReadSuccess: "All notifications marked as read",

  // ─── Feature 6: Social Sharing ──────────
  shareOnWhatsApp: "Share on WhatsApp",
  shareOnTelegram: "Share on Telegram",
  shareOnFacebook: "Share on Facebook",
  downloadQrComingSoon: "Download QR Code",
  copyLinkToast: "Link copied to clipboard!",
  shareAgency: "Share Agency",
  sharePosition: "Share My Position",

  // ─── Styling Polish Keys ─────────────
  systemUptime: "System Online",
  emptyHistoryMsg: "Your past reservations will appear here",
  recommended: "Recommended",
  basicToPremium: "More features with Premium",
  forgotPasswordHelp: "Forgot password?",
  landingCarouselTitle: "What Our Customers Say",
  carouselDot: "Go to testimonial",

  // ─── Feature: Wait Time Prediction ─────
  remainingTime: "Remaining Time",

  // ─── Feature: Bulk Queue Actions ─────
  batchMode: "Batch Mode",
  completeSelected: "Complete Selected",
  selected: "selected",
  exitBatchMode: "Exit Batch Mode",
  selectTickets: "Select tickets",

  // ─── Feature: System Announcements ─────
  systemAnnouncements: "System Announcements",
  announcement: "Announcement",
  pinned: "Pinned",
  dismiss: "Dismiss",

  // ─── Feature: QR Code Sharing ─────
  shareViaQR: "Share via QR",
  qrCodeTitle: "QR Code",
  downloadQR: "Download QR",
  qrCodeDesc: "Scan this code to track your reservation status",

  // ─── Feature: Queue Status Widget ─────
  lowWait: "Low wait",
  mediumWait: "Medium wait",
  highWait: "High wait",

  // ─── Feature: Emergency Cancel ─────
  emergencyCancel: "Emergency Cancel",
  emergencyCancelDesc: "Are you sure you want to cancel your reservation immediately? This action cannot be undone.",
  emergencyCancelConfirm: "Yes, cancel my reservation",

  // ─── Admin Reset Password ─────────────
  resetPassword: "Reset Password",
  resetPasswordConfirm: "Are you sure you want to reset this user's password? A default password will be set.",
  passwordReset: "Password has been reset",
  newPasswordIs: "The new password is",

  // ─── Agency Rating ─────────────
  rateExperience: "Rate your experience",
  rateSubmitted: "Thanks for your rating!",
  yourRating: "Your rating",

  // ─── Agency Announcements ──────
  announcements: "Announcements",
  addAnnouncement: "Add Announcement",
  announcementMessage: "Message",
  announcementType: "Type",
  announcementInfo: "Info",
  announcementWarning: "Warning",
  announcementUrgent: "Urgent",
  announcementCreated: "Announcement created",
  announcementDeleted: "Announcement deleted",
  announcementPlaceholder: "Write an announcement for your customers...",
  noAnnouncements: "No announcements",
  agencyAnnouncement: "Agency Announcement",

  // ─── CSV Export ────────────────
  exportCsv: "Export CSV",
  exportAgencies: "Export Agencies (CSV)",
  exportUsers: "Export Users (CSV)",
  exportSuccess: "Export started",
  exportFailed: "Export failed",

  // ─── Phase 17: Wait Time Chart ──────
  waitTimeChart: "Wait Time Today",
  waitTimeMinutes: "min",
  hourlyData: "Hourly Data",
  avgServiceTimeLabel: "Avg Service Time",
  throughputLabel: "Throughput",
  customersPerHour: "customers/hr",

  // ─── Phase 17: Customer Growth ──────
  customerGrowth: "Customer Growth",
  newCustomers: "New Customers",
  totalCustomers: "Total Customers",
  growthRate: "Growth Rate",
  monthOverMonth: "Month over Month",

  // ─── Phase 17: Queue Insights ──────
  queueInsights: "Queue Insights",
  averageServiceDuration: "Avg. Service Duration",
  fastestService: "Fastest Service",
  slowestService: "Slowest Service",
  waitTimeTrend: "Wait Time Trend",
  improving: "Improving",
  worsening: "Worsening",
  stable: "Stable",

  // ─── Phase 17: Enhanced Dashboard ──────
  performanceOverview: "Performance Overview",
  realTimeMetrics: "Real-Time Metrics",
  dailySummary: "Daily Summary",
  weeklyComparison: "Weekly Comparison",
  monthlyReport: "Monthly Report",
  servicePerformance: "Service Performance",
  staffPerformance: "Staff Performance",
  customerSatisfaction: "Customer Satisfaction",
  averageRating: "Average Rating",
  totalRatings: "Total Ratings",
  ratingDistribution: "Rating Distribution",

  // ─── Task 18-b: Staff Management ──────
  staffManagement: "Staff Management",
  addStaff: "Add Staff",
  staffList: "Staff List",
  staffUsername: "Username",
  staffRole: "Role",
  staffJoinDate: "Joined",
  removeStaff: "Remove",
  staffAdded: "Staff member added",
  staffRemoved: "Staff member removed",
  userNotFound: "User not found",
  staffAlreadyExists: "Staff already exists in this agency",
  enterUsername: "Enter username",

  // ─── Task 18-b: Queue Share ──────
  queueShareText: "I'm #{position} in queue at {agency} - {service}. Ticket: {number}",

  // ─── Task 18-b: Global Announcements ──────
  globalAnnouncements: "Platform Announcements",
  createAnnouncement: "Create Announcement",
  announcementCreatedSuccess: "Announcement created successfully",
  announcementDeletedSuccess: "Announcement deleted successfully",
  announcementMessagePlaceholder: "Write an announcement...",
  announcementTypeInfo: "Info",
  announcementTypeWarning: "Warning",
  announcementTypeUrgent: "Urgent",

  // ─── Task 18-b: Feedback ──────
  commentFeedback: "How was your experience?",
  feedbackComment: "Add a comment (optional)",
  submitFeedback: "Submit Rating",
  thankYouFeedback: "Thank you for your feedback!",
  feedbackSubmitted: "Rating submitted successfully",

  // ─── Task 18-b: Performance Metrics ──────
  performanceMetrics: "Performance Metrics",
  avgRatingStat: "Avg. Rating",
  totalRatingsStat: "Total Ratings",
  completionRateStat: "Completion Rate",
  noShowRateStat: "No-Show Rate",

  // ─── Feature: Smart Polling ────────────────
  smartPollingActive: "Fast-tracking your turn",
  smartPollingDesc: "Checking every 3s while you're next",

  // ─── Feature: Service Analytics ──────────
  serviceAnalytics: "Service Analytics",
  serviceAnalyticsDesc: "Average wait time per service over the last 7 days",
  avgWaitTimePerService: "Avg. Wait",
  totalServed: "Total Served",
  avgRatingPerService: "Avg. Rating",
  noAnalyticsForPeriod: "No data for the last 7 days",
  last7Days: "Last 7 Days",

  // ─── Feature: Quick Stats ──────────────
  todaysQuickStats: "Today's Quick Stats",
  queueLength: "Queue Length",
  noShowRateToday: "No-Show Rate",

  // ─── Staff Account Creation & Password ─────
  createStaffAccount: "Create New Staff Account",
  staffFullName: "Full Name",
  staffInitialPassword: "Initial Password",
  staffRoleSelect: "Staff Role",
  staffRoleStaff: "Staff Member",
  staffRoleManager: "Manager",
  staffCreatedWithCreds: "Staff account created! Credentials: {username} / {password}",
  changePassword: "Change Password",
  currentPassword: "Current Password",
  newPassword: "New Password",
  confirmNewPassword: "Confirm New Password",
  passwordChanged: "Password changed successfully",
  wrongCurrentPassword: "Current password is incorrect",
  usernameTaken: "This username is already taken",
  initialAccountCreated: "Initial account created",

  // ─── QR Code Scanner ────────────────
  scanQrCode: "Scan QR Code",
  cameraPermissionDenied: "Camera permission denied. Please enable it in your browser settings.",
  noCameraAvailable: "No camera available on this device.",
  scanningStatus: "Scanning...",
  qrCodeDetected: "QR Code detected!",
  agencyFound: "Agency found",
  agencyNotFound: "No agency found with this code",
  goToAgency: "Go to Agency",
  closeScanner: "Close Scanner",
  pointCameraAtQr: "Point your camera at a QR code",
  invalidQrCode: "Invalid QR code. Please try again.",
  cameraError: "Error accessing camera",

  // ─── SMS Notification System ─────────────
  smsSettings: "SMS Settings",
  smsGateway: "SMS Gateway",
  smsProvider: "SMS Provider",
  smsApiUrl: "API URL",
  smsApiKey: "API Key",
  smsSenderName: "Sender Name",
  smsEnabled: "SMS Enabled",
  smsDisabled: "SMS Disabled",
  smsTestSend: "Send Test SMS",
  smsTestSent: "Test SMS sent successfully",
  smsTestFailed: "Test SMS failed",
  smsUsageStats: "SMS Usage Statistics",
  smsSentToday: "Sent Today",
  smsSentThisWeek: "Sent This Week",
  smsSentThisMonth: "Sent This Month",
  smsTotalSent: "Total Sent",
  smsNoCredits: "No SMS credits remaining",
  smsCreditCheck: "SMS Credit Check",
  smsLogs: "SMS Logs",
  noSmsLogs: "No SMS logs yet",
  reminderMinutes: "Reminder Before Turn",
  reminderMinutesDesc: "How many minutes before your turn to send a notification",
  smsNotifToggle: "SMS Notifications",
  smsNotifToggleDesc: "Receive SMS when you don't respond to in-app notifications within 10 minutes",
  freeSmsCount: "Free SMS Balance",
  purchasedSmsCount: "Purchased SMS",
  totalSmsAvailable: "Total Available SMS",
  noShowSkipped: "Skipped (No Show)",
  reclaimPosition: "Reclaim My Position",
  reclaimSuccess: "Position reclaimed! You will be called soon.",
  reclaimDesc: "You were skipped because you didn't arrive within 3 minutes. You can reclaim your position.",
  skippedWarning: "You were marked as not present, but you can still reclaim your turn.",
  autoSkipEnabled: "Auto-Skip (3 min)",
  autoSkipDesc: "Automatically skip customers who don't arrive within 3 minutes of being called",
  smsConfigSection: "SMS Configuration",
  smsConfigDesc: "Configure the SMS gateway to send text notifications to customers",
  testPhoneNumber: "Test Phone Number",
  testPhoneNumberDesc: "Send a test SMS to this number",
  turnApproachingSms: "Your turn at {agency} is approaching! Ticket: {number}",
  noShowWarningNotif: "You were skipped at {agency} (ticket {number}). Tap to reclaim.",
  smsSaved: "SMS settings saved successfully",
  reminder5min: "5 minutes",
  reminder10min: "10 minutes",
  reminder15min: "15 minutes",
  reminder20min: "20 minutes",
  reminder30min: "30 minutes",
  noSmsSettings: "SMS not configured. Contact admin.",
};

export default en;
