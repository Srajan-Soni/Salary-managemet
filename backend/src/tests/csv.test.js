import { describe, it, expect } from 'vitest';
import { toCsv } from '../src/csv.js';

const cols = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];

describe('toCsv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(toCsv(cols, [{ a: 'x,y', b: 'say "hi"\nthere' }])).toBe('A,B\r\n"x,y","say ""hi""\nthere"\r\n');
  });
  it('neutralises spreadsheet formula injection', () => {
    expect(toCsv(cols, [{ a: '=SUM(A1)', b: '@cmd' }])).toBe("A,B\r\n'=SUM(A1),'@cmd\r\n");
  });
  it('renders null as empty', () => {
    expect(toCsv(cols, [{ a: null, b: 0 }])).toBe('A,B\r\n,0\r\n');
  });
});