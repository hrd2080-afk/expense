import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppDataProvider } from '@/components/providers/AppDataContext';
import Navigation from '@/components/layout/Navigation';
import PWARegister from '@/components/providers/PWARegister';

export const metadata: Metadata = {
  title: '가계부',
  description: '수입과 지출을 쉽게 관리하는 스마트 가계부 앱',
  applicationName: '가계부',
  appleWebApp: {
    capable: true,
    title: '가계부',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',  // iPhone 노치/홈바 대응
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppDataProvider>
          <PWARegister />
          <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-[480px] relative min-h-screen pb-20">
              {children}
              <Navigation />
            </div>
          </div>
        </AppDataProvider>
      </body>
    </html>
  );
}
