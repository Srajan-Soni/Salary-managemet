'use client';
import { useState } from 'react';
import { Alert, Group, Loader, Paper, SegmentedControl, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useMeta } from '@/components/useMeta';
import { bucketLabel, formatNumber, formatUsd } from '@/lib/format';

function Kpi({ label, value, hint }) {
  return (
    <Paper withBorder p="md" bg="white" shadow="xs">
      <Text size="xs" c="gray.7" tt="uppercase" fw={700} style={{ letterSpacing: '0.04em' }}>{label}</Text>
      <Text fz={26} fw={800} mt={4} c="dark.9">{value}</Text>
      {hint && <Text size="xs" c="gray.7" fw={500}>{hint}</Text>}
    </Paper>
  );
}

const BY_LABEL = { country: 'Country', department: 'Department', jobTitle: 'Job title' };

export default function InsightsPage() {
  const meta = useMeta();
  const [country, setCountry] = useState(null);
  const [department, setDepartment] = useState(null);
  const [by, setBy] = useState('country');
  const filters = { country: country ?? undefined, department: department ?? undefined };

  const summary = useAsync(() => api.summary(filters), [country, department]);
  const breakdown = useAsync(() => api.breakdown({ ...filters, by }), [country, department, by]);
  const dist = useAsync(() => api.distribution({ ...filters, bins: 12 }), [country, department]);

  const countryName = (code) => meta.countries.find((c) => c.code === code)?.name ?? code;
  const label = (key) => (by === 'country' ? countryName(key) : key);
  const s = summary.data;
  const error = summary.error || breakdown.error || dist.error;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} c="dark.9">How we pay people</Title>
          <Text c="gray.7" size="sm" fw={500}>All figures are annual base salary, normalised to USD so countries can be compared.</Text>
        </div>
        <Group>
          <Select placeholder="All countries" clearable data={meta.countries.map((c) => ({ value: c.code, label: c.name }))} value={country} onChange={setCountry} aria-label="Country" />
          <Select placeholder="All departments" clearable data={meta.departments} value={department} onChange={setDepartment} aria-label="Department" />
        </Group>
      </Group>

      {error && <Alert color="red" title="Could not load insights">{error.message}. Is the API running?</Alert>}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Kpi label="Headcount" value={s ? formatNumber(s.headcount) : '…'} />
        <Kpi label="Annual payroll" value={s ? formatUsd(s.total, { compact: true }) : '…'} hint="Sum of base salaries" />
        <Kpi label="Median salary" value={s ? formatUsd(s.median) : '…'} hint={s ? `Average ${formatUsd(s.avg)}` : ''} />
        <Kpi label="Typical range (P10–P90)" value={s ? `${formatUsd(s.p10, { compact: true })}–${formatUsd(s.p90, { compact: true })}` : '…'} hint={s ? `Min ${formatUsd(s.min, { compact: true })} · Max ${formatUsd(s.max, { compact: true })}` : ''} />
      </SimpleGrid>

      <Paper withBorder p="md" bg="white" shadow="xs">
        <Group justify="space-between" mb="md">
          <Title order={4} c="dark.9">Pay by</Title>
          <SegmentedControl value={by} onChange={setBy} data={Object.entries(BY_LABEL).map(([value, l]) => ({ value, label: l }))} />
        </Group>
        {breakdown.loading && !breakdown.data ? <Loader size="sm" /> : (
          <Stack>
            <BarChart
              h={Math.max(220, (breakdown.data?.rows.length ?? 0) * 34)}
              data={(breakdown.data?.rows ?? []).map((r) => ({ name: label(r.key), Median: r.median, Average: r.avg }))}
              dataKey="name"
              orientation="vertical"
              series={[{ name: 'Median', color: 'indigo.8' }, { name: 'Average', color: 'teal.8' }]}
              valueFormatter={(v) => formatUsd(v)}
              yAxisProps={{ width: 150 }}
              withLegend
            />
            <Table.ScrollContainer minWidth={640}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ color: '#0f172a' }}>{BY_LABEL[by]}</Table.Th>
                    <Table.Th ta="right" style={{ color: '#0f172a' }}>Headcount</Table.Th>
                    <Table.Th ta="right" style={{ color: '#0f172a' }}>Min</Table.Th>
                    <Table.Th ta="right" style={{ color: '#0f172a' }}>Median</Table.Th>
                    <Table.Th ta="right" style={{ color: '#0f172a' }}>Average</Table.Th>
                    <Table.Th ta="right" style={{ color: '#0f172a' }}>P90</Table.Th>
                    <Table.Th ta="right" style={{ color: '#0f172a' }}>Max</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(breakdown.data?.rows ?? []).map((r) => (
                    <Table.Tr key={r.key}>
                      <Table.Td fw={600} c="dark.9">{label(r.key)}</Table.Td>
                      <Table.Td ta="right" c="dark.8" fw={500}>{formatNumber(r.headcount)}</Table.Td>
                      <Table.Td ta="right" c="dark.8" fw={500}>{formatUsd(r.min)}</Table.Td>
                      <Table.Td ta="right" fw={700} c="dark.9">{formatUsd(r.median)}</Table.Td>
                      <Table.Td ta="right" c="dark.8" fw={500}>{formatUsd(r.avg)}</Table.Td>
                      <Table.Td ta="right" c="dark.8" fw={500}>{formatUsd(r.p90)}</Table.Td>
                      <Table.Td ta="right" c="dark.8" fw={500}>{formatUsd(r.max)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        )}
      </Paper>

      <Paper withBorder p="md" bg="white" shadow="xs">
        <Title order={4} mb="md" c="dark.9">Salary distribution</Title>
        <BarChart
          h={260}
          data={(dist.data?.bins ?? []).map((b) => ({ range: bucketLabel(b), Employees: b.count }))}
          dataKey="range"
          series={[{ name: 'Employees', color: 'indigo.8' }]}
          valueFormatter={formatNumber}
          xAxisProps={{ interval: 0, angle: -30, textAnchor: 'end', height: 60 }}
        />
      </Paper>
    </Stack>
  );
}