import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify';
import '../styles/index.css'
import 'react-toastify/dist/ReactToastify.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <ToastContainer />
    </>
  )
}
