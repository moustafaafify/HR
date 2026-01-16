import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Shield, ChevronRight, Plus, X, Globe, DollarSign } from 'lucide-react';

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
    exchange_rates: { USD: 1.0 }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      // Ensure enabled_currencies exists
      const data = {
        ...response.data,
        enabled_currencies: response.data.enabled_currencies || [response.data.currency || 'USD']
      };
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

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
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' }
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
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('languageSettings')}</h2>
          <div className="space-y-4">
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
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {languages.filter(l => l.code !== settings.language_1).map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('currencySettings')}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Default Currency
              </label>
              <Select 
                value={settings.currency} 
                onValueChange={(value) => setSettings({ ...settings, currency: value })}
              >
                <SelectTrigger data-testid="currency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Exchange Rates (relative to USD)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currencies.filter(c => c !== 'USD').map((curr) => (
                  <div key={curr}>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      {curr}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      data-testid={`exchange-rate-${curr}`}
                      value={settings.exchange_rates[curr] || 1.0}
                      onChange={(e) => updateExchangeRate(curr, e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
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
