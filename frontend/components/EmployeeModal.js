'use client';
import { useEffect, useState } from 'react';
import { Alert, Button, Divider, Group, Loader, Modal, NumberInput, Select, SimpleGrid, Stack, Table, Text, TextInput } from '@mantine/core';
import { api, ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';

const EMPTY = { fullName: '', email: '', jobTitle: '', department: null, country: null, salary: '', hireDate: '', reason: '' };

/** Create (employeeId == null) or edit an employee; shows salary history when editing. */
export default function EmployeeModal({ opened, employeeId, meta, onClose, onSaved }) {
  const editing = employeeId != null;
  const [form, setForm] = useState(EMPTY);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!opened) return;
    setErrors({}); setFormError(null); setHistory([]);
    if (!editing) { setForm(EMPTY); return; }
    setLoading(true);
    api.getEmployee(employeeId)
      .then((e) => {
        setForm({ fullName: e.fullName, email: e.email, jobTitle: e.jobTitle, department: e.department, country: e.country, salary: e.salary, hireDate: e.hireDate, reason: '' });
        setHistory(e.history);
      })
      .catch((e) => setFormError(e.message))
      .finally(() => setLoading(false));
  }, [opened, employeeId, editing]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const currency = meta.countries.find((c) => c.code === form.country)?.currency;

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setErrors({}); setFormError(null);
    const payload = { ...form, salary: Number(form.salary), reason: form.reason || undefined };
    try {
      const saved = editing ? await api.updateEmployee(employeeId, payload) : await api.createEmployee(payload);
      onSaved(saved, editing);
    } catch (err) {
      if (err instanceof ApiError && err.details.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={editing ? 'Edit employee' : 'Add employee'} size="lg">
      {loading ? <Loader size="sm" /> : (
        <form onSubmit={submit}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput label="Full name" required value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
              <TextInput label="Email" required type="email" value={form.email} onChange={set('email')} error={errors.email} />
              <Select label="Department" required data={meta.departments} value={form.department} onChange={set('department')} error={errors.department} searchable />
              <TextInput label="Job title" required value={form.jobTitle} onChange={set('jobTitle')} error={errors.jobTitle} list="job-titles" />
              <Select label="Country" required data={meta.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` }))} value={form.country} onChange={set('country')} error={errors.country} searchable />
              <NumberInput label={`Annual salary${currency ? ` (${currency})` : ''}`} required min={1} allowDecimal={false} thousandSeparator="," value={form.salary} onChange={set('salary')} error={errors.salary} />
              <TextInput label="Hire date" required type="date" value={form.hireDate} onChange={set('hireDate')} error={errors.hireDate} />
              <TextInput label="Reason for salary change" placeholder="e.g. Annual review" value={form.reason} onChange={set('reason')} error={errors.reason} />
            </SimpleGrid>
            <datalist id="job-titles">{meta.jobTitles.map((t) => <option key={t} value={t} />)}</datalist>

            {editing && (
              <>
                <Divider label="Salary history" labelPosition="left" />
                <Table.ScrollContainer minWidth={420} mah={200}>
                  <Table fz="sm" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ color: '#0f172a' }}>When</Table.Th>
                        <Table.Th ta="right" style={{ color: '#0f172a' }}>From</Table.Th>
                        <Table.Th ta="right" style={{ color: '#0f172a' }}>To</Table.Th>
                        <Table.Th style={{ color: '#0f172a' }}>Reason</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {history.map((h) => (
                        <Table.Tr key={h.id}>
                          <Table.Td fw={500} c="dark.8">{h.changedAt.slice(0, 10)}</Table.Td>
                          <Table.Td ta="right" c="dark.8">{h.oldSalary == null ? '—' : formatMoney(h.oldSalary, h.currency)}</Table.Td>
                          <Table.Td ta="right" fw={700} c="dark.9">{formatMoney(h.newSalary, h.currency)}</Table.Td>
                          <Table.Td><Text size="sm" c="dark.7" fw={500}>{h.reason ?? ''}</Text></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </>
            )}

            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create employee'}</Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}