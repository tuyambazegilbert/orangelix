import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeIsoDate(value: unknown): string {
  if (!value) return new Date().toISOString();

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return new Date().toISOString();
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeFirebaseTimestamp = value as { toDate?: () => Date };
    if (typeof maybeFirebaseTimestamp.toDate === 'function') {
      const converted = maybeFirebaseTimestamp.toDate();
      return Number.isNaN(converted.getTime()) ? new Date().toISOString() : converted.toISOString();
    }
  }

  return new Date().toISOString();
}

export function normalizeGenreList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export function toGenreSlug(genre: string): string {
  return genre
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
