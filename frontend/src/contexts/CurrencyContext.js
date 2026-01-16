import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Comprehensive currency symbols map
const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  HKD: 'HK$',
  SGD: 'S$',
  SEK: 'kr',
  KRW: '₩',
  NOK: 'kr',
  NZD: 'NZ$',
  MXN: '$',
  TWD: 'NT$',
  ZAR: 'R',
  BRL: 'R$',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  ILS: '₪',
  IDR: 'Rp',
  CZK: 'Kč',
  AED: 'د.إ',
  TRY: '₺',
  HUF: 'Ft',
  CLP: '$',
  SAR: 'ر.س',
  PHP: '₱',
  MYR: 'RM',
  COP: '$',
  RUB: '₽',
  RON: 'lei',
  PEN: 'S/',
  BGN: 'лв',
  ARS: '$',
  PKR: '₨',
  EGP: 'ج.م',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  VND: '₫',
  BDT: '৳',
  NGN: '₦',
  KES: 'KSh',
  UAH: '₴',
  GHS: '₵',
  MAD: 'د.م.',
  LKR: '₨',
  JOD: 'د.أ',
  LBP: 'ل.ل',
  IQD: 'ع.د',
  SYP: 'ل.س',
  YER: 'ر.ي',
  LYD: 'ل.د',
  TND: 'د.ت',
  DZD: 'د.ج',
  SDG: 'ج.س'
};

export const CurrencyProvider = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1.0 });
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const settings = response.data;
      const currency = settings.currency || 'USD';
      setCurrentCurrency(currency);
      setCurrencySymbol(currencySymbols[currency] || currency);
      setExchangeRates(settings.exchange_rates || { USD: 1.0 });
    } catch (error) {
      console.error('Failed to fetch currency settings:', error);
    }
  };

  const getSymbol = (currency = currentCurrency) => {
    return currencySymbols[currency] || currency;
  };

  const formatCurrency = (amount, currency = currentCurrency) => {
    const symbol = currencySymbols[currency] || currency;
    const numAmount = parseFloat(amount) || 0;
    return `${symbol}${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const convertCurrency = (amount, fromCurrency, toCurrency = currentCurrency) => {
    const fromRate = exchangeRates[fromCurrency] || 1.0;
    const toRate = exchangeRates[toCurrency] || 1.0;
    return (amount / fromRate) * toRate;
  };

  const changeCurrency = (currency) => {
    setCurrentCurrency(currency);
    setCurrencySymbol(currencySymbols[currency] || currency);
  };

  return (
    <CurrencyContext.Provider value={{ 
      currentCurrency, 
      currencySymbol,
      exchangeRates, 
      getSymbol,
      formatCurrency, 
      convertCurrency, 
      changeCurrency,
      refreshSettings: fetchSettings 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
