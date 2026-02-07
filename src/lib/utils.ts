import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures a URL has a protocol (http or https).
 * If no protocol is found, it defaults to https://
 */
export function ensureFullUrl(url: string | null | undefined): string {
  if (!url || url === 'PENDING') return url || '';
  
  // Clean trailing slash
  const cleanUrl = url.replace(/\/$/, "");
  
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  
  return `https://${cleanUrl}`;
}
