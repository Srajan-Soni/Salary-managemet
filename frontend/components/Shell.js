'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppShell, Group, Title, Anchor, Badge } from '@mantine/core';
import { IconChartBar, IconUsers } from '@tabler/icons-react';

const links = [
  { href: '/', label: 'Insights', icon: IconChartBar },
  { href: '/employees', label: 'Employees', icon: IconUsers },
];

export default function Shell({ children }) {
  const path = usePathname();
  return (
    <AppShell header={{ height: 60 }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="xs">
            <Title order={4} c="dark.9" fw={800}>ACME Salary Manager</Title>
            <Badge variant="filled" color="indigo" size="sm">HR</Badge>
          </Group>
          <Group gap="lg">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? path === '/' : path.startsWith(href);
              return (
                <Anchor
                  key={href}
                  component={Link}
                  href={href}
                  fw={active ? 700 : 600}
                  underline="never"
                  c={active ? 'indigo.8' : 'gray.8'}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    transition: 'all 150ms ease',
                    backgroundColor: active ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  }}
                >
                  <Group gap={6}><Icon size={18} />{label}</Group>
                </Anchor>
              );
            })}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}