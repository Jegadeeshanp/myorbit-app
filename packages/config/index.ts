export const API_BASE_URL: string =
  (typeof process !== 'undefined' && (process.env as any).EXPO_PUBLIC_API_URL) ||
  'http://localhost:3000';
