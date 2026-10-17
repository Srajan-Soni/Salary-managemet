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
    <Paper withBorder p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text fz={26} fw={700} mt={4}>{value}</Text>
      {hint && <Text size="xs" c="dimmed">{hint}</Text>}
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
          <Title order={2}>How we pay people</Title>
          <Text c="dimmed" size="sm">All figures are annual base salary, normalised to USD so countries can be compared.</Text>
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

      <Paper withBorder p="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Pay by</Title>
          <SegmentedControl value={by} onChange={setBy} data={Object.entries(BY_LABEL).map(([value, l]) => ({ value, label: l }))} />
        </Group>
        {breakdown.loading && !breakdown.data ? <Loader size="sm" /> : (
          <Stack>
            <BarChart
              h={Math.max(220, (breakdown.data?.rows.length ?? 0) * 34)}
              data={(breakdown.data?.rows ?? []).map((r) => ({ name: label(r.key), Median: r.median, Average: r.avg }))}
              dataKey="name"
              orientation="vertical"
              series={[{ name: 'Median', color: 'indigo.6' }, { name: 'Average', color: 'teal.4' }]}
              valueFormatter={(v) => formatUsd(v)}
              yAxisProps={{ width: 150 }}
              withLegend
            />
            <Table.ScrollContainer minWidth={640}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{BY_LABEL[by]}</Table.Th>
                    <Table.Th ta="right">Headcount</Table.Th>
                    <Table.Th ta="right">Min</Table.Th>
                    <Table.Th ta="right">Median</Table.Th>
                    <Table.Th ta="right">Average</Table.Th>
                    <Table.Th ta="right">P90</Table.Th>
                    <Table.Th ta="right">Max</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(breakdown.data?.rows ?? []).map((r) => (
                    <Table.Tr key={r.key}>
                      <Table.Td>{label(r.key)}</Table.Td>
                      <Table.Td ta="right">{formatNumber(r.headcount)}</Table.Td>
                      <Table.Td ta="right">{formatUsd(r.min)}</Table.Td>
                      <Table.Td ta="right" fw={600}>{formatUsd(r.median)}</Table.Td>
                      <Table.Td ta="right">{formatUsd(r.avg)}</Table.Td>
                      <Table.Td ta="right">{formatUsd(r.p90)}</Table.Td>
                      <Table.Td ta="right">{formatUsd(r.max)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        )}
      </Paper>

      <Paper withBorder p="md">
        <Title order={4} mb="md">Salary distribution</Title>
        <BarChart
          h={260}
          data={(dist.data?.bins ?? []).map((b) => ({ range: bucketLabel(b), Employees: b.count }))}
          dataKey="range"
          series={[{ name: 'Employees', color: 'indigo.5' }]}
          valueFormatter={formatNumber}
          xAxisProps={{ interval: 0, angle: -30, textAnchor: 'end', height: 60 }}
        />
      </Paper>
    </Stack>
  );
}