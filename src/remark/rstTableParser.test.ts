import {describe, it, expect} from 'vitest';
import {parseRstGridTable, RstCell} from './rstTableParser';

const find = (rows: RstCell[][], text: string): RstCell | undefined =>
  rows.flat().find((c) => c.text === text);

describe('parseRstGridTable', () => {
  it('parses a simple header + body table', () => {
    const src = [
      '+---+---+',
      '| A | B |',
      '+===+===+',
      '| C | D |',
      '+---+---+',
    ].join('\n');
    const model = parseRstGridTable(src);
    expect(model.headerRows).toHaveLength(1);
    expect(model.headerRows[0].map((c) => c.text)).toEqual(['A', 'B']);
    expect(model.headerRows[0].every((c) => c.header)).toBe(true);
    expect(model.bodyRows).toHaveLength(1);
    expect(model.bodyRows[0].map((c) => c.text)).toEqual(['C', 'D']);
    expect(model.bodyRows[0].every((c) => !c.header)).toBe(true);
  });

  it('treats a table with no === line as all-body', () => {
    const src = [
      '+---+---+',
      '| A | B |',
      '+---+---+',
    ].join('\n');
    const model = parseRstGridTable(src);
    expect(model.headerRows).toHaveLength(0);
    expect(model.bodyRows[0].map((c) => c.text)).toEqual(['A', 'B']);
  });

  it('detects a colspan (horizontal merge)', () => {
    const src = [
      '+---+---+',
      '| A     |',
      '+---+---+',
      '| B | C |',
      '+---+---+',
    ].join('\n');
    const model = parseRstGridTable(src);
    const a = find(model.bodyRows, 'A')!;
    expect(a.colSpan).toBe(2);
    expect(a.rowSpan).toBe(1);
    expect(model.bodyRows[1].map((c) => c.text)).toEqual(['B', 'C']);
  });

  it('detects a rowspan (vertical merge)', () => {
    const src = [
      '+---+---+',
      '| A | B |',
      '+   +---+',
      '|   | C |',
      '+---+---+',
    ].join('\n');
    const model = parseRstGridTable(src);
    const a = find(model.bodyRows, 'A')!;
    expect(a.rowSpan).toBe(2);
    expect(a.colSpan).toBe(1);
    // A's cell is NOT repeated in the second output row
    expect(model.bodyRows[1].map((c) => c.text)).toEqual(['C']);
  });

  it('parses landmark cells of the lesson 9 jāyā paradigm', () => {
    const src = [
      '+------+-----------+---------------+----------------+',
      '|      | Ед.ч.     | Дв.ч.         | Мн.ч.          |',
      '+======+===========+===============+================+',
      '| N.   | jāyā      | jāye          | jāyāḥ (s)      |',
      '+------+-----------+               +                +',
      '| V.   | jāye      |               |                |',
      '+------+-----------+               +                +',
      '| Acc. | jāyā-m    |               |                |',
      '+------+-----------+---------------+----------------+',
      '| I.   | jāya-y-ā  | jāyā-bhyām    | jāyā-bhiḥ (s)  |',
      '+------+-----------+               +----------------+',
      '| D.   | jāyāyai   |               | jāyā-bhyaḥ (s) |',
      '+------+-----------+               +                +',
      '| Abl. | jāyā-y-āḥ |               |                |',
      '+------+           +---------------+----------------+',
      '| G.   |           | jāya-y-or (s) | jāyā-n-ām      |',
      '+------+-----------+               +----------------+',
      '| L.   | jāyā-y-ām |               | jāyā-su        |',
      '+------+-----------+---------------+----------------+',
    ].join('\n');
    const model = parseRstGridTable(src);

    // header
    expect(model.headerRows).toHaveLength(1);
    expect(model.headerRows[0].map((c) => c.text)).toEqual(['', 'Ед.ч.', 'Дв.ч.', 'Мн.ч.']);

    // 8 body rows: N V Acc I D Abl G L
    expect(model.bodyRows).toHaveLength(8);
    expect(model.bodyRows[0][0].text).toBe('N.');

    // landmark spans
    expect(find(model.bodyRows, 'jāye')!.rowSpan).toBe(3);        // Дв.ч. across N/V/Acc
    expect(find(model.bodyRows, 'jāyāḥ (s)')!.rowSpan).toBe(3);   // Мн.ч. across N/V/Acc
    expect(find(model.bodyRows, 'jāyā-bhyām')!.rowSpan).toBe(3);  // Дв.ч. across I/D/Abl
    expect(find(model.bodyRows, 'jāyā-bhiḥ (s)')!.rowSpan).toBe(1);
    expect(find(model.bodyRows, 'jāyā-bhyaḥ (s)')!.rowSpan).toBe(2); // across D/Abl
  });

  it('detects a cell spanning both rows and columns', () => {
    const src = [
      '+---+---+---+',
      '| A     | B |',
      '+       +---+',
      '|       | C |',
      '+---+---+---+',
      '| D | E | F |',
      '+---+---+---+',
    ].join('\n');
    const model = parseRstGridTable(src);
    const a = find(model.bodyRows, 'A')!;
    expect(a.rowSpan).toBe(2);
    expect(a.colSpan).toBe(2);
    expect(model.bodyRows[0].map((c) => c.text)).toEqual(['A', 'B']);
    expect(model.bodyRows[1].map((c) => c.text)).toEqual(['C']);
    expect(model.bodyRows[2].map((c) => c.text)).toEqual(['D', 'E', 'F']);
  });

  it('throws a descriptive error on input that is not a grid table', () => {
    expect(() => parseRstGridTable('not a table at all')).toThrow(/not a valid RST grid table/);
    expect(() => parseRstGridTable('+---+')).toThrow(/not a valid RST grid table/);
  });
});
