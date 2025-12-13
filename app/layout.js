import './globals.css';
import { Layout as MainLayout } from '../components/Layout';
import { Providers } from '../components/Providers';

export const metadata = {
  title: 'POFO - Portfolio Platform',
  description: 'A bilingual portfolio platform for developers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}