import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify';
import CacheContext from '../services/CacheContext';
import { CacheClient, CredentialProvider, Configurations } from '@gomomento/sdk-web';
import '../styles/index.css'
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';


export default function MyApp({ Component, pageProps }: AppProps) {
  const [cacheClient, setCacheClient] = useState<CacheClient>(null);

  useEffect(() => {
    async function initializeSDK() {
      const storedToken = localStorage.getItem('authToken');
      const expiresAt = localStorage.getItem('expiresAt');
      const currentTime = new Date().getTime();

      let token;

      if (storedToken && expiresAt && currentTime < Number(expiresAt)) {
        token = storedToken; // Use the stored token
      } else {
        const response = await fetch('/api/tokens');
        const data = await response.json();
        token = data.token;
        const tokenExpiryTime = new Date().getTime() + data.exp * 1000;

        // Store the new token and expiration time in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('expiresAt', tokenExpiryTime.toString());
      }

      initialize(token);

    }

    initializeSDK();
  }, []);

  const refreshSDK = async () => {
    const response = await fetch('/api/tokens');
    const data = await response.json();
    initialize(data.token);
    console.log(data.exp);
  }

  const initialize = (token) => {
    const client = new CacheClient({
      credentialProvider: CredentialProvider.fromString({ authToken: token }),
      configuration: Configurations.Browser.latest(),
      defaultTtlSeconds: 60
    });

    setCacheClient(client);
    localStorage.setItem('authToken', token);
  };

  return (
    <CacheContext.Provider value={{cacheClient, refreshSDK}}>
      <Component {...pageProps} />
      <ToastContainer />
    </CacheContext.Provider>
  )
}
