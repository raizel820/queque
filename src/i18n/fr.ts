import type { TranslationKeys } from './ar';

const fr: Record<TranslationKeys, string> = {
  // ─── App ─────────────────────────────────
  appName: "QueueWise",
  appTagline: "Gestion intelligente des files d'attente pour les établissements en Algérie",

  // ─── Common ──────────────────────────────
  loading: "Chargement...",
  save: "Enregistrer",
  cancel: "Annuler",
  delete: "Supprimer",
  edit: "Modifier",
  search: "Rechercher",
  submit: "Confirmer",
  close: "Fermer",
  back: "Retour",
  next: "Suivant",
  confirm: "Confirmer",
  yes: "Oui",
  no: "Non",
  success: "Succès",
  error: "Erreur",
  noData: "Aucune donnée",
  refresh: "Actualiser",
  actions: "Actions",
  status: "Statut",
  date: "Date",
  time: "Heure",
  all: "Tout",
  active: "Actif",
  inactive: "Inactif",
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  completed: "Terminé",
  cancelled: "Annulé",
  viewDetails: "Voir les détails",
  upload: "Téléverser",
  download: "Télécharger",
  name: "Nom",
  description: "Description",
  minutes: "minutes",
  currency: "DA",
  perMonth: "/ mois",

  // ─── Auth ────────────────────────────────
  login: "Connexion",
  register: "Inscription",
  logout: "Déconnexion",
  email: "E-mail",
  username: "Nom d'utilisateur",
  fullName: "Nom complet",
  password: "Mot de passe",
  confirmPassword: "Confirmer le mot de passe",
  phoneNumber: "Numéro de téléphone",
  forgotPassword: "Mot de passe oublié ?",
  noAccount: "Vous n'avez pas de compte ?",
  hasAccount: "Vous avez déjà un compte ?",
  loginAsCustomer: "Connexion client",
  loginAsAgency: "Connexion établissement",
  loginAsAdmin: "Connexion administrateur",
  registerSuccess: "Compte créé avec succès",
  loginSuccess: "Connexion réussie",
  invalidCredentials: "Nom d'utilisateur ou mot de passe incorrect",
  userExists: "Ce nom d'utilisateur existe déjà",
  passwordMismatch: "Les mots de passe ne correspondent pas",
  requiredField: "Ce champ est obligatoire",
  invalidPhone: "Numéro de téléphone invalide",
  phoneOptional: "Téléphone (optionnel)",
  selectRole: "Choisir le type de compte",
  rememberMe: "Se souvenir de moi",
  orContinueWith: "Ou continuer avec",

  // ─── Navigation ──────────────────────────
  home: "Accueil",
  myQueue: "Ma file",
  history: "Historique",
  profile: "Profil",
  dashboard: "Tableau de bord",
  settings: "Paramètres",
  agencies: "Établissements",
  reservations: "Réservations",
  transactions: "Transactions",
  auditLogs: "Journal d'audit",
  language: "Langue",

  // ─── Customer ────────────────────────────
  welcomeTitle: "Bienvenue sur QueueWise",
  welcomeSubtitle: "Rejoignez les files d'attente à distance, plus besoin d'attendre !",
  searchAgency: "Rechercher un établissement...",
  searchByCategory: "Rechercher par catégorie",
  searchByService: "Rechercher par service",
  joinQueue: "Rejoindre la file",
  enterAgencyCode: "Entrer le code de l'établissement",
  agencyCodePlaceholder: "Ex: CLINIC01",
  scanQR: "Scanner le code QR",
  yourQueueNumber: "Votre numéro",
  queueNumber: "Numéro de file",
  memberSince: "Membre depuis",
  peopleAhead: "personnes devant vous",
  estimatedWait: "Temps d'attente estimé",
  currentlyServing: "En cours de service",
  queuePosition: "Votre position",
  noActiveReservations: "Aucune réservation active",
  reservationJoined: "Vous avez rejoint la file avec succès !",
  alreadyInQueue: "Vous êtes déjà dans cette file",
  queueClosed: "La file est actuellement fermée",
  queueFull: "La file est actuellement pleine",
  cancelReservation: "Annuler la réservation",
  leaveQueue: "Quitter la file",
  leaveQueueConfirm: "Êtes-vous sûr de vouloir quitter la file ?",
  leaveQueueDesc: "Votre réservation sera annulée et vous ne pourrez pas la récupérer.",
  queueLeft: "Vous avez quitté la file avec succès",
  leaving: "Départ en cours...",
  confirmCancel: "Êtes-vous sûr de vouloir annuler ?",
  sponsored: "Sponsorisé",
  openNow: "Ouvert",
  closed: "Fermé",
  selectService: "Choisir le service",
  joinSuccess: "File rejointe avec succès !",
  queueInfo: "Infos de la file",
  min: "min",
  person: "personne",
  paused: "En pause",
  waiting: "en attente",
  services: "services",

  // ─── Categories ──────────────────────────
  catAll: "Tout",
  catClinic: "Clinique",
  catAgency: "Agence",
  catLawFirm: "Cabinet d'avocat",
  catLaboratory: "Laboratoire",
  catGovernment: "Administration",
  catOther: "Autre",
  catFilter: "Catégorie",

  // ─── Queue Statuses ──────────────────────
  statusWaiting: "En attente",
  statusCalled: "Appelé",
  statusServed: "En service",
  statusCompleted: "Terminé",
  statusCancelled: "Annulé",
  statusNoShow: "Absent",

  // ─── Notifications ───────────────────────
  notifQueueJoined: "File rejointe",
  notifTurnApproaching: "Votre tour approche !",
  notifQueueCalled: "On vous appelle !",
  notifCompleted: "Service terminé",
  notifCancelled: "Réservation annulée",
  notifNoShow: "Marqué comme absent",
  notifSystem: "Notification système",

  // ─── SMS Wallet ──────────────────────────
  smsWallet: "Portefeuille SMS",
  freeSmsRemaining: "SMS gratuits restants",
  buySms: "Acheter des SMS",
  smsPackages: "Forfaits SMS",
  pack20Sms: "20 SMS",
  pack50Sms: "50 SMS",

  // ─── Agency Dashboard ────────────────────
  agencyDashboard: "Tableau de bord",
  callNext: "Appeler le suivant",
  markCompleted: "Terminer",
  markNoShow: "Absent",
  cancelRes: "Annuler",
  markCancelled: "Marquer comme annulé",
  pauseQueue: "Pause",
  resumeQueue: "Reprendre",
  queuePaused: "File en pause",
  queueResumed: "File reprise",
  noQueue: "Aucun client en attente",
  todayReservations: "Réservations du jour",
  avgWaitTime: "Temps d'attente moyen",
  servedToday: "Servis aujourd'hui",
  currentlyWaiting: "En attente",
  queueManagement: "Gestion de la file",
  waitingList: "Liste d'attente",
  currentNumber: "Numéro actuel",

  // ─── Agency Profile ──────────────────────
  agencyProfile: "Profil de l'établissement",
  agencyName: "Nom de l'établissement",
  agencyAddress: "Adresse",
  agencyCategory: "Catégorie",
  agencyPhone: "Téléphone",
  agencyEmail: "E-mail",
  workingHours: "Heures d'ouverture",
  uploadLogo: "Téléverser le logo",
  uploadCover: "Téléverser la couverture",
  generateQR: "Générer le code QR",

  // ─── Agency Settings ─────────────────────
  avgServiceTime: "Durée moyenne de service (minutes)",
  maxReservations: "Max. réservations actives",
  queueOpen: "Ouvrir la file",
  queueClosedStatus: "Fermer la file",
  addService: "Ajouter un service",
  serviceName: "Nom du service",
  servicePrefix: "Préfixe du numéro",
  manageServices: "Gérer les services",
  serviceSettings: "Paramètres des services",

  // ─── Subscription ────────────────────────
  subscription: "Abonnement",
  currentPlan: "Plan actuel",
  basicPlan: "Basique",
  premiumPlan: "Premium",
  basicPrice: "2 000 DA / mois",
  premiumPrice: "3 000 DA / mois",
  basicFeatures: "Gestion de file • Statistiques standards",
  premiumFeatures: "Placement sponsorisé • Visibilité accrue • Génération de leads",
  upgradePlan: "Changer de plan",
  submitPayment: "Soumettre le paiement",
  uploadReceipt: "Téléverser le reçu",
  ccpTransfer: "Virement CCP",
  bankTransfer: "Virement bancaire",
  paymentPending: "En attente de vérification",
  paymentApproved: "Paiement approuvé",
  paymentRejected: "Paiement rejeté",
  selectPlan: "Choisir le plan",
  paymentProof: "Preuve de paiement",
  receiptNote: "Veuillez téléverser le reçu en format JPG, PNG ou PDF",

  // ─── Admin Dashboard ─────────────────────
  adminDashboard: "Tableau de bord admin",
  systemStats: "Statistiques système",
  totalAgencies: "Total établissements",
  activeQueues: "Files actives",
  dailyReservations: "Réservations du jour",
  totalRevenue: "Revenus totaux",
  pendingTransactions: "Transactions en attente",
  approveTransaction: "Approuver",
  rejectTransaction: "Rejeter",
  rejectionReason: "Raison du rejet",
  createAgency: "Créer un établissement",
  editAgency: "Modifier l'établissement",
  suspendAgency: "Suspendre l'établissement",
  deleteAgency: "Supprimer l'établissement",
  activateSubscription: "Activer l'abonnement",
  suspendSubscription: "Suspendre l'abonnement",
  pendingPayments: "Paiements en attente",
  agencyManagement: "Gestion des établissements",
  recentActivity: "Activité récente",
  reviewPayment: "Vérifier le paiement",

  // ─── Landing Page ────────────────────────
  heroTitle: "Ne patientez plus dans les files",
  heroSubtitle: "Rejoignez n'importe quelle file depuis votre téléphone, suivez votre position en temps réel et recevez une notification quand c'est votre tour",
  getStarted: "Commencer",
  learnMore: "En savoir plus",
  feature1Title: "Rejoignez à distance",
  feature1Desc: "Rejoignez n'importe quelle file de n'importe où sans arriver tôt",
  feature2Title: "Suivi en direct",
  feature2Desc: "Suivez votre position dans la file en temps réel",
  feature3Title: "Notifications instantanées",
  feature3Desc: "Recevez une alerte quand votre tour approche",
  feature4Title: "Facile à utiliser",
  feature4Desc: "Interface simple et intuitive pour tout le monde",
  howItWorks: "Comment ça marche ?",
  step1: "Recherchez l'établissement",
  step1Desc: "Par nom, code ou scan QR",
  step2: "Rejoignez la file",
  step2Desc: "Choisissez le service et obtenez votre numéro",
  step3: "Suivez et attendez",
  step3Desc: "Suivez votre position et recevez une notification",

  // ─── Landing Stats ────────────────────────
  landingStatAgencies: "Établissements",
  landingStatUsers: "Utilisateurs",
  landingStatLocation: "Algérie - M'Sila",

  // ─── Notifications Center ─────────────────
  notifications: "Notifications",
  noNotifications: "Aucune notification",
  noNotificationsDesc: "Les notifications sur l'état de votre file apparaîtront ici",
  markAllRead: "Tout marquer comme lu",
  weak: "Faible",
  fair: "Passable",
  good: "Bon",
  strong: "Fort",
  veryStrong: "Très fort",
  usernameMinLength: "Le nom d'utilisateur doit comporter au moins 3 caractères",
  landingLocation: "M'Sila",
  
  // ─── Audit Logs ────────────────────────────
  auditLogsPage: "Journal d'audit",
  allLogs: "Tous les logs",
  filterByAction: "Filtrer par action",
  todayLogs: "Logs du jour",
  
  // ─── Extra ─────────────────────────────────
  searchPlaceholder: "Rechercher...",
  noResults: "Aucun résultat trouvé",
  confirmLogout: "Êtes-vous sûr de vouloir vous déconnecter ?",
  poweredBy: "Propulsé par",
  rightsReserved: "Tous droits réservés",
  version: "Version 1.0",

  // ─── Themes �n─────────────────────────────
  lightMode: "Mode clair",
  darkMode: "Mode sombre",
  systemTheme: "Système",

  // ─── Testimonials ─────────────────────────
  testimonialsTitle: "Ce que disent nos clients",
  testimonial1: "Je n'attends plus des heures à la clinique. Je me joins de chez moi et je vais quand c'est mon tour !",
  testimonial1Name: "Karim Boualem",
  testimonial1Role: "Client",
  testimonial2: "La plateforme est très facile à utiliser. Même les personnes âgées peuvent l'utiliser facilement.",
  testimonial2Name: "Fatima Zahra",
  testimonial2Role: "Cliente",
  testimonial3: "QueueWise m'a aidé à mieux organiser la file d'attente. Les clients sont très satisfaits.",
  testimonial3Name: "Dr. Mohamed",
  testimonial3Role: "Propriétaire de clinique",
  trustedBy: "Approuvé par",
  trustedClinic: "Cliniques",
  trustedLab: "Laboratoires",
  trustedLaw: "Avocats",
  trustedGov: "Gouvernement",

  // ─── Queue Tracker ────────────────────────
  live: "En direct",
  noHistoryYet: "Pas encore d'historique",
  noHistoryCompleted: "Aucune réservation terminée",
  noHistoryCancelled: "Aucune réservation annulée",
  noHistoryNoShow: "Aucune absence enregistrée",
  notificationTypeQueue: "File",
  notificationTypeSystem: "Système",
  notificationTypeAlert: "Alerte",
  nowServing: "En cours de service",
  queueStatus: "Statut de la file",
  queueOpenStatus: "Ouverte",
  queuePausedStatusLabel: "En pause",
  appearance: "Apparence",
  appearanceDesc: "Personnaliser l'apparence de l'application",

  // ─── Roles ──────────────────────────────
  agencyOwner: "Propriétaire",
  agencyStaff: "Employé",
  platformAdmin: "Administrateur Plateforme",
  superAdmin: "Super Administrateur",

  // ─── Accessibility ──────────────────────
  changeLanguage: "Changer la langue",
  toggleTheme: "Changer le thème",

  // ─── Agency Code ────────────────────────
  shareCodeText: "Partagez ce code avec vos clients",

  // ─── Bottom Nav / More Menu ──────────────
  more: "Plus",
  moreMenuTitle: "Plus d'options",
  quickStats: "Statistiques rapides",
  agenciesNearby: "Agences à proximité",
  activeQueuesCount: "Files actives",
  avgWaitShort: "Att. Moy.",
  totalServices: "Total Services",

  // ─── Queue Progress ──────────────────────
  yourPosition: "Votre position",
  peopleAheadOf: "personnes devant vous",
  estimatedTimeLeft: "Temps restant",
  yourTurnAlert: "C'EST VOTRE TOUR!",
  yourTurnDesc: "Veuillez vous rendre au comptoir",
  turnCalledAt: "Appelé à",

  // ─── Agency Dashboard Enhancements ───────
  todayOverview: "Aperçu du jour",
  queueEfficiency: "Efficacité de la file",
  serviceBreakdown: "Répartition des services",
  noServiceData: "Aucune donnée de service",
  completionRate: "Taux d'achèvement",
  noShowRate: "Taux d'absence",

  // ─── Admin Enhancements ──────────────────
  systemHealth: "Santé du système",
  uptime: "Disponibilité",
  responseTime: "Temps de réponse",
  activeUsersToday: "Utilisateurs actifs aujourd'hui",
  weeklyGrowth: "Croissance hebdomadaire",
  platformVersion: "Version de la plateforme",
  lastUpdated: "Dernière mise à jour",

  // ─── Weekly Summary ──────────────────────
  weeklySummary: "Résumé hebdomadaire",
  thisWeek: "Cette semaine",
  thisYear: "Cette année",
  lastWeek: "La semaine dernière",
  autoRefresh: "Actualisation automatique toutes les 10s",

  // ─── Customer Queue ─────────────────────

  // ─── Countdown Labels ───────────────────
  hours: "Heure",
  minutesLabel: "Minute",
  secondsLabel: "Seconde",

  // ─── Dashboard ──────────────────────────
  dailyActivity: "Activité du jour",

  // ─── Agency Profile Extras ──────────────
  agencyCode: "Code de l'établissement",
  copyLink: "Copier le lien",
  downloadQr: "Télécharger le QR",
  linkCopied: "Lien copié !",
  copied: "Copié !",
  downloaded: "Téléchargé !",

  // ─── Admin Users ────────────────────────
  userManagement: "Gestion des utilisateurs",
  totalUsers: "Total utilisateurs",
  suspendUser: "Suspendre",
  activateUser: "Activer",
  adminRole: "Admin",
  agencyOwnerRole: "Propriétaire",
  agencyStaffRole: "Employé",
  customerRole: "Client",
  suspended: "Suspendu",

  // ─── Customer History ───────────────────
  bookAgain: "Réserver à nouveau",

  // ─── QR & Notifications Extras ─────────
  shareCodeWithCustomers: "Partagez ce code avec vos clients pour un accès rapide",
  yourTurn: "C'est votre tour !",
  turnNotifBody: "Veuillez vous rendre au guichet de service.",
  dismissAlert: "Compris",
  fileTooLarge: "La taille du fichier dépasse 5 Mo",
  seconds: "Seconde",

  // ─── Admin Analytics ──────────────────
  analytics: "Analytique",
  totalReservationsAll: "Total des réservations",
  avgWaitTimeStat: "Temps d'attente moyen",
  busiestDay: "Jour le plus chargé",
  peakHour: "Heure de pointe",
  registrations: "Inscriptions",
  registrationsTrend: "Tendance des inscriptions",
  last14Days: "14 derniers jours",
  topAgencies: "Établissements les plus actifs",
  peakHours: "Heures de pointe",
  hourly: "Par heure",
  noAnalyticsData: "Aucune donnée analytique",
  downloadReport: "Télécharger le rapport",
  leaderboard: "Classement",

  // ─── Customer Favorites ──────────────
  favorites: "Favoris",
  favoriteAgency: "Ajouter aux favoris",
  unfavoriteAgency: "Retirer des favoris",
  noFavoritesYet: "Aucun favori pour le moment",
  noFavoritesDesc: "Appuyez sur le cœur d'un établissement pour l'ajouter aux favoris",
  joinFromFavorites: "Rejoindre la file",

  // ─── Working Hours ──────────────────
  openUntil: "Ouvert jusqu'à",
  closedNow: "Fermé actuellement",
  openFrom: "Ouvert à partir de",
  workingHoursStart: "Début des heures d'ouverture",
  workingHoursEnd: "Fin des heures d'ouverture",

  // ─── Notification Preferences ─────────
  notifPrefs: "Préférences de notification",
  notifPrefsDesc: "Choisissez les notifications que vous souhaitez recevoir",
  queueCalledNotif: "Notification d'appel",
  queueCalledNotifDesc: "Soyez notifié quand votre numéro est appelé",
  turnApproachingNotif: "Tour approchant",
  turnApproachingNotifDesc: "Alerte avant votre tour (3 positions)",
  completedNotif: "Service terminé",
  completedNotifDesc: "Notification quand le service est terminé",

  // ─── Enhanced Register ──────────────
  algeriaPrefix: "+213",
  phoneWithPrefix: "Numéro de téléphone",
  agreeTerms: "J'accepte les",
  termsOfService: "Conditions d'utilisation",
  andStr: "et",
  privacyPolicy: "Politique de confidentialité",
  mustAgreeTerms: "Vous devez accepter les conditions",
  agencyCodeField: "Code de l'établissement (optionnel)",
  agencyCodeFieldDesc: "Entrez le code pour rejoindre en tant qu'employé",
  adminSecretCode: "Code secret admin",
  adminCodeDesc: "Requis uniquement pour créer un compte admin",
  invalidAdminCode: "Code admin invalide",
  passwordMinLength: "Le mot de passe doit contenir au moins 6 caractères",
  justNow: "à l'instant",
  timeAgo: "depuis",

  // ─── Slide to Confirm ──────────────
  slideToConfirm: "Glissez pour confirmer",
  pressEnterToConfirm: "Appuyez sur Entrée pour confirmer",
  confirmed: "Confirmé",
  notificationSoundOn: "Son de notification activé",
  notificationSoundOff: "Son de notification désactivé",

  // ─── Delete Account ────────────────
  deleteAccount: "Supprimer le compte",
  deleteAccountDesc: "Votre compte et toutes vos données seront supprimés définitivement. Cette action est irréversible.",
  deleteAccountWarning: "Attention : cette action est irréversible !",
  irreversibleActions: "Actions irréversibles",
  typeDeleteToConfirm: 'Tapez "supprimer" pour confirmer',
  accountDeleted: "Compte supprimé avec succès",
  deleteAccountError: "Impossible de supprimer le compte",

  unsavedChanges: "Vous avez des modifications non enregistrées",
  account: "Compte",
  reviewInfo: "Vérifier les informations",

  // ─── Date Selection ────────────────
  selectDate: "Sélectionner la date",
  reserveForDate: "Réserver pour une date",
  today: "Aujourd'hui",
  tomorrow: "Demain",
  pickDate: "Choisir une date",
  reservedFor: "Réservé pour le",
  noDateSelected: "Aucune date sélectionnée",

  // ─── Misc Labels ────────────────────
  popular: "Populaire",
  todayLabel: "réservations aujourd'hui",
  confirmDeleteAgency: "Êtes-vous sûr de vouloir supprimer cette agence ? Cette action est irréversible.",

  // ─── Role Labels ──────────────────────
  staffRole: "Employé",
  ownerRole: "Propriétaire",

  // ─── Feature Badges ─────────────────────
  comingSoon: "Bientôt",

  // ─── Auth Role Errors ──────────────────
  wrongRoleError: "Ce compte ne correspond pas au rôle sélectionné",

  // ─── Feature 1: Queue Auto-Refresh ──────
  refreshInterval: "Intervalle d'actualisation",
  refreshEvery: "Actualiser toutes les",
  updatedAgo: "Mis à jour",
  off: "Désactivé",
  seconds5: "5s",
  seconds10: "10s",
  seconds30: "30s",

  // ─── Feature 2: Today's Summary ─────────
  todaySummary: "Résumé du jour",
  peakHourToday: "Heure de pointe",

  // ─── Feature 3: Nearby Agencies ─────────
  nearby: "À proximité",
  nearbyAgencies: "Établissements à proximité",

  // ─── Feature 4: Quick Actions ────────────
  quickActions: "Actions rapides",
  addNewAgency: "Ajouter un établissement",
  viewAnalytics: "Voir les analyses",
  manageUsers: "Gérer les utilisateurs",
  viewTransactions: "Voir les transactions",

  // ─── Feature 5: Queue Capacity ───────────
  queueCapacity: "Capacité de la file",
  maxActiveReservations: "Max. réservations actives",
  autoPause: "Pause automatique",
  autoPauseDesc: "Mettre en pause automatiquement la file quand la capacité est atteinte",
  estServiceTime: "Durée de service estimée (minutes)",

  // ─── Feature 6: Customer Stats ──────────
  myStats: "Mes statistiques",
  totalQueuesJoined: "Total des files rejointes",
  avgWaitTimeExperienced: "Temps d'attente moyen",
  favoriteAgencyStat: "Établissement préféré",
  thisMonth: "Ce mois-ci",

  // ─── Feature 1: Turn Overlay ────────────
  itsYourTurn: "C'EST VOTRE TOUR !",
  tapToDismiss: "Appuyez pour fermer",
  proceedToCounter: "Veuillez vous rendre au comptoir",
  vibrationEffect: "Vibrer",

  // ─── Feature 2: Activity Feed ───────────
  liveFeed: "Flux en direct",
  customerJoinedQueue: "{name} a rejoint la file",
  customerWasCalled: "{name} a été appelé",
  customerCompletedService: "{name} a terminé le service",
  customerCancelledRes: "{name} a annulé",
  noRecentActivity: "Aucune activité récente",

  // ─── Feature 3: Search Suggestions ──────
  recentSearches: "Recherches récentes",
  clearAll: "Tout effacer",
  clearSearch: "Effacer",
  suggestions: "Suggestions",
  noSuggestions: "Aucune suggestion trouvée",

  // ─── Feature 4: Enhanced User Mgmt ──────
  viewProfile: "Voir le profil",
  phone: "Téléphone",
  agencyCol: "Établissement",
  noAgency: "Aucun établissement",
  suspendUserFull: "Suspendre l'utilisateur",
  reactivateUserFull: "Réactiver l'utilisateur",
  roleFilter: "Filtrer par rôle",

  // ─── Feature 5: Mark All Read ───────────
  allRead: "Tout lu ✓",
  markAllReadSuccess: "Toutes les notifications ont été marquées comme lues",

  // ─── Feature 6: Social Sharing ──────────
  shareOnWhatsApp: "Partager sur WhatsApp",
  shareOnTelegram: "Partager sur Telegram",
  shareOnFacebook: "Partager sur Facebook",
  downloadQrComingSoon: "Télécharger le code QR",
  copyLinkToast: "Lien copié dans le presse-papiers !",
  shareAgency: "Partager l'établissement",
  sharePosition: "Partager ma position",

  // ─── Styling Polish Keys ─────────────
  systemUptime: "Système en ligne",
  emptyHistoryMsg: "Vos réservations passées apparaîtront ici",
  recommended: "Recommandé",
  basicToPremium: "Plus de fonctionnalités avec Premium",
  forgotPasswordHelp: "Mot de passe oublié ?",
  landingCarouselTitle: "Témoignages de nos clients",
  carouselDot: "Aller au témoignage",

  // ─── Feature: Wait Time Prediction ─────
  remainingTime: "Temps restant",

  // ─── Feature: Bulk Queue Actions ─────
  batchMode: "Mode groupé",
  completeSelected: "Terminer la sélection",
  selected: "sélectionné(s)",
  exitBatchMode: "Quitter le mode groupé",
  selectTickets: "Sélectionner des tickets",

  // ─── Feature: System Announcements ─────
  systemAnnouncements: "Annonces système",
  announcement: "Annonce",
  pinned: "Épinglé",
  dismiss: "Fermer",

  // ─── Feature: QR Code Sharing ─────
  shareViaQR: "Partager via QR",
  qrCodeTitle: "Code QR",
  downloadQR: "Télécharger le QR",
  qrCodeDesc: "Scannez ce code pour suivre l'état de votre réservation",

  // ─── Feature: Queue Status Widget ─────
  lowWait: "Attente courte",
  mediumWait: "Attente moyenne",
  highWait: "Attente longue",

  // ─── Feature: Emergency Cancel ─────
  emergencyCancel: "Annulation d'urgence",
  emergencyCancelDesc: "Êtes-vous sûr de vouloir annuler votre réservation immédiatement ? Cette action est irréversible.",
  emergencyCancelConfirm: "Oui, annuler ma réservation",

  // ─── Admin Reset Password ─────────────
  resetPassword: "Réinitialiser le mot de passe",
  resetPasswordConfirm: "Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Un mot de passe par défaut sera défini.",
  passwordReset: "Mot de passe réinitialisé",
  newPasswordIs: "Le nouveau mot de passe est",

  // ─── Agency Rating ─────────────
  rateExperience: "Évaluez votre expérience",
  rateSubmitted: "Merci pour votre évaluation !",
  yourRating: "Votre note",

  // ─── Agency Announcements ──────
  announcements: "Annonces",
  addAnnouncement: "Ajouter une annonce",
  announcementMessage: "Message",
  announcementType: "Type",
  announcementInfo: "Info",
  announcementWarning: "Avertissement",
  announcementUrgent: "Urgent",
  announcementCreated: "Annonce créée",
  announcementDeleted: "Annonce supprimée",
  announcementPlaceholder: "Écrivez une annonce pour vos clients...",
  noAnnouncements: "Aucune annonce",
  agencyAnnouncement: "Annonce de l'établissement",

  // ─── CSV Export ────────────────
  exportCsv: "Exporter CSV",
  exportAgencies: "Exporter les établissements (CSV)",
  exportUsers: "Exporter les utilisateurs (CSV)",
  exportSuccess: "Export démarré",
  exportFailed: "Échec de l'export",

  // ─── Phase 17: Wait Time Chart ──────
  waitTimeChart: "Temps d'attente aujourd'hui",
  waitTimeMinutes: "min",
  hourlyData: "Données horaires",
  avgServiceTimeLabel: "Durée moy. service",
  throughputLabel: "Débit",
  customersPerHour: "clients/h",

  // ─── Phase 17: Customer Growth ──────
  customerGrowth: "Croissance des clients",
  newCustomers: "Nouveaux clients",
  totalCustomers: "Total des clients",
  growthRate: "Taux de croissance",
  monthOverMonth: "Mois par mois",

  // ─── Phase 17: Queue Insights ──────
  queueInsights: "Analyse de la file",
  averageServiceDuration: "Durée moy. de service",
  fastestService: "Service le plus rapide",
  slowestService: "Service le plus lent",
  waitTimeTrend: "Tendance d'attente",
  improving: "En amélioration",
  worsening: "En dégradation",
  stable: "Stable",

  // ─── Phase 17: Enhanced Dashboard ──────
  performanceOverview: "Vue d'ensemble des performances",
  realTimeMetrics: "Métriques en temps réel",
  dailySummary: "Résumé du jour",
  weeklyComparison: "Comparaison hebdomadaire",
  monthlyReport: "Rapport mensuel",
  servicePerformance: "Performance des services",
  staffPerformance: "Performance du personnel",
  customerSatisfaction: "Satisfaction client",
  averageRating: "Note moyenne",
  totalRatings: "Total des notes",
  ratingDistribution: "Distribution des notes",

  // ─── Task 18-b: Staff Management ──────
  staffManagement: "Gestion du personnel",
  addStaff: "Ajouter un employé",
  staffList: "Liste du personnel",
  staffUsername: "Nom d'utilisateur",
  staffRole: "Rôle",
  staffJoinDate: "Date d'ajout",
  removeStaff: "Retirer",
  staffAdded: "Employé ajouté",
  staffRemoved: "Employé retiré",
  userNotFound: "Utilisateur introuvable",
  staffAlreadyExists: "Cet employé existe déjà dans cet établissement",
  enterUsername: "Entrez le nom d'utilisateur",

  // ─── Task 18-b: Queue Share ──────
  queueShareText: "Je suis #{position} dans la file à {agency} - {service}. Ticket : {number}",

  // ─── Task 18-b: Global Announcements ──────
  globalAnnouncements: "Annonces de la plateforme",
  createAnnouncement: "Créer une annonce",
  announcementCreatedSuccess: "Annonce créée avec succès",
  announcementDeletedSuccess: "Annonce supprimée avec succès",
  announcementMessagePlaceholder: "Écrivez une annonce...",
  announcementTypeInfo: "Info",
  announcementTypeWarning: "Avertissement",
  announcementTypeUrgent: "Urgent",

  // ─── Task 18-b: Feedback ──────
  commentFeedback: "Comment était votre expérience ?",
  feedbackComment: "Ajouter un commentaire (facultatif)",
  submitFeedback: "Envoyer l'évaluation",
  thankYouFeedback: "Merci pour votre retour !",
  feedbackSubmitted: "Évaluation envoyée avec succès",

  // ─── Task 18-b: Performance Metrics ──────
  performanceMetrics: "Indicateurs de performance",
  avgRatingStat: "Note moyenne",
  totalRatingsStat: "Total des notes",
  completionRateStat: "Taux d'achèvement",
  noShowRateStat: "Taux d'absence",

  // ─── Feature: Smart Polling ────────────────
  smartPollingActive: "Suivi rapide de votre tour",
  smartPollingDesc: "Vérification toutes les 3s pendant que vous êtes le prochain",

  // ─── Feature: Service Analytics ──────────
  serviceAnalytics: "Analytique des services",
  serviceAnalyticsDesc: "Temps d'attente moyen par service sur les 7 derniers jours",
  avgWaitTimePerService: "Att. Moy.",
  totalServed: "Total servis",
  avgRatingPerService: "Note moy.",
  noAnalyticsForPeriod: "Aucune donnée pour les 7 derniers jours",
  last7Days: "7 derniers jours",

  // ─── Feature: Quick Stats ──────────────
  todaysQuickStats: "Stats rapides du jour",
  queueLength: "Longueur de la file",
  noShowRateToday: "Taux d'absence",

  // ─── Staff Account Creation & Password ─────
  createStaffAccount: "Créer un nouveau compte employé",
  staffFullName: "Nom complet",
  staffInitialPassword: "Mot de passe initial",
  staffRoleSelect: "Rôle de l'employé",
  staffRoleStaff: "Employé",
  staffRoleManager: "Responsable",
  staffCreatedWithCreds: "Compte créé ! Identifiants : {username} / {password}",
  changePassword: "Changer le mot de passe",
  currentPassword: "Mot de passe actuel",
  newPassword: "Nouveau mot de passe",
  confirmNewPassword: "Confirmer le mot de passe",
  passwordChanged: "Mot de passe modifié avec succès",
  wrongCurrentPassword: "Le mot de passe actuel est incorrect",
  usernameTaken: "Ce nom d'utilisateur est déjà pris",
  initialAccountCreated: "Compte initial créé",

  // ─── QR Code Scanner ────────────────
  scanQrCode: "Scanner le code QR",
  cameraPermissionDenied: "Permission de caméra refusée. Veuillez l'activer dans les paramètres du navigateur.",
  noCameraAvailable: "Aucune caméra disponible sur cet appareil.",
  scanningStatus: "Analyse en cours...",
  qrCodeDetected: "Code QR détecté !",
  agencyFound: "Établissement trouvé",
  agencyNotFound: "Aucun établissement trouvé avec ce code",
  goToAgency: "Aller à l'établissement",
  closeScanner: "Fermer le scanner",
  pointCameraAtQr: "Pointez votre caméra vers un code QR",
  invalidQrCode: "Code QR invalide. Veuillez réessayer.",
  cameraError: "Erreur d'accès à la caméra",

  // ─── SMS Notification System ─────────────
  smsSettings: "Paramètres SMS",
  smsGateway: "Passerelle SMS",
  smsProvider: "Fournisseur SMS",
  smsApiUrl: "URL API",
  smsApiKey: "Clé API",
  smsSenderName: "Nom de l'expéditeur",
  smsEnabled: "SMS activé",
  smsDisabled: "SMS désactivé",
  smsTestSend: "Envoyer un SMS test",
  smsTestSent: "SMS test envoyé avec succès",
  smsTestFailed: "Échec de l'envoi du SMS test",
  smsUsageStats: "Statistiques SMS",
  smsSentToday: "Envoyés aujourd'hui",
  smsSentThisWeek: "Envoyés cette semaine",
  smsSentThisMonth: "Envoyés ce mois",
  smsTotalSent: "Total envoyés",
  smsNoCredits: "Aucun crédit SMS restant",
  smsCreditCheck: "Vérification des crédits SMS",
  smsLogs: "Journaux SMS",
  noSmsLogs: "Aucun journal SMS",
  reminderMinutes: "Rappel avant le tour",
  reminderMinutesDesc: "Combien de minutes avant votre tour pour envoyer une notification",
  smsNotifToggle: "Notifications SMS",
  smsNotifToggleDesc: "Recevoir un SMS si vous ne répondez pas aux notifications dans l'application sous 10 minutes",
  freeSmsCount: "Solde SMS gratuit",
  purchasedSmsCount: "SMS achetés",
  totalSmsAvailable: "SMS disponibles total",
  noShowSkipped: "Passé (Absent)",
  reclaimPosition: "Récupérer ma place",
  reclaimSuccess: "Place récupérée ! Vous serez appelé bientôt.",
  reclaimDesc: "Vous avez été passé car vous n'êtes pas arrivé dans les 3 minutes. Vous pouvez récupérer votre place.",
  skippedWarning: "Vous avez été marqué absent, mais vous pouvez toujours récupérer votre tour.",
  autoSkipEnabled: "Passage automatique (3 min)",
  autoSkipDesc: "Passer automatiquement les clients qui n'arrivent pas dans les 3 minutes après l'appel",
  smsConfigSection: "Configuration SMS",
  smsConfigDesc: "Configurer la passerelle SMS pour envoyer des notifications par texto aux clients",
  testPhoneNumber: "Numéro de test",
  testPhoneNumberDesc: "Envoyer un SMS test à ce numéro",
  turnApproachingSms: "Votre tour à {agency} approche ! Ticket : {number}",
  noShowWarningNotif: "Vous avez été passé à {agency} (ticket {number}). Appuyez pour récupérer.",
  smsSaved: "Paramètres SMS enregistrés avec succès",
  reminder5min: "5 minutes",
  reminder10min: "10 minutes",
  reminder15min: "15 minutes",
  reminder20min: "20 minutes",
  reminder30min: "30 minutes",
  noSmsSettings: "SMS non configuré. Contactez l'admin.",
};

export default fr;
