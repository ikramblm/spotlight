import { toCsv } from "./csv";

interface Row {
  name: string;
  amount: number;
  note: string | null;
}

describe("toCsv", () => {
  it("builds a header row plus one row per record", () => {
    const rows: Row[] = [
      { name: "Flowers", amount: 2500, note: null },
      { name: "Sound system", amount: 15000, note: "rental" },
    ];

    const csv = toCsv(rows, [
      { header: "Name", value: (r) => r.name },
      { header: "Amount", value: (r) => r.amount },
      { header: "Note", value: (r) => r.note },
    ]);

    expect(csv).toBe("Name,Amount,Note\r\nFlowers,2500,\r\nSound system,15000,rental\r\n");
  });

  it("quotes a cell containing a comma", () => {
    const csv = toCsv([{ name: "Chairs, tables", amount: 0, note: null }], [
      { header: "Name", value: (r) => r.name },
    ]);
    expect(csv).toContain('"Chairs, tables"');
  });

  it("quotes and escapes a cell containing a double quote", () => {
    const csv = toCsv([{ name: 'The "Grand" Hall', amount: 0, note: null }], [
      { header: "Name", value: (r) => r.name },
    ]);
    expect(csv).toContain('"The ""Grand"" Hall"');
  });

  it("quotes a cell containing a newline", () => {
    const csv = toCsv([{ name: "Line one\nLine two", amount: 0, note: null }], [
      { header: "Name", value: (r) => r.name },
    ]);
    expect(csv).toContain('"Line one\nLine two"');
  });

  it("produces just the header row for an empty dataset", () => {
    const csv = toCsv<Row>([], [{ header: "Name", value: (r) => r.name }]);
    expect(csv).toBe("Name\r\n");
  });
});
