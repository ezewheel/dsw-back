export const toTrimmed = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export const toTrimmedLowercase = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;
