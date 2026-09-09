import { round2 } from "@/lib/utils";

export function americanToDecimal(american: number): number {
  if (!Number.isFinite(american) || american === 0) return 1;
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

export function decimalToAmerican(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return 0;
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

export function combineAmerican(odds: number[]): number {
  if (odds.length === 0) return 0;
  const decimal = odds.reduce((acc, n) => acc * americanToDecimal(n), 1);
  return decimalToAmerican(decimal);
}

export function toWin(stake: number, american: number): number {
  if (stake <= 0 || !Number.isFinite(american) || american === 0) return 0;
  return round2(stake * (americanToDecimal(american) - 1));
}

export function formatAmerican(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "Unavailable";
  const rounded = Math.round(n);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function formatSpreadLine(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "Unavailable";
  if (n === 0) return "PK";
  return n > 0 ? `+${n}` : `${n}`;
}

export function formatTotalLine(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "Unavailable";
  return `${n}`;
}
