export const APP_URL = import.meta.env.VITE_APP_URL || 'https://emprestimo.nu-bank.help';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const getWebhookUrl = (endpoint: string): string => {
  return `${SUPABASE_URL}/functions/v1/${endpoint}`;
};
