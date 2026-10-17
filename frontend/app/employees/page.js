'use client';
import { useState } from 'react';
import { ActionIcon, Alert, Button, Group, NumberInput, Pagination, Paper, Select, Stack, Table, Text, TextInput, Title, UnstyledButton } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconArrowDown, IconArrowUp, IconDownload, IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useMeta } from '@/components/useMeta';
import EmployeeModal from '@/components/EmployeeModal';
import { formatMoney, formatNumber, formatUsd } from '@/lib/format';

const PAGE_SIZE = 25;

function SortTh({ field, sort, order, onSort, children, align }) {
  const active = sort === field;
  return (
    <Table.Th ta={align}>
      <UnstyledButton onClick={() => onSort(field)} fw={600} fz="sm">
        <Group gap={4} wrap="nowrap" justify={align === 'right' ? 'flex-end' : 'flex-start'}>
          {children}
          {active && (order === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />)}
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

export default function EmployeesPage() {
  const meta = useMeta();
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 300);
  const [country, setCountry] = useState(null);
  const [department, setDepartment] = useState(null);
  const [jobTitle, setJobTitle] = useState(null);
  const [minUsd, setMinUsd] = useState('');
  const [maxUsd, setMaxUsd] = useState('');
  const [sort, setSort] = useState('fullName');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ opened: false, id: null });

  const params = {
    search: debounced || undefined, country: country ?? undefined, department: department ?? undefined, jobTitle: jobTitle ?? undefined,
    minSalaryUsd: minUsd === '' ? undefined : minUsd, maxSalaryUsd: maxUsd === '' ? undefined : maxUsd,
  };
  const { data, error, loading, reload } = useAsync(
    () => api.listEmployees({ ...params, sort, order, page, pageSize: PAGE_SIZE }),
    [debounced, country, department, jobTitle, minUsd, maxUsd, sort, order, page],
  );

  const resetPage = (setter) => (v) => { setter(v); setPage(1); };
  const onSort = (field) => {
    if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setOrder('asc'); }
    setPage(1);
  };

  function confirmDelete(e) {
    modals.openConfirmModal({
      title: 'Delete employee?',
      children: <Text size="sm">This permanently removes <b>{e.fullName}</b> and their salary history.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await api.deleteEmployee(e.id);
          notifications.show({ color: 'teal', message: `${e.fullName} deleted` });
          reload();
        } catch (err) {
          notifications.show({ color: 'red', message: err.message });
        }
      },
    });
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Employees</Title>
          <Text c="dimmed" size="sm">{data ? `${formatNumber(data.total)} matching employees` : 'Loading…'}</Text>
        </div>
        <Group>
          <Button component="a" href={api.exportUrl({ ...params, sort, order })} variant="default" leftSection={<IconDownload size={16} />}>Export CSV</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModal({ opened: true, id: null })}>Add employee</Button>
        </Group>
      </Group>

      <Paper withBorder p="md">
        <Group align="flex-end">
          <TextInput placeholder="Search name or email" leftSection={<IconSearch size={16} />} value={search} onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }} w={240} aria-label="Search" />
          <Select placeholder="Country" clearable data={meta.countries.map((c) => ({ value: c.code, label: c.name }))} value={country} onChange={resetPage(setCountry)} w={160} aria-label="Country" />
          <Select placeholder="Department" clearable data={meta.departments} value={department} onChange={resetPage(setDepartment)} w={160} aria-label="Department" />
          <Select placeholder="Job title" clearable searchable data={meta.jobTitles} value={jobTitle} onChange={resetPage(setJobTitle)} w={210} aria-label="Job title" />
          <NumberInput placeholder="Min USD" thousandSeparator="," min={0} value={minUsd} onChange={resetPage(setMinUsd)} w={120} hideControls aria-label="Minimum salary USD" />
          <NumberInput placeholder="Max USD" thousandSeparator="," min={0} value={maxUsd} onChange={resetPage(setMaxUsd)} w={120} hideControls aria-label="Maximum salary USD" />
        </Group>
      </Paper>

      {error && <Alert color="red" title="Could not load employees">{error.message}. Is the API running?</Alert>}

      <Paper withBorder style={{ opacity: loading ? 0.6 : 1 }}>
        <Table.ScrollContainer minWidth={900}>
          <Table highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <SortTh field="fullName" {...{ sort, order, onSort }}>Name</SortTh>
                <SortTh field="jobTitle" {...{ sort, order, onSort }}>Job title</SortTh>
                <SortTh field="department" {...{ sort, order, onSort }}>Department</SortTh>
                <SortTh field="country" {...{ sort, order, onSort }}>Country</SortTh>
                <Table.Th ta="right">Salary (local)</Table.Th>
                <SortTh field="salaryUsd" align="right" {...{ sort, order, onSort }}>Salary (USD)</SortTh>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.items ?? []).map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td><Text fw={500} size="sm">{e.fullName}</Text><Text size="xs" c="dimmed">{e.email}</Text></Table.Td>
                  <Table.Td>{e.jobTitle}</Table.Td>
                  <Table.Td>{e.department}</Table.Td>
                  <Table.Td>{e.country}</Table.Td>
                  <Table.Td ta="right">{formatMoney(e.salary, e.currency)}</Table.Td>
                  <Table.Td ta="right" fw={600}>{formatUsd(e.salaryUsd)}</Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <ActionIcon variant="subtle" aria-label={`Edit ${e.fullName}`} onClick={() => setModal({ opened: true, id: e.id })}><IconPencil size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" aria-label={`Delete ${e.fullName}`} onClick={() => confirmDelete(e)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {data && data.items.length === 0 && (
                <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="xl">No employees match these filters.</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {data && data.totalPages > 1 && (
        <Group justify="center"><Pagination total={data.totalPages} value={page} onChange={setPage} siblings={1} /></Group>
      )}

      <EmployeeModal
        opened={modal.opened}
        employeeId={modal.id}
        meta={meta}
        onClose={() => setModal({ opened: false, id: null })}
        onSaved={(saved, wasEdit) => {
          setModal({ opened: false, id: null });
          notifications.show({ color: 'teal', message: wasEdit ? 'Changes saved' : `${saved.fullName} added` });
          reload();
        }}
      />
    </Stack>
  );
}