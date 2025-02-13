import { Html, Main, Head, NextScript } from 'next/document';
import { siteConfig } from '@/config/site';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <!-- Cloudflare Pages Custom Error Pages --> */}
        <meta charSet="utf-8" />
        <meta name="description" content={siteConfig.description} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 