import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Shield, ChevronRight, Plus, X, Globe, DollarSign, Mail, MessageSquare, Eye, EyeOff, TestTube, CheckCircle2, XCircle, Languages, Search, FileText, Edit2, Save } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const { t, refreshSettings } = useLanguage();
  const { refreshSettings: refreshCurrencySettings } = useCurrency();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    language_1: 'en',
    language_2: '',
    currency: 'USD',
    enabled_currencies: ['USD'],
    exchange_rates: { USD: 1.0 },
    // SMTP Settings
    smtp: {
      enabled: false,
      host: '',
      port: 587,
      username: '',
      password: '',
      from_email: '',
      from_name: '',
      encryption: 'tls',
      verified: false
    },
    // SMS Settings
    sms: {
      enabled: false,
      provider: 'twilio',
      api_key: '',
      api_secret: '',
      sender_id: '',
      account_sid: '',
      verified: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showSmsSecret, setShowSmsSecret] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  
  // Translation Management State
  const [selectedTranslationLang, setSelectedTranslationLang] = useState('');
  const [translationSearch, setTranslationSearch] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editedTranslations, setEditedTranslations] = useState({});
  const [customTranslations, setCustomTranslations] = useState({});
  const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ key: '', english: '', translations: {} });
  const [savingTranslations, setSavingTranslations] = useState(false);

  // Complete translations data - all available translations
  const allTranslations = {
    en: {
      dashboard: 'Dashboard',
      corporations: 'Corporations',
      branches: 'Branches',
      departments: 'Departments',
      divisions: 'Divisions',
      employees: 'Employees',
      leaves: 'Leaves',
      attendance: 'Attendance',
      performance: 'Performance Reviews',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome',
      totalCorporations: 'Total Corporations',
      totalBranches: 'Total Branches',
      totalDepartments: 'Total Departments',
      totalDivisions: 'Total Divisions',
      totalEmployees: 'Total Employees',
      pendingLeaves: 'Pending Leaves',
      addNew: 'Add New',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      status: 'Status',
      actions: 'Actions',
      login: 'Login',
      register: 'Register',
      password: 'Password',
      fullName: 'Full Name',
      languageSettings: 'Language Settings',
      currencySettings: 'Currency Settings',
      selectLanguage: 'Select Language',
      selectCurrency: 'Select Currency',
      primaryLanguage: 'Primary Language',
      secondaryLanguage: 'Secondary Language',
      payroll: 'Payroll',
      recruitment: 'Recruitment',
      training: 'Training',
      expenses: 'Expenses',
      reports: 'Reports',
      notifications: 'Notifications',
      calendar: 'Calendar',
      documents: 'Documents',
      assets: 'Assets',
      travel: 'Travel',
      benefits: 'Benefits',
      tickets: 'Tickets',
      timesheets: 'Timesheets',
      overtime: 'Overtime',
      approvals: 'Approvals',
      submit: 'Submit',
      approve: 'Approve',
      reject: 'Reject',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      category: 'Category',
      priority: 'Priority',
      assignedTo: 'Assigned To',
      createdBy: 'Created By',
      dueDate: 'Due Date',
      startDate: 'Start Date',
      endDate: 'End Date',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax',
      discount: 'Discount',
      notes: 'Notes',
      comments: 'Comments',
      attachments: 'Attachments',
      upload: 'Upload',
      download: 'Download',
      export: 'Export',
      import: 'Import',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      profile: 'Profile',
      account: 'Account',
      security: 'Security',
      preferences: 'Preferences',
      help: 'Help',
      support: 'Support',
      contactUs: 'Contact Us',
      aboutUs: 'About Us',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service'
    },
    es: {
      dashboard: 'Panel',
      corporations: 'Corporaciones',
      branches: 'Sucursales',
      departments: 'Departamentos',
      divisions: 'Divisiones',
      employees: 'Empleados',
      leaves: 'Licencias',
      attendance: 'Asistencia',
      performance: 'Evaluaciones de Desempeño',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
      welcome: 'Bienvenido',
      totalCorporations: 'Total de Corporaciones',
      totalBranches: 'Total de Sucursales',
      totalDepartments: 'Total de Departamentos',
      totalDivisions: 'Total de Divisiones',
      totalEmployees: 'Total de Empleados',
      pendingLeaves: 'Licencias Pendientes',
      addNew: 'Agregar Nuevo',
      edit: 'Editar',
      delete: 'Eliminar',
      save: 'Guardar',
      cancel: 'Cancelar',
      search: 'Buscar',
      name: 'Nombre',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      address: 'Dirección',
      status: 'Estado',
      actions: 'Acciones',
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      password: 'Contraseña',
      fullName: 'Nombre Completo',
      languageSettings: 'Configuración de Idioma',
      currencySettings: 'Configuración de Moneda',
      selectLanguage: 'Seleccionar Idioma',
      selectCurrency: 'Seleccionar Moneda',
      primaryLanguage: 'Idioma Principal',
      secondaryLanguage: 'Idioma Secundario',
      payroll: 'Nómina',
      recruitment: 'Reclutamiento',
      training: 'Capacitación',
      expenses: 'Gastos',
      reports: 'Informes',
      notifications: 'Notificaciones',
      calendar: 'Calendario',
      documents: 'Documentos',
      assets: 'Activos',
      travel: 'Viajes',
      benefits: 'Beneficios',
      tickets: 'Tickets',
      timesheets: 'Hojas de Tiempo',
      overtime: 'Horas Extra',
      approvals: 'Aprobaciones',
      submit: 'Enviar',
      approve: 'Aprobar',
      reject: 'Rechazar',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      date: 'Fecha',
      amount: 'Monto',
      description: 'Descripción',
      category: 'Categoría',
      priority: 'Prioridad',
      assignedTo: 'Asignado A',
      createdBy: 'Creado Por',
      dueDate: 'Fecha de Vencimiento',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Impuesto',
      discount: 'Descuento',
      notes: 'Notas',
      comments: 'Comentarios',
      attachments: 'Adjuntos',
      upload: 'Subir',
      download: 'Descargar',
      export: 'Exportar',
      import: 'Importar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      refresh: 'Actualizar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      profile: 'Perfil',
      account: 'Cuenta',
      security: 'Seguridad',
      preferences: 'Preferencias',
      help: 'Ayuda',
      support: 'Soporte',
      contactUs: 'Contáctenos',
      aboutUs: 'Sobre Nosotros',
      privacyPolicy: 'Política de Privacidad',
      termsOfService: 'Términos de Servicio'
    },
    fr: {
      dashboard: 'Tableau de Bord',
      corporations: 'Entreprises',
      branches: 'Succursales',
      departments: 'Départements',
      divisions: 'Divisions',
      employees: 'Employés',
      leaves: 'Congés',
      attendance: 'Présence',
      performance: 'Évaluations de Performance',
      settings: 'Paramètres',
      logout: 'Déconnexion',
      welcome: 'Bienvenue',
      totalCorporations: 'Total des Entreprises',
      totalBranches: 'Total des Succursales',
      totalDepartments: 'Total des Départements',
      totalDivisions: 'Total des Divisions',
      totalEmployees: 'Total des Employés',
      pendingLeaves: 'Congés en Attente',
      addNew: 'Ajouter Nouveau',
      edit: 'Modifier',
      delete: 'Supprimer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      search: 'Rechercher',
      name: 'Nom',
      email: 'E-mail',
      phone: 'Téléphone',
      address: 'Adresse',
      status: 'Statut',
      actions: 'Actions',
      login: 'Connexion',
      register: "S'inscrire",
      password: 'Mot de Passe',
      fullName: 'Nom Complet',
      languageSettings: 'Paramètres de Langue',
      currencySettings: 'Paramètres de Devise',
      selectLanguage: 'Sélectionner la Langue',
      selectCurrency: 'Sélectionner la Devise',
      primaryLanguage: 'Langue Principale',
      secondaryLanguage: 'Langue Secondaire',
      payroll: 'Paie',
      recruitment: 'Recrutement',
      training: 'Formation',
      expenses: 'Dépenses',
      reports: 'Rapports',
      notifications: 'Notifications',
      calendar: 'Calendrier',
      documents: 'Documents',
      assets: 'Actifs',
      travel: 'Voyages',
      benefits: 'Avantages',
      tickets: 'Tickets',
      timesheets: 'Feuilles de Temps',
      overtime: 'Heures Supplémentaires',
      approvals: 'Approbations',
      submit: 'Soumettre',
      approve: 'Approuver',
      reject: 'Rejeter',
      pending: 'En Attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      date: 'Date',
      amount: 'Montant',
      description: 'Description',
      category: 'Catégorie',
      priority: 'Priorité',
      assignedTo: 'Assigné À',
      createdBy: 'Créé Par',
      dueDate: "Date d'Échéance",
      startDate: 'Date de Début',
      endDate: 'Date de Fin',
      total: 'Total',
      subtotal: 'Sous-total',
      tax: 'Taxe',
      discount: 'Remise',
      notes: 'Notes',
      comments: 'Commentaires',
      attachments: 'Pièces Jointes',
      upload: 'Télécharger',
      download: 'Télécharger',
      export: 'Exporter',
      import: 'Importer',
      filter: 'Filtrer',
      sort: 'Trier',
      refresh: 'Actualiser',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      profile: 'Profil',
      account: 'Compte',
      security: 'Sécurité',
      preferences: 'Préférences',
      help: 'Aide',
      support: 'Support',
      contactUs: 'Contactez-nous',
      aboutUs: 'À Propos',
      privacyPolicy: 'Politique de Confidentialité',
      termsOfService: "Conditions d'Utilisation"
    },
    ar: {
      dashboard: 'لوحة التحكم',
      corporations: 'الشركات',
      branches: 'الفروع',
      departments: 'الأقسام',
      divisions: 'الأقسام الفرعية',
      employees: 'الموظفون',
      leaves: 'الإجازات',
      attendance: 'الحضور',
      performance: 'تقييمات الأداء',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً',
      totalCorporations: 'إجمالي الشركات',
      totalBranches: 'إجمالي الفروع',
      totalDepartments: 'إجمالي الأقسام',
      totalDivisions: 'إجمالي الأقسام الفرعية',
      totalEmployees: 'إجمالي الموظفين',
      pendingLeaves: 'الإجازات المعلقة',
      addNew: 'إضافة جديد',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      search: 'بحث',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      address: 'العنوان',
      status: 'الحالة',
      actions: 'الإجراءات',
      login: 'تسجيل الدخول',
      register: 'التسجيل',
      password: 'كلمة المرور',
      fullName: 'الاسم الكامل',
      languageSettings: 'إعدادات اللغة',
      currencySettings: 'إعدادات العملة',
      selectLanguage: 'اختر اللغة',
      selectCurrency: 'اختر العملة',
      primaryLanguage: 'اللغة الأساسية',
      secondaryLanguage: 'اللغة الثانوية',
      payroll: 'الرواتب',
      recruitment: 'التوظيف',
      training: 'التدريب',
      expenses: 'المصروفات',
      reports: 'التقارير',
      notifications: 'الإشعارات',
      calendar: 'التقويم',
      documents: 'المستندات',
      assets: 'الأصول',
      travel: 'السفر',
      benefits: 'المزايا',
      tickets: 'التذاكر',
      timesheets: 'سجلات الوقت',
      overtime: 'العمل الإضافي',
      approvals: 'الموافقات',
      submit: 'إرسال',
      approve: 'موافقة',
      reject: 'رفض',
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      date: 'التاريخ',
      amount: 'المبلغ',
      description: 'الوصف',
      category: 'الفئة',
      priority: 'الأولوية',
      assignedTo: 'مسند إلى',
      createdBy: 'أنشئ بواسطة',
      dueDate: 'تاريخ الاستحقاق',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      total: 'المجموع',
      subtotal: 'المجموع الفرعي',
      tax: 'الضريبة',
      discount: 'الخصم',
      notes: 'ملاحظات',
      comments: 'تعليقات',
      attachments: 'المرفقات',
      upload: 'رفع',
      download: 'تحميل',
      export: 'تصدير',
      import: 'استيراد',
      filter: 'تصفية',
      sort: 'ترتيب',
      refresh: 'تحديث',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      profile: 'الملف الشخصي',
      account: 'الحساب',
      security: 'الأمان',
      preferences: 'التفضيلات',
      help: 'مساعدة',
      support: 'الدعم',
      contactUs: 'اتصل بنا',
      aboutUs: 'من نحن',
      privacyPolicy: 'سياسة الخصوصية',
      termsOfService: 'شروط الخدمة'
    },
    de: {
      dashboard: 'Dashboard',
      corporations: 'Unternehmen',
      branches: 'Filialen',
      departments: 'Abteilungen',
      divisions: 'Bereiche',
      employees: 'Mitarbeiter',
      leaves: 'Urlaub',
      attendance: 'Anwesenheit',
      performance: 'Leistungsbeurteilungen',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      welcome: 'Willkommen',
      totalCorporations: 'Gesamtzahl der Unternehmen',
      totalBranches: 'Gesamtzahl der Filialen',
      totalDepartments: 'Gesamtzahl der Abteilungen',
      totalDivisions: 'Gesamtzahl der Bereiche',
      totalEmployees: 'Gesamtzahl der Mitarbeiter',
      pendingLeaves: 'Ausstehende Urlaubsanträge',
      addNew: 'Neu Hinzufügen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      search: 'Suchen',
      name: 'Name',
      email: 'E-Mail',
      phone: 'Telefon',
      address: 'Adresse',
      status: 'Status',
      actions: 'Aktionen',
      login: 'Anmelden',
      register: 'Registrieren',
      password: 'Passwort',
      fullName: 'Vollständiger Name',
      languageSettings: 'Spracheinstellungen',
      currencySettings: 'Währungseinstellungen',
      selectLanguage: 'Sprache Auswählen',
      selectCurrency: 'Währung Auswählen',
      primaryLanguage: 'Hauptsprache',
      secondaryLanguage: 'Zweitsprache',
      payroll: 'Gehaltsabrechnung',
      recruitment: 'Rekrutierung',
      training: 'Schulung',
      expenses: 'Ausgaben',
      reports: 'Berichte',
      notifications: 'Benachrichtigungen',
      calendar: 'Kalender',
      documents: 'Dokumente',
      assets: 'Vermögenswerte',
      travel: 'Reisen',
      benefits: 'Leistungen',
      tickets: 'Tickets',
      timesheets: 'Zeiterfassung',
      overtime: 'Überstunden',
      approvals: 'Genehmigungen',
      submit: 'Einreichen',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      date: 'Datum',
      amount: 'Betrag',
      description: 'Beschreibung',
      category: 'Kategorie',
      priority: 'Priorität',
      assignedTo: 'Zugewiesen An',
      createdBy: 'Erstellt Von',
      dueDate: 'Fälligkeitsdatum',
      startDate: 'Startdatum',
      endDate: 'Enddatum',
      total: 'Gesamt',
      subtotal: 'Zwischensumme',
      tax: 'Steuer',
      discount: 'Rabatt',
      notes: 'Notizen',
      comments: 'Kommentare',
      attachments: 'Anhänge',
      upload: 'Hochladen',
      download: 'Herunterladen',
      export: 'Exportieren',
      import: 'Importieren',
      filter: 'Filtern',
      sort: 'Sortieren',
      refresh: 'Aktualisieren',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Vorherige',
      profile: 'Profil',
      account: 'Konto',
      security: 'Sicherheit',
      preferences: 'Einstellungen',
      help: 'Hilfe',
      support: 'Support',
      contactUs: 'Kontaktieren Sie Uns',
      aboutUs: 'Über Uns',
      privacyPolicy: 'Datenschutzrichtlinie',
      termsOfService: 'Nutzungsbedingungen'
    },
    zh: {
      dashboard: '仪表板',
      corporations: '公司',
      branches: '分支机构',
      departments: '部门',
      divisions: '分部',
      employees: '员工',
      leaves: '休假',
      attendance: '考勤',
      performance: '绩效评估',
      settings: '设置',
      logout: '登出',
      welcome: '欢迎',
      totalCorporations: '公司总数',
      totalBranches: '分支机构总数',
      totalDepartments: '部门总数',
      totalDivisions: '分部总数',
      totalEmployees: '员工总数',
      pendingLeaves: '待处理休假',
      addNew: '添加新',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      cancel: '取消',
      search: '搜索',
      name: '姓名',
      email: '电子邮件',
      phone: '电话',
      address: '地址',
      status: '状态',
      actions: '操作',
      login: '登录',
      register: '注册',
      password: '密码',
      fullName: '全名',
      languageSettings: '语言设置',
      currencySettings: '货币设置',
      selectLanguage: '选择语言',
      selectCurrency: '选择货币',
      primaryLanguage: '主要语言',
      secondaryLanguage: '次要语言',
      payroll: '工资单',
      recruitment: '招聘',
      training: '培训',
      expenses: '费用',
      reports: '报告',
      notifications: '通知',
      calendar: '日历',
      documents: '文档',
      assets: '资产',
      travel: '差旅',
      benefits: '福利',
      tickets: '工单',
      timesheets: '工时表',
      overtime: '加班',
      approvals: '审批',
      submit: '提交',
      approve: '批准',
      reject: '拒绝',
      pending: '待处理',
      approved: '已批准',
      rejected: '已拒绝',
      date: '日期',
      amount: '金额',
      description: '描述',
      category: '类别',
      priority: '优先级',
      assignedTo: '分配给',
      createdBy: '创建者',
      dueDate: '截止日期',
      startDate: '开始日期',
      endDate: '结束日期',
      total: '总计',
      subtotal: '小计',
      tax: '税',
      discount: '折扣',
      notes: '备注',
      comments: '评论',
      attachments: '附件',
      upload: '上传',
      download: '下载',
      export: '导出',
      import: '导入',
      filter: '筛选',
      sort: '排序',
      refresh: '刷新',
      back: '返回',
      next: '下一个',
      previous: '上一个',
      profile: '个人资料',
      account: '账户',
      security: '安全',
      preferences: '偏好设置',
      help: '帮助',
      support: '支持',
      contactUs: '联系我们',
      aboutUs: '关于我们',
      privacyPolicy: '隐私政策',
      termsOfService: '服务条款'
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCustomTranslations();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      // Ensure all nested objects exist
      const data = {
        ...response.data,
        enabled_currencies: response.data.enabled_currencies || [response.data.currency || 'USD'],
        smtp: response.data.smtp || {
          enabled: false,
          host: '',
          port: 587,
          username: '',
          password: '',
          from_email: '',
          from_name: '',
          encryption: 'tls',
          verified: false
        },
        sms: response.data.sms || {
          enabled: false,
          provider: 'twilio',
          api_key: '',
          api_secret: '',
          sender_id: '',
          account_sid: '',
          verified: false
        }
      };
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchCustomTranslations = async () => {
    try {
      const response = await axios.get(`${API}/translations`);
      setCustomTranslations(response.data || {});
    } catch (error) {
      console.error('Failed to fetch custom translations:', error);
    }
  };

  const saveTranslationKey = async () => {
    if (!newKeyForm.key.trim() || !newKeyForm.english.trim()) {
      toast.error('Key and English text are required');
      return;
    }

    setSavingTranslations(true);
    try {
      const translationData = {
        key: newKeyForm.key.trim().toLowerCase().replace(/\s+/g, '_'),
        translations: {
          en: newKeyForm.english.trim(),
          ...newKeyForm.translations
        }
      };

      await axios.post(`${API}/translations`, translationData);
      toast.success('Translation key added successfully');
      setAddKeyDialogOpen(false);
      setNewKeyForm({ key: '', english: '', translations: {} });
      fetchCustomTranslations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save translation');
    } finally {
      setSavingTranslations(false);
    }
  };

  const updateTranslation = async (key, lang, value) => {
    try {
      await axios.put(`${API}/translations/${key}`, {
        language: lang,
        value: value
      });
      toast.success('Translation updated');
      fetchCustomTranslations();
    } catch (error) {
      toast.error('Failed to update translation');
    }
  };

  const deleteTranslationKey = async (key) => {
    if (!window.confirm(`Are you sure you want to delete the translation key "${key}"?`)) return;
    
    try {
      await axios.delete(`${API}/translations/${key}`);
      toast.success('Translation key deleted');
      fetchCustomTranslations();
    } catch (error) {
      toast.error('Failed to delete translation key');
    }
  };

  // Filtered translations based on search - includes both built-in and custom translations
  const filteredTranslations = useMemo(() => {
    const baseLanguage = 'en'; // Always show English as the base
    const targetLang = selectedTranslationLang || settings.language_2 || 'es';
    const baseTranslations = allTranslations[baseLanguage] || {};
    const targetTranslations = allTranslations[targetLang] || {};
    
    // Merge built-in translations with custom translations
    const customEnglish = {};
    const customTarget = {};
    
    Object.entries(customTranslations).forEach(([key, langs]) => {
      if (langs.en) customEnglish[key] = langs.en;
      if (langs[targetLang]) customTarget[key] = langs[targetLang];
    });
    
    const mergedBase = { ...baseTranslations, ...customEnglish };
    const mergedTarget = { ...targetTranslations, ...customTarget };
    
    const translationKeys = [...new Set([...Object.keys(mergedBase), ...Object.keys(customTranslations)])];
    
    if (!translationSearch.trim()) {
      return translationKeys.map(key => ({
        key,
        english: mergedBase[key] || key,
        translated: editedTranslations[`${targetLang}.${key}`] ?? mergedTarget[key] ?? '',
        isCustom: !!customTranslations[key]
      }));
    }
    
    const searchLower = translationSearch.toLowerCase();
    return translationKeys
      .filter(key => 
        key.toLowerCase().includes(searchLower) ||
        (mergedBase[key] || '').toLowerCase().includes(searchLower) ||
        (mergedTarget[key] || '').toLowerCase().includes(searchLower)
      )
      .map(key => ({
        key,
        english: mergedBase[key] || key,
        translated: editedTranslations[`${targetLang}.${key}`] ?? mergedTarget[key] ?? '',
        isCustom: !!customTranslations[key]
      }));
  }, [translationSearch, selectedTranslationLang, settings.language_2, editedTranslations, customTranslations]);

  // Get language name from code
  const getLanguageName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  // All languages available for translation (excluding English which is base)
  const availableTranslationLanguages = languages.filter(lang => lang.code !== 'en');

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success('Settings updated successfully');
      await refreshSettings();
      await refreshCurrencySettings();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const testSmtpConnection = async () => {
    setTestingSmtp(true);
    try {
      const response = await axios.post(`${API}/settings/test-smtp`, settings.smtp);
      if (response.data.success) {
        toast.success('SMTP connection successful!');
        setSettings(prev => ({
          ...prev,
          smtp: { ...prev.smtp, verified: true }
        }));
      } else {
        toast.error(response.data.message || 'SMTP connection failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to test SMTP connection');
    } finally {
      setTestingSmtp(false);
    }
  };

  const testSmsConnection = async () => {
    setTestingSms(true);
    try {
      const response = await axios.post(`${API}/settings/test-sms`, settings.sms);
      if (response.data.success) {
        toast.success('SMS connection successful!');
        setSettings(prev => ({
          ...prev,
          sms: { ...prev.sms, verified: true }
        }));
      } else {
        toast.error(response.data.message || 'SMS connection failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to test SMS connection');
    } finally {
      setTestingSms(false);
    }
  };

  const updateSmtpSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      smtp: { ...prev.smtp, [key]: value, verified: false }
    }));
  };

  const updateSmsSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      sms: { ...prev.sms, [key]: value, verified: false }
    }));
  };

  const updateExchangeRate = (currency, rate) => {
    setSettings(prev => ({
      ...prev,
      exchange_rates: {
        ...prev.exchange_rates,
        [currency]: parseFloat(rate) || 1.0
      }
    }));
  };

  const toggleCurrency = (currencyCode) => {
    setSettings(prev => {
      const enabled = prev.enabled_currencies || [];
      if (enabled.includes(currencyCode)) {
        // Don't allow removing the default currency
        if (currencyCode === prev.currency) {
          toast.error('Cannot disable the default currency');
          return prev;
        }
        return {
          ...prev,
          enabled_currencies: enabled.filter(c => c !== currencyCode)
        };
      } else {
        return {
          ...prev,
          enabled_currencies: [...enabled, currencyCode],
          exchange_rates: {
            ...prev.exchange_rates,
            [currencyCode]: prev.exchange_rates[currencyCode] || 1.0
          }
        };
      }
    });
  };

  // Top 50 most used languages worldwide
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese (中文)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'ar', name: 'Arabic (العربية)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'pt', name: 'Portuguese (Português)' },
    { code: 'ru', name: 'Russian (Русский)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'jv', name: 'Javanese (Basa Jawa)' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'tr', name: 'Turkish (Türkçe)' },
    { code: 'ur', name: 'Urdu (اردو)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'th', name: 'Thai (ไทย)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { code: 'pl', name: 'Polish (Polski)' },
    { code: 'uk', name: 'Ukrainian (Українська)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
    { code: 'my', name: 'Burmese (မြန်မာ)' },
    { code: 'fa', name: 'Persian (فارسی)' },
    { code: 'sw', name: 'Swahili (Kiswahili)' },
    { code: 'ro', name: 'Romanian (Română)' },
    { code: 'nl', name: 'Dutch (Nederlands)' },
    { code: 'hu', name: 'Hungarian (Magyar)' },
    { code: 'el', name: 'Greek (Ελληνικά)' },
    { code: 'cs', name: 'Czech (Čeština)' },
    { code: 'sv', name: 'Swedish (Svenska)' },
    { code: 'he', name: 'Hebrew (עברית)' },
    { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
    { code: 'ms', name: 'Malay (Bahasa Melayu)' },
    { code: 'tl', name: 'Filipino (Tagalog)' },
    { code: 'da', name: 'Danish (Dansk)' },
    { code: 'fi', name: 'Finnish (Suomi)' },
    { code: 'no', name: 'Norwegian (Norsk)' },
    { code: 'sk', name: 'Slovak (Slovenčina)' },
    { code: 'bg', name: 'Bulgarian (Български)' },
    { code: 'sr', name: 'Serbian (Српски)' },
    { code: 'hr', name: 'Croatian (Hrvatski)' },
    { code: 'lt', name: 'Lithuanian (Lietuvių)' },
    { code: 'sl', name: 'Slovenian (Slovenščina)' }
  ];

  // Comprehensive currency list (50+ currencies)
  const allCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'COP', name: 'Colombian Peso', symbol: '$' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
    { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    // Egyptian Currency
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م' },
    // Gulf (GCC) Currencies
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع' },
    // Other currencies
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ' },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
    { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د' },
    { code: 'SYP', name: 'Syrian Pound', symbol: 'ل.س' },
    { code: 'YER', name: 'Yemeni Rial', symbol: 'ر.ي' },
    { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د' },
    { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' },
    { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س' }
  ];

  const enabledCurrencies = settings.enabled_currencies || ['USD'];

  return (
    <div data-testid="settings-page">
      <h1 className="text-4xl font-black text-slate-900 mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {t('settings')}
      </h1>

      <div className="grid gap-6">
        {/* Roles & Permissions Card */}
        <div 
          onClick={() => navigate('/settings/roles')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 cursor-pointer hover:shadow-md transition-all duration-300 card-hover"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="text-purple-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Roles & Permissions</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Manage user roles and access control permissions
                </p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={24} />
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="text-blue-600" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('languageSettings')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                {t('primaryLanguage')}
              </label>
              <Select 
                value={settings.language_1} 
                onValueChange={(value) => setSettings({ ...settings, language_1: value })}
              >
                <SelectTrigger data-testid="primary-language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Main language for the application interface</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                {t('secondaryLanguage')} (Optional)
              </label>
              <Select 
                value={settings.language_2 || 'none'} 
                onValueChange={(value) => setSettings({ ...settings, language_2: value === 'none' ? '' : value })}
              >
                <SelectTrigger data-testid="secondary-language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">None</SelectItem>
                  {languages.filter(l => l.code !== settings.language_1).map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Secondary language for bilingual support</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>50 languages available</strong> including English, Chinese, Hindi, Spanish, Arabic, Bengali, Portuguese, Russian, Japanese, and more.
            </p>
          </div>
        </div>

        {/* Translation Management Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Languages className="text-violet-600" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Translation Management</h2>
                <p className="text-sm text-slate-500">View and manage translations for all supported languages</p>
              </div>
            </div>
            <Button
              onClick={() => setAddKeyDialogOpen(true)}
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="add-translation-key-btn"
            >
              <Plus size={16} className="mr-2" />
              Add Key
            </Button>
          </div>

          {/* Translation Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Language Selector */}
            <div className="flex-1 md:max-w-xs">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Select Language to View
              </label>
              <Select 
                value={selectedTranslationLang || settings.language_2 || 'es'} 
                onValueChange={(value) => setSelectedTranslationLang(value)}
              >
                <SelectTrigger data-testid="translation-language-select">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableTranslationLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Search Translations
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search by key, English, or translated text..."
                  value={translationSearch}
                  onChange={(e) => setTranslationSearch(e.target.value)}
                  className="pl-10"
                  data-testid="translation-search-input"
                />
              </div>
            </div>
          </div>

          {/* Translation Info Banner */}
          <div className="mb-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-violet-600" />
              <p className="text-sm text-violet-700">
                Showing <strong>{filteredTranslations.length}</strong> translation keys • 
                Base: <strong>English</strong> → Target: <strong>{getLanguageName(selectedTranslationLang || settings.language_2 || 'es')}</strong>
              </p>
            </div>
          </div>

          {/* Translations Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200">
              <div className="col-span-3 px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Key
              </div>
              <div className="col-span-4 px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                English (Base)
              </div>
              <div className="col-span-4 px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                {getLanguageName(selectedTranslationLang || settings.language_2 || 'es')}
                <span className="text-xs font-normal text-slate-400">(Translation)</span>
              </div>
              <div className="col-span-1 px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredTranslations.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Search size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No translations match your search criteria</p>
                </div>
              ) : (
                filteredTranslations.map((item, index) => (
                  <div 
                    key={item.key}
                    className={`grid grid-cols-12 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <div className="col-span-3 px-4 py-3 flex items-center gap-2">
                      <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                        {item.key}
                      </code>
                      {item.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="col-span-4 px-4 py-3 text-sm text-slate-700">
                      {item.english}
                    </div>
                    <div className="col-span-4 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm flex-1 ${
                          item.translated 
                            ? 'text-slate-900' 
                            : 'text-slate-400 italic'
                        }`}>
                          {item.translated || 'Not translated'}
                        </span>
                        {item.translated && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Translated" />
                        )}
                        {!item.translated && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Missing translation" />
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 px-4 py-3 flex items-center justify-center">
                      {item.isCustom && (
                        <button
                          onClick={() => deleteTranslationKey(item.key)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete translation key"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Translation Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {filteredTranslations.filter(t => t.translated).length}
              </p>
              <p className="text-xs text-emerald-600">Translated</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">
                {filteredTranslations.filter(t => !t.translated).length}
              </p>
              <p className="text-xs text-amber-600">Missing</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">
                {Object.keys(allTranslations).length}
              </p>
              <p className="text-xs text-blue-600">Languages</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-violet-700">
                {Object.keys(allTranslations.en || {}).length}
              </p>
              <p className="text-xs text-violet-600">Total Keys</p>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('currencySettings')}</h2>
          </div>
          
          <div className="space-y-6">
            {/* Default Currency */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Default Currency
                </label>
                <Select 
                  value={settings.currency} 
                  onValueChange={(value) => {
                    setSettings(prev => ({ 
                      ...prev, 
                      currency: value,
                      enabled_currencies: prev.enabled_currencies?.includes(value) 
                        ? prev.enabled_currencies 
                        : [...(prev.enabled_currencies || []), value]
                    }));
                  }}
                >
                  <SelectTrigger data-testid="currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {allCurrencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name} ({curr.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Primary currency for the organization</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Enabled Currencies ({enabledCurrencies.length})
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50 min-h-[48px]">
                  {enabledCurrencies.map(code => {
                    const curr = allCurrencies.find(c => c.code === code);
                    return (
                      <span 
                        key={code}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          code === settings.currency 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {code}
                        {code !== settings.currency && (
                          <button 
                            type="button"
                            onClick={() => toggleCurrency(code)}
                            className="hover:text-red-600"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Add Currencies */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Add More Currencies
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                {allCurrencies
                  .filter(c => !enabledCurrencies.includes(c.code))
                  .map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => toggleCurrency(curr.code)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 transition-colors text-left"
                    >
                      <Plus size={12} className="text-slate-400" />
                      <span className="font-medium">{curr.code}</span>
                      <span className="text-slate-400 truncate">{curr.symbol}</span>
                    </button>
                  ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Click to enable a currency for use across the platform</p>
            </div>

            {/* Exchange Rates */}
            {enabledCurrencies.length > 1 && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Exchange Rates (relative to {settings.currency})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {enabledCurrencies
                    .filter(c => c !== settings.currency)
                    .map((currCode) => {
                      const curr = allCurrencies.find(c => c.code === currCode);
                      return (
                        <div key={currCode} className="p-3 bg-slate-50 rounded-lg">
                          <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                            <span className="font-bold">{currCode}</span>
                            <span className="text-slate-400 text-xs">{curr?.symbol}</span>
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            data-testid={`exchange-rate-${currCode}`}
                            value={settings.exchange_rates[currCode] || 1.0}
                            onChange={(e) => updateExchangeRate(currCode, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 outline-none text-sm"
                          />
                        </div>
                      );
                    })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Enter how many units of each currency equal 1 {settings.currency}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SMTP Integration Settings */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mail className="text-orange-600" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">SMTP Email Integration</h2>
                <p className="text-sm text-slate-500">Configure custom email server for sending notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {settings.smtp?.verified && (
                <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} />
                  Verified
                </span>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smtp?.enabled || false}
                  onChange={(e) => updateSmtpSetting('enabled', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Enable</span>
              </label>
            </div>
          </div>

          {settings.smtp?.enabled && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">SMTP Host *</label>
                  <input
                    type="text"
                    placeholder="smtp.example.com"
                    value={settings.smtp?.host || ''}
                    onChange={(e) => updateSmtpSetting('host', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Port *</label>
                  <input
                    type="number"
                    placeholder="587"
                    value={settings.smtp?.port || 587}
                    onChange={(e) => updateSmtpSetting('port', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Username *</label>
                  <input
                    type="text"
                    placeholder="your-email@example.com"
                    value={settings.smtp?.username || ''}
                    onChange={(e) => updateSmtpSetting('username', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password *</label>
                  <div className="relative">
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={settings.smtp?.password || ''}
                      onChange={(e) => updateSmtpSetting('password', e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSmtpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">From Email *</label>
                  <input
                    type="email"
                    placeholder="noreply@yourcompany.com"
                    value={settings.smtp?.from_email || ''}
                    onChange={(e) => updateSmtpSetting('from_email', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">From Name</label>
                  <input
                    type="text"
                    placeholder="HR Platform"
                    value={settings.smtp?.from_name || ''}
                    onChange={(e) => updateSmtpSetting('from_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Encryption</label>
                <Select 
                  value={settings.smtp?.encryption || 'tls'} 
                  onValueChange={(value) => updateSmtpSetting('encryption', value)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={testSmtpConnection}
                  disabled={testingSmtp || !settings.smtp?.host || !settings.smtp?.username}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TestTube size={16} />
                  {testingSmtp ? 'Testing...' : 'Test Connection'}
                </Button>
                <p className="text-xs text-slate-500">Test your SMTP configuration before saving</p>
              </div>
            </div>
          )}

          {!settings.smtp?.enabled && (
            <div className="text-center py-8 text-slate-500">
              <Mail size={40} className="mx-auto mb-3 opacity-30" />
              <p>Enable SMTP integration to send emails via your own mail server</p>
            </div>
          )}
        </div>

        {/* SMS Integration Settings */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <MessageSquare className="text-violet-600" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">SMS Integration</h2>
                <p className="text-sm text-slate-500">Configure SMS provider for sending text notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {settings.sms?.verified && (
                <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} />
                  Verified
                </span>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sms?.enabled || false}
                  onChange={(e) => updateSmsSetting('enabled', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Enable</span>
              </label>
            </div>
          </div>

          {settings.sms?.enabled && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">SMS Provider *</label>
                <Select 
                  value={settings.sms?.provider || 'twilio'} 
                  onValueChange={(value) => updateSmsSetting('provider', value)}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                    <SelectItem value="messagebird">MessageBird</SelectItem>
                    <SelectItem value="plivo">Plivo</SelectItem>
                    <SelectItem value="sns">AWS SNS</SelectItem>
                    <SelectItem value="africas_talking">Africa&apos;s Talking</SelectItem>
                    <SelectItem value="infobip">Infobip</SelectItem>
                    <SelectItem value="clicksend">ClickSend</SelectItem>
                    <SelectItem value="custom">Custom Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Provider Settings */}
              {settings.sms?.provider === 'custom' && (
                <div className="space-y-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
                  <h4 className="font-medium text-slate-900">Custom SMS Provider Configuration</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Provider Name</label>
                      <input
                        type="text"
                        placeholder="My SMS Provider"
                        value={settings.sms?.custom_provider_name || ''}
                        onChange={(e) => updateSmsSetting('custom_provider_name', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">API Base URL *</label>
                      <input
                        type="url"
                        placeholder="https://api.smsprovider.com/v1"
                        value={settings.sms?.custom_api_url || ''}
                        onChange={(e) => updateSmsSetting('custom_api_url', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">API Key *</label>
                      <input
                        type="text"
                        placeholder="Your API Key"
                        value={settings.sms?.api_key || ''}
                        onChange={(e) => updateSmsSetting('api_key', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">API Secret</label>
                      <div className="relative">
                        <input
                          type={showSmsSecret ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={settings.sms?.api_secret || ''}
                          onChange={(e) => updateSmsSetting('api_secret', e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmsSecret(!showSmsSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showSmsSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Authentication Type</label>
                    <Select 
                      value={settings.sms?.custom_auth_type || 'bearer'} 
                      onValueChange={(value) => updateSmsSetting('custom_auth_type', value)}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="api_key_header">API Key in Header</SelectItem>
                        <SelectItem value="api_key_query">API Key in Query Params</SelectItem>
                        <SelectItem value="custom_header">Custom Header</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.sms?.custom_auth_type === 'custom_header' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Header Name</label>
                        <input
                          type="text"
                          placeholder="X-API-Key"
                          value={settings.sms?.custom_header_name || ''}
                          onChange={(e) => updateSmsSetting('custom_header_name', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Header Value</label>
                        <input
                          type="text"
                          placeholder="Your header value"
                          value={settings.sms?.custom_header_value || ''}
                          onChange={(e) => updateSmsSetting('custom_header_value', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">HTTP Method</label>
                    <Select 
                      value={settings.sms?.custom_http_method || 'POST'} 
                      onValueChange={(value) => updateSmsSetting('custom_http_method', value)}
                    >
                      <SelectTrigger className="w-full md:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Request Body Template (JSON)</label>
                    <textarea
                      rows={4}
                      placeholder='{"to": "{{phone}}", "message": "{{message}}", "from": "{{sender_id}}"}'
                      value={settings.sms?.custom_body_template || ''}
                      onChange={(e) => updateSmsSetting('custom_body_template', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Use placeholders: {'{{phone}}'}, {'{{message}}'}, {'{{sender_id}}'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Additional Headers (JSON)</label>
                    <textarea
                      rows={2}
                      placeholder='{"Content-Type": "application/json"}'
                      value={settings.sms?.custom_headers || ''}
                      onChange={(e) => updateSmsSetting('custom_headers', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {settings.sms?.provider === 'twilio' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Account SID *</label>
                    <input
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.sms?.account_sid || ''}
                      onChange={(e) => updateSmsSetting('account_sid', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Auth Token *</label>
                    <div className="relative">
                      <input
                        type={showSmsSecret ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={settings.sms?.api_secret || ''}
                        onChange={(e) => updateSmsSetting('api_secret', e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmsSecret(!showSmsSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSmsSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settings.sms?.provider !== 'twilio' && settings.sms?.provider !== 'custom' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">API Key *</label>
                    <input
                      type="text"
                      placeholder="Your API Key"
                      value={settings.sms?.api_key || ''}
                      onChange={(e) => updateSmsSetting('api_key', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">API Secret *</label>
                    <div className="relative">
                      <input
                        type={showSmsSecret ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={settings.sms?.api_secret || ''}
                        onChange={(e) => updateSmsSetting('api_secret', e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmsSecret(!showSmsSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSmsSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Sender ID / Phone Number *</label>
                <input
                  type="text"
                  placeholder="+1234567890 or COMPANY"
                  value={settings.sms?.sender_id || ''}
                  onChange={(e) => updateSmsSetting('sender_id', e.target.value)}
                  className="w-full md:w-64 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Phone number with country code or alphanumeric sender ID</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={testSmsConnection}
                  disabled={testingSms || !settings.sms?.sender_id}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TestTube size={16} />
                  {testingSms ? 'Testing...' : 'Test Connection'}
                </Button>
                <p className="text-xs text-slate-500">Validate your SMS provider credentials</p>
              </div>
            </div>
          )}

          {!settings.sms?.enabled && (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p>Enable SMS integration to send text message notifications</p>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave}
          data-testid="save-settings-button"
          disabled={loading}
          className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-xl w-fit px-8"
        >
          {loading ? 'Saving...' : t('save')}
        </Button>
      </div>

      {/* Add Translation Key Dialog */}
      {addKeyDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Plus className="text-violet-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Add Translation Key</h3>
                    <p className="text-sm text-slate-500">Create a new translation entry for all languages</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAddKeyDialogOpen(false);
                    setNewKeyForm({ key: '', english: '', translations: {} });
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Key Name */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Translation Key <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., welcome_message, button_submit"
                  value={newKeyForm.key}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, key: e.target.value })}
                  className="font-mono"
                  data-testid="new-translation-key-input"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use lowercase with underscores (e.g., my_custom_key)
                </p>
              </div>

              {/* English (Base) */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  English (Base) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter the English text"
                  value={newKeyForm.english}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, english: e.target.value })}
                  data-testid="new-translation-english-input"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Languages size={16} />
                  Translations (Optional)
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Add translations for other languages. You can add more translations later.
                </p>
              </div>

              {/* Popular Languages Quick Add */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { code: 'es', name: 'Spanish (Español)' },
                  { code: 'fr', name: 'French (Français)' },
                  { code: 'ar', name: 'Arabic (العربية)' },
                  { code: 'de', name: 'German (Deutsch)' },
                  { code: 'zh', name: 'Chinese (中文)' },
                  { code: 'hi', name: 'Hindi (हिन्दी)' },
                  { code: 'pt', name: 'Portuguese (Português)' },
                  { code: 'ru', name: 'Russian (Русский)' },
                ].map((lang) => (
                  <div key={lang.code}>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      {lang.name}
                    </label>
                    <Input
                      type="text"
                      placeholder={`Translation in ${lang.name.split(' ')[0]}`}
                      value={newKeyForm.translations[lang.code] || ''}
                      onChange={(e) => setNewKeyForm({
                        ...newKeyForm,
                        translations: {
                          ...newKeyForm.translations,
                          [lang.code]: e.target.value
                        }
                      })}
                      data-testid={`new-translation-${lang.code}-input`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAddKeyDialogOpen(false);
                  setNewKeyForm({ key: '', english: '', translations: {} });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={saveTranslationKey}
                disabled={savingTranslations || !newKeyForm.key.trim() || !newKeyForm.english.trim()}
                className="bg-violet-600 hover:bg-violet-700"
                data-testid="save-translation-key-btn"
              >
                {savingTranslations ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Translation Key
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
