'use client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import Shell from './Shell';

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  black: '#0f172a',
  white: '#ffffff',
});

export default function Providers({ children }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light" forceColorScheme="light">
      <Notifications position="top-right" />
      <ModalsProvider>
        <Shell>{children}</Shell>
      </ModalsProvider>
    </MantineProvider>
  );
}