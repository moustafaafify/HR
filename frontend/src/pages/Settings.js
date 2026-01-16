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
