import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  AED: 'د.إ',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$'
};

export const CurrencyProvider = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1.0 });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const settings = response.data;
      setCurrentCurrency(settings.currency);
      setExchangeRates(settings.exchange_rates || { USD: 1.0 });
    } catch (error) {
      console.error('Failed to fetch currency settings:', error);
    }
  };

  const formatCurrency = (amount, currency = currentCurrency) => {
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const convertCurrency = (amount, fromCurrency, toCurrency = currentCurrency) => {
    const fromRate = exchangeRates[fromCurrency] || 1.0;
    const toRate = exchangeRates[toCurrency] || 1.0;
    return (amount / fromRate) * toRate;
  };

  const changeCurrency = (currency) => {
    setCurrentCurrency(currency);
  };

  return (
    <CurrencyContext.Provider value={{ 
      currentCurrency, 
      exchangeRates, 
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
