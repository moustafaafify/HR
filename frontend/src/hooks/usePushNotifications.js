import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Convert VAPID key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (token) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');

  // Check if push notifications are supported
  useEffect(() => {
    let isMounted = true;
    
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (isMounted) {
        setIsSupported(supported);
        if (supported) {
          setPermission(Notification.permission);
        }
      }
    };
    
    checkSupport();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Check subscription status on mount
  useEffect(() => {
    if (!isSupported || !token) return;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API}/api/push/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSubscribed(response.data.subscribed);
      } catch (err) {
        console.error('Error checking push status:', err);
      }
    };

    checkStatus();
  }, [isSupported, token]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !token) {
      setError('Push notifications not supported');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const vapidResponse = await axios.get(`${API}/api/push/vapid-public-key`);
      const vapidPublicKey = vapidResponse.data.publicKey;

      // Subscribe to push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to backend
      await axios.post(
        `${API}/api/push/subscribe`,
        { subscription: subscription.toJSON() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to subscribe');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, token]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported || !token) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push service
        await subscription.unsubscribe();

        // Remove subscription from backend
        await axios.post(
          `${API}/api/push/unsubscribe`,
          null,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { endpoint: subscription.endpoint }
          }
        );
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, token]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!token) return false;

    try {
      await axios.post(
        `${API}/api/push/test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (err) {
      console.error('Test notification error:', err);
      setError(err.response?.data?.detail || 'Failed to send test notification');
      return false;
    }
  }, [token]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

export default usePushNotifications;
