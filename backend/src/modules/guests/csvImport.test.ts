import { AppError } from "../../lib/AppError";
import { parseGuestsCsv } from "./csvImport";

describe("parseGuestsCsv", () => {
  it("parses a well-formed CSV", () => {
    const csv = "full_name,phone,email\nSarah Amrani,0555222333,sarah@example.com\nKarim Belaid,0555111222,karim@example.com";

    expect(parseGuestsCsv(csv)).toEqual([
      { fullName: "Sarah Amrani", phone: "0555222333", email: "sarah@example.com" },
      { fullName: "Karim Belaid", phone: "0555111222", email: "karim@example.com" },
    ]);
  });

  it("matches header names loosely (spaces, underscores, case)", () => {
    const csv = "Full Name,Phone\nYacine Kaddour,0555000111";
    expect(parseGuestsCsv(csv)).toEqual([{ fullName: "Yacine Kaddour", phone: "0555000111", email: undefined }]);
  });

  it("accepts 'name' as an alias for 'full_name'", () => {
    const csv = "name,email\nAmel Bensalem,amel@example.com";
    expect(parseGuestsCsv(csv)).toEqual([{ fullName: "Amel Bensalem", phone: undefined, email: "amel@example.com" }]);
  });

  it("skips rows missing a name instead of failing the whole import", () => {
    const csv = "full_name,phone\nHas Name,0555000000\n,0555999999";
    expect(parseGuestsCsv(csv)).toEqual([{ fullName: "Has Name", phone: "0555000000", email: undefined }]);
  });

  it("throws when no row has a usable name", () => {
    const csv = "full_name,phone\n,0555000000";
    expect(() => parseGuestsCsv(csv)).toThrow(AppError);
  });

  it("throws a readable error for malformed CSV", () => {
    const csv = 'full_name,phone\n"unterminated quote,0555000000';
    expect(() => parseGuestsCsv(csv)).toThrow(AppError);
  });
});
