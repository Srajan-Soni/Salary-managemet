import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';
import { ColorSchemeScript } from '@mantine/core';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'ACME Salary Manager',
  description: 'Manage employee salaries and understand how the organisation pays people.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-mantine-color-scheme="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" forceColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}