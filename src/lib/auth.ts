export type UserRole = "super_admin" | "manager" | "dispatcher";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  passwordHash: string; // SHA-256 hashed
}

export interface Permission {
  manage_products: boolean;
  manage_orders: boolean;
  manage_settings: boolean;
  manage_users: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  super_admin: {
    manage_products: true,
    manage_orders: true,
    manage_settings: true,
    manage_users: true,
  },
  manager: {
    manage_products: true,
    manage_orders: true,
    manage_settings: false,
    manage_users: false,
  },
  dispatcher: {
    manage_products: false,
    manage_orders: true,
    manage_settings: false,
    manage_users: false,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  manager: "Store Manager",
  dispatcher: "Order Dispatcher",
};

// Pure TS SHA-256 fallback to ensure 100% operation inside sandboxed iframes
export function sha256Pure(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  let mathPow = Math.pow;
  let maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j; // Used for looping
  let result = '';

  let words: number[] = [];
  let asciiLength = ascii[lengthProperty] * 8;
  
  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  let isPrime = function(n: number) {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80'; // Append '1' bit and seven '0' bits
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00'; // Key padding
  
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII restriction check
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);

  // Process each chunk
  for (j = 0; j < words[lengthProperty]; j += 16) {
    let w = words.slice(j, j + 16);
    let oldHash = hash.slice(0);
    hash = hash.slice(0);
    
    for (i = 0; i < 64; i++) {
      let wItem = w[i];
      if (i >= 16) {
        let s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        let s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      
      let s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      let t2 = (s0_h + maj) | 0;
      
      let s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      let t1 = (hash[7] + s1_h + ch + k[i] + (wItem || 0)) | 0;

      hash = [
        (t1 + t2) | 0,
        hash[0],
        hash[1],
        hash[2],
        ((hash[3] + t1) | 0) as number,
        hash[4],
        hash[5],
        hash[6]
      ];
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    let hexValue = (hash[i] >>> 0).toString(16);
    result += '0'.repeat(8 - hexValue.length) + hexValue;
  }
  
  return result;
}

export function hashPassword(password: string): string {
  // Use pure TS SHA-256 + store specific salt
  return sha256Pure(password + "::alaa-store-secure-salt-2026");
}

// Default initial user base (Admin only, other default staff accounts Samer Saad & Nour Harb have been permanently deleted)
export const INITIAL_USERS: User[] = [
  {
    id: "user-admin",
    username: "admin",
    fullName: "Alaa Khaled (Super Admin)",
    email: "alaakhaledhassa174@gmail.com",
    role: "super_admin",
    passwordHash: hashPassword("A123321A"), // Secure password key: A123321A
  },
];

import { safeGetItem, safeSetItem } from "./storage";

const USERS_STORAGE_KEY = "alaa_store_users";

export function loadUsers(): User[] {
  const stored = safeGetItem(USERS_STORAGE_KEY);
  let usersList: User[] = [];
  if (!stored) {
    // Seed initial users
    usersList = INITIAL_USERS;
  } else {
    try {
      usersList = JSON.parse(stored);
    } catch (e) {
      usersList = INITIAL_USERS;
    }
  }

  // Enforce Super Admin's password to exactly match the required key: A123321A
  usersList = usersList.map((u) => {
    if (u.id === "user-admin" || u.username === "admin") {
      return {
        ...u,
        passwordHash: hashPassword("A123321A")
      };
    }
    return u;
  });

  // Admin-mandated Bulk Deletion of Samer Saad (user-manager) and Nour Harb (user-staff)
  const filteredList = usersList.filter(
    (u) => u.id !== "user-manager" && u.id !== "user-staff" && u.username !== "manager" && u.username !== "staff"
  );

  if (filteredList.length !== usersList.length || !stored) {
    safeSetItem(USERS_STORAGE_KEY, JSON.stringify(filteredList));
  }

  return filteredList;
}

export function saveUsers(users: User[]) {
  safeSetItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function checkPermission(user: User | null, action: keyof Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role][action];
}
