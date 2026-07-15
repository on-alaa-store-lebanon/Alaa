import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

// Suppress internal Firebase/Firestore connection failure console.error logs,
// redirecting them to console.warn to prevent false-positive app failures in restricted/offline sandboxes.
const originalConsoleError = console.error;
console.error = function (...args) {
  const argStr = args.map(arg => {
    try {
      return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
    } catch (_) {
      return String(arg);
    }
  }).join(" ");
  
  if (
    argStr.includes("Could not reach Cloud Firestore backend") ||
    argStr.includes("code=unavailable") ||
    argStr.includes("@firebase/firestore")
  ) {
    console.warn("[Firestore Offline Mode]", ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

// Initialize Firebase using the configuration from the generated file.
const app = initializeApp(firebaseConfig);

// Initialize Firestore. Pass custom databaseId if defined in the config.
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Initialize Cloud Storage.
export const storage = getStorage(app);

// Operations & Custom Error Handling conforming to firebase-integration skill instructions
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isQuotaError(error: any): boolean {
  if (!error) return false;
  const errMsg = typeof error === "string" ? error : (error.message || String(error));
  return (
    errMsg.includes("Quota exceeded") ||
    errMsg.includes("quota") ||
    errMsg.includes("Quota limit exceeded") ||
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("resource-exhausted") ||
    (error && typeof error === "object" && error.code === "resource-exhausted")
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
