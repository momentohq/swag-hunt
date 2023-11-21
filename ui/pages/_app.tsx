import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify';
import CacheContext from '../services/CacheContext';
import { TopicClient, CacheClient, CredentialProvider, Configurations } from '@gomomento/sdk-web';
import '../styles/index.css'
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';


export default function MyApp({ Component, pageProps }: AppProps) {
  const [topics, setTopics] = useState<TopicClient>(null);
  const [cache, setCache] = useState<CacheClient>(null);

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

      const topicClient = new TopicClient({
        credentialProvider: CredentialProvider.fromString({ authToken: token }),
        configuration: Configurations.Browser.latest()
      });


      setTopics(topicClient);

      const cacheClient = new CacheClient({
        credentialProvider: CredentialProvider.fromString({ authToken: token }),
        configuration: Configurations.Browser.latest(),
        defaultTtlSeconds: 60
      });

      setCache(cacheClient);
    }

    initializeSDK();
  }, []);

  return (
    <CacheContext.Provider value={cache}>
        <Component {...pageProps} />
        <ToastContainer />
    </CacheContext.Provider>
  )
}
