/**
 * Security Architecture and Monitoring module for 'ON ALAA STORE'.
 * Provides input sanitization, threat mitigation, and system auditing/logging.
 */

// Escape HTML characters to prevent Cross-Site Scripting (XSS)
export function sanitizeHTML(str: string): string {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Mitigate common SQL injection patterns (simulated SQL injection escape for safe persistence)
export function sanitizeSQL(str: string): string {
  if (typeof str !== 'string') return str;
  return str
    .replace(/['"\\;]/g, (match) => `\\${match}`)
    .replace(/--/g, '\\-\\-');
}

/**
 * Sanitizes input text to defend against:
 * 1. Cross-Site Scripting (XSS) - strips script tags/event handlers and escapes HTML
 * 2. SQL Injection - escapes special query characters
 */
export function sanitizeInput(str: string): string {
  if (!str) return "";
  let clean = str.trim();
  
  // Strip script, style elements, javascript: protocols, and event handlers
  clean = clean.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  clean = clean.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=/gi, ''); // e.g., onload=, onclick=
  
  // HTML escape and SQL pattern escaping
  clean = sanitizeHTML(clean);
  clean = sanitizeSQL(clean);
  return clean;
}

export interface SecurityLog {
  id: string;
  timestamp: string; // ISO String
  event: "FAILED_LOGIN" | "UNAUTHORIZED_ACCESS" | "CREDENTIALS_REVOKED" | "SESSION_TIMEOUT" | "DATABASE_RESET" | "LOGIN_SUCCESS" | "SIGNUP_SUCCESS";
  username: string;
  details: string;
  ipAddress: string;
}

import { safeGetItem, safeSetItem, safeRemoveItem } from "./storage";

const STORAGE_KEY_SECURITY_LOGS = "alaa_store_security_logs";

/**
 * Loads system security logs from localStorage.
 */
export function loadSecurityLogs(): SecurityLog[] {
  const stored = safeGetItem(STORAGE_KEY_SECURITY_LOGS);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

/**
 * Adds a new security audit log.
 */
export function addSecurityLog(
  event: SecurityLog["event"],
  username: string,
  details: string
): SecurityLog[] {
  const logs = loadSecurityLogs();
  const newLog: SecurityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    event,
    username: username || "anonymous",
    details,
    ipAddress: "Sandbox-Iframe Client Loopback (IPv4/IPv6 Dev)"
  };
  
  // Limit to last 150 entries for cache efficiency
  const updatedLogs = [newLog, ...logs].slice(0, 150);
  safeSetItem(STORAGE_KEY_SECURITY_LOGS, JSON.stringify(updatedLogs));
  return updatedLogs;
}

/**
 * Clears security logs (Super Admin action).
 */
export function clearSecurityLogs(): void {
  safeRemoveItem(STORAGE_KEY_SECURITY_LOGS);
}
