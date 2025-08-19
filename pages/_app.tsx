import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { I18nProvider } from '../lib/i18n/provider';
import i18nConfig from '../lib/i18n/config';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <Component {...pageProps} />
    </I18nProvider>
  );
}

export default appWithTranslation(MyApp, i18nConfig);