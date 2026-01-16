import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useBranding } from '../contexts/BrandingContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Shield, ChevronRight, Plus, X, Globe, DollarSign, Mail, MessageSquare, Eye, EyeOff, TestTube, CheckCircle2, XCircle, Languages, Search, FileText, Edit2, Save, Image, Upload, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const { t, refreshSettings } = useLanguage();
  const { refreshSettings: refreshCurrencySettings } = useCurrency();
  const { refreshBranding } = useBranding();
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  
  const [settings, setSettings] = useState({
    language_1: 'en',
    language_2: '',
    currency: 'USD',
    enabled_currencies: ['USD'],
    exchange_rates: { USD: 1.0 },
    // Branding Settings
    app_name: 'HR Portal',
    logo_url: '',
    favicon_url: '',
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Top 50 most used languages worldwide

  useEffect(() => {
    fetchSettings();
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

  // Get language name from code
  const getLanguageName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  // All languages available for translation (excluding English which is base)
  const availableTranslationLanguages = languages.filter(lang => lang.code !== 'en');

  // Handle logo upload
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const response = await axios.post(`${API}/settings/upload-branding`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.url) {
        setSettings(prev => ({ ...prev, logo_url: response.data.url }));
        toast.success('Logo uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle favicon upload
  const handleFaviconUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 500KB for favicon)
    if (file.size > 500 * 1024) {
      toast.error('Favicon must be less than 500KB');
      return;
    }

    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'favicon');

      const response = await axios.post(`${API}/settings/upload-branding`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.url) {
        setSettings(prev => ({ ...prev, favicon_url: response.data.url }));
        toast.success('Favicon uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success('Settings updated successfully');
      await refreshSettings();
      await refreshCurrencySettings();
      await refreshBranding();
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

        {/* Branding Settings */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
              <Sparkles className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Branding</h2>
              <p className="text-sm text-slate-500">Customize your app name, logo, and favicon</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* App Name */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                App Name
              </label>
              <Input
                type="text"
                placeholder="Enter your app name"
                value={settings.app_name || 'HR Portal'}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                className="max-w-md"
                data-testid="app-name-input"
              />
              <p className="text-xs text-slate-500 mt-1">
                This name will appear in the browser tab, PWA install prompt, and throughout the app
              </p>
            </div>

            {/* Logo & Favicon Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="border border-slate-200 rounded-xl p-4">
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  App Logo
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                    {settings.logo_url ? (
                      <img 
                        src={settings.logo_url} 
                        alt="App Logo" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image className="text-slate-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="mb-2"
                      data-testid="upload-logo-btn"
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-500">
                      Recommended: 512x512px, PNG or SVG. Max 2MB.
                    </p>
                    {settings.logo_url && (
                      <button
                        onClick={() => setSettings({ ...settings, logo_url: '' })}
                        className="text-xs text-rose-600 hover:text-rose-700 mt-1"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="border border-slate-200 rounded-xl p-4">
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Favicon
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                    {settings.favicon_url ? (
                      <img 
                        src={settings.favicon_url} 
                        alt="Favicon" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image className="text-slate-400" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={faviconInputRef}
                      onChange={handleFaviconUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploadingFavicon}
                      className="mb-2"
                      data-testid="upload-favicon-btn"
                    >
                      {uploadingFavicon ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Upload Favicon
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-500">
                      Recommended: 32x32px or 64x64px, PNG or ICO. Max 500KB.
                    </p>
                    {settings.favicon_url && (
                      <button
                        onClick={() => setSettings({ ...settings, favicon_url: '' })}
                        className="text-xs text-rose-600 hover:text-rose-700 mt-1"
                      >
                        Remove favicon
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Banner */}
            <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-2 font-medium">Preview</p>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm max-w-sm">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {(settings.app_name || 'HR Portal').charAt(0)}
                    </div>
                  )}
                </div>
                <span className="font-semibold text-slate-900">{settings.app_name || 'HR Portal'}</span>
              </div>
            </div>
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
    </div>
  );
};

export default Settings;
