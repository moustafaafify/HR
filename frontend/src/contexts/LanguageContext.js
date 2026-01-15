import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LanguageContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const translations = {
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
    secondaryLanguage: 'Secondary Language'
  },
  es: {
    dashboard: 'Panel',
    corporations: 'Corporaciones',
    branches: 'Sucursales',
    employees: 'Empleados',
    leaves: 'Licencias',
    attendance: 'Asistencia',
    performance: 'Evaluaciones de Desempeño',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    welcome: 'Bienvenido',
    totalCorporations: 'Total de Corporaciones',
    totalBranches: 'Total de Sucursales',
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
    secondaryLanguage: 'Idioma Secundario'
  },
  fr: {
    dashboard: 'Tableau de Bord',
    corporations: 'Entreprises',
    branches: 'Succursales',
    employees: 'Employés',
    leaves: 'Congés',
    attendance: 'Présence',
    performance: 'Évaluations de Performance',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    welcome: 'Bienvenue',
    totalCorporations: 'Total des Entreprises',
    totalBranches: 'Total des Succursales',
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
    secondaryLanguage: 'Langue Secondaire'
  },
  de: {
    dashboard: 'Dashboard',
    corporations: 'Unternehmen',
    branches: 'Filialen',
    employees: 'Mitarbeiter',
    leaves: 'Urlaub',
    attendance: 'Anwesenheit',
    performance: 'Leistungsbeurteilungen',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    welcome: 'Willkommen',
    totalCorporations: 'Gesamtzahl der Unternehmen',
    totalBranches: 'Gesamtzahl der Filialen',
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
    secondaryLanguage: 'Zweitsprache'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    corporations: 'الشركات',
    branches: 'الفروع',
    employees: 'الموظفون',
    leaves: 'الإجازات',
    attendance: 'الحضور',
    performance: 'تقييمات الأداء',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً',
    totalCorporations: 'إجمالي الشركات',
    totalBranches: 'إجمالي الفروع',
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
    secondaryLanguage: 'اللغة الثانوية'
  },
  zh: {
    dashboard: '仪表板',
    corporations: '公司',
    branches: '分支机构',
    employees: '员工',
    leaves: '休假',
    attendance: '考勤',
    performance: '绩效评估',
    settings: '设置',
    logout: '登出',
    welcome: '欢迎',
    totalCorporations: '公司总数',
    totalBranches: '分支机构总数',
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
    secondaryLanguage: '次要语言'
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState(['en']);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const settings = response.data;
      const langs = [settings.language_1];
      if (settings.language_2) {
        langs.push(settings.language_2);
      }
      setAvailableLanguages(langs);
      setCurrentLanguage(settings.language_1);
    } catch (error) {
      console.error('Failed to fetch language settings:', error);
    }
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
  };

  const isRTL = currentLanguage === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [isRTL]);

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      availableLanguages, 
      changeLanguage, 
      t, 
      isRTL,
      refreshSettings: fetchSettings 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
