import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Hotel Southern Suites — Hotels & Resorts | AP & Telangana',
    template: '%s | Hotel Southern Suites',
  },
  description:
    'Book directly with Hotel Southern Suites — 9 premium properties across Andhra Pradesh and Telangana. Tirupati, Nellore, Kakinada, Vijayawada, Hyderabad, Visakhapatnam. Best price guaranteed.',
  keywords: [
    'Hotel Southern Suites', 'hotels in Tirupati', 'hotels in Hyderabad',
    'hotels in Vijayawada', 'hotels in Visakhapatnam', 'hotels in Kakinada',
    'hotels in Nellore', 'resort Vizag', 'book hotel Andhra Pradesh',
    'hotel booking Telangana',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://southernsuites.com',
    siteName: 'Hotel Southern Suites',
    title: 'Hotel Southern Suites — 9 Properties Across AP & Telangana',
    description: 'Book direct. Best rates. Instant confirmation. 9 premium properties.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hotel Southern Suites',
    description: '9 premium properties across Andhra Pradesh and Telangana.',
  },
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0a0a0a',
              color: '#C9A84C',
              border: '1px solid #C9A84C33',
              borderRadius: '0',
              fontFamily: 'Arial, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.03em',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
