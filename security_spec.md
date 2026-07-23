# Firebase Security Specification & TDD Test Suite

This specification details the Zero-Trust security rules and data invariants protecting **ON ALAA STORE**’s Firestore backend.

## 1. Data Invariants

1. **Products (`products/{productId}`)**:
   - Only authorized Administrators (`alaakhaledhassa174@gmail.com` or `galaxycell.lb@gmail.com`) can create, update, or delete product listings.
   - Public users can only read products that have `visible` set to `true`.
   - Structural fields (e.g. `id`, `name`, `category`, `basePrice`) are required on creation.
   - `basePrice` must be a positive number greater than 0.
   - `stock` must be a non-negative integer.

2. **Reviews (`reviews/{reviewId}`)**:
   - Anyone can write product reviews. Reviews do not require user authentication (guest reviews are permitted).
   - Once written, reviews are immutable. Updates are forbidden.
   - Deletions are restricted strictly to Administrators.
   - `rating` must be a positive integer between 1 and 5 (inclusive).
   - `productId` must be a valid reference ID.

3. **Wishlists (`wishlists/{username}`)**:
   - A logged-in user can only read or write their own wishlist matching their `username`.
   - The wishlist structure must contain an `items` array of string IDs.

4. **Store Settings (`settings/{settingId}`)**:
   - Anyone can read the global configuration to load storefront contact details, logos, or headers.
   - Updates to global configuration require verified Administrator access.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to break the laws of Identity, Integrity, or State and must be rejected with `PERMISSION_DENIED`.

### Payload 1: Unauthorized Product Creation
*   **Target Path**: `/products/prod-hax-1`
*   **Actor**: Anonymous Guest / Non-Admin
*   **Payload**:
    ```json
    {
      "id": "prod-hax-1",
      "name": "Malicious Keyboard",
      "category": "Keyboards",
      "basePrice": 99.99,
      "stock": 10,
      "visible": true
    }
    ```

### Payload 2: Product Creation Missing Required Fields
*   **Target Path**: `/products/prod-hax-2`
*   **Actor**: Verified Admin (`alaakhaledhassa174@gmail.com`)
*   **Payload**:
    ```json
    {
      "id": "prod-hax-2",
      "category": "Keyboards"
    }
    ```

### Payload 3: Product Creation with Negative Price
*   **Target Path**: `/products/prod-hax-3`
*   **Actor**: Verified Admin (`alaakhaledhassa174@gmail.com`)
*   **Payload**:
    ```json
    {
      "id": "prod-hax-3",
      "name": "Malicious Price Hack",
      "category": "Keyboards",
      "basePrice": -25.00,
      "stock": 10,
      "visible": true
    }
    ```

### Payload 4: Shadow Update (Ghost Field Injection)
*   **Target Path**: `/products/prod-hx-origins`
*   **Actor**: Verified Admin (`alaakhaledhassa174@gmail.com`)
*   **Payload**: Adding a ghost privilege field to bypass client limitations.
    ```json
    {
      "id": "prod-hx-origins",
      "name": "HyperX Alloy Origins",
      "category": "Keyboards",
      "basePrice": 109.99,
      "stock": 15,
      "visible": true,
      "bypassERP": true
    }
    ```

### Payload 5: Unauthorized Product Update (Visibility Toggle)
*   **Target Path**: `/products/prod-hx-origins`
*   **Actor**: Authenticated Non-Admin User
*   **Payload**:
    ```json
    {
      "visible": false
    }
    ```

### Payload 6: Unauthorized Product Deletion
*   **Target Path**: `/products/prod-hx-origins`
*   **Actor**: Anonymous Guest / Authenticated Non-Admin
*   **Operation**: `delete`

### Payload 7: Review Creation with Out-Of-Bounds Rating (High)
*   **Target Path**: `/reviews/rev-hax-1`
*   **Actor**: Anonymous Guest
*   **Payload**:
    ```json
    {
      "id": "rev-hax-1",
      "productId": "prod-hx-origins",
      "name": "Hacker",
      "rating": 99,
      "text": "Extremely bad rating hack!",
      "date": "2026-07-15"
    }
    ```

### Payload 8: Review Creation with Negative Rating
*   **Target Path**: `/reviews/rev-hax-2`
*   **Actor**: Anonymous Guest
*   **Payload**:
    ```json
    {
      "id": "rev-hax-2",
      "productId": "prod-hx-origins",
      "name": "Hacker",
      "rating": -1,
      "text": "Negative rating hack",
      "date": "2026-07-15"
    }
    ```

### Payload 9: Malicious Review Update (Bypassing Immutability)
*   **Target Path**: `/reviews/r1`
*   **Actor**: Original Author / Admin / Hacker
*   **Payload**: Modifying a safe verified review text to include links or insults.
    ```json
    {
      "text": "Modifying review contents maliciously"
    }
    ```

### Payload 10: Unauthorized Review Deletion
*   **Target Path**: `/reviews/r1`
*   **Actor**: Non-Admin User
*   **Operation**: `delete`

### Payload 11: Unauthorized Store Settings Update
*   **Target Path**: `/settings/global`
*   **Actor**: Authenticated Non-Admin
*   **Payload**:
    ```json
    {
      "title": "Hacked Store Title",
      "phone": "96171123456",
      "description": "Store defaced!"
    }
    ```

### Payload 12: Store Settings Value Poisoning (Oversized Payload)
*   **Target Path**: `/settings/global`
*   **Actor**: Verified Admin (`alaakhaledhassa174@gmail.com`)
*   **Payload**: Attempting to inject a giant description string.
    ```json
    {
      "title": "Alaa Store",
      "phone": "+961 71 135 241",
      "description": "A very long description repeating for 10 megabytes..."
    }
    ```

---

## 3. Automated Test Runner Suite

The following TypeScript code utilizes `@firebase/rules-unit-testing` to systematically verify that the "Dirty Dozen" malicious write attempts are safely intercepted and blocked.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("ON ALAA STORE - Zero-Trust Firestore Security Rules Test Suite", () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ageless-indexer-7n50x",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // --- PRODUCTS TESTS ---

  it("[Payload 1] - Denies product creation to anonymous users", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, "products", "prod-hax-1");
    await assertFails(
      setDoc(ref, {
        id: "prod-hax-1",
        name: "Malicious Keyboard",
        category: "Keyboards",
        basePrice: 99.99,
        stock: 10,
        visible: true,
      })
    );
  });

  it("[Payload 2] - Denies product creation missing required fields to Admin", async () => {
    const context = testEnv.authenticatedContext("admin-uid", {
      email: "alaakhaledhassa174@gmail.com",
      email_verified: true,
    });
    const db = context.firestore();
    const ref = doc(db, "products", "prod-hax-2");
    await assertFails(
      setDoc(ref, {
        id: "prod-hax-2",
        category: "Keyboards",
      })
    );
  });

  it("[Payload 3] - Denies product creation with a negative price to Admin", async () => {
    const context = testEnv.authenticatedContext("admin-uid", {
      email: "alaakhaledhassa174@gmail.com",
      email_verified: true,
    });
    const db = context.firestore();
    const ref = doc(db, "products", "prod-hax-3");
    await assertFails(
      setDoc(ref, {
        id: "prod-hax-3",
        name: "Malicious Price Hack",
        category: "Keyboards",
        basePrice: -25.00,
        stock: 10,
        visible: true,
      })
    );
  });

  it("[Payload 4] - Denies product creation with un-whitelisted ghost fields (Shadow Update) to Admin", async () => {
    const context = testEnv.authenticatedContext("admin-uid", {
      email: "alaakhaledhassa174@gmail.com",
      email_verified: true,
    });
    const db = context.firestore();
    const ref = doc(db, "products", "prod-hx-origins");
    await assertFails(
      setDoc(ref, {
        id: "prod-hx-origins",
        name: "HyperX Alloy Origins",
        category: "Keyboards",
        basePrice: 109.99,
        stock: 15,
        visible: true,
        bypassERP: true, // Ghost field
      })
    );
  });

  it("[Payload 5] - Denies product updates to non-admin authenticated users", async () => {
    const context = testEnv.authenticatedContext("user-uid", {
      email: "regular-user@gmail.com",
      email_verified: true,
    });
    const db = context.firestore();
    const ref = doc(db, "products", "prod-hx-origins");
    await assertFails(
      updateDoc(ref, {
        visible: false,
      })
    );
  });

  it("[Payload 6] - Denies product deletion to anonymous and non-admin users", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, "products", "prod-hx-origins");
    await assertFails(deleteDoc(ref));
  });

  // --- REVIEWS TESTS ---

  it("[Payload 7] - Denies review creation with out-of-bounds rating (>5)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, "reviews", "rev-hax-1");
    await assertFails(
      setDoc(ref, {
        id: "rev-hax-1",
        productId: "prod-hx-origins",
        name: "Hacker",
        rating: 99,
        text: "Extremely bad rating hack!",
        date: "2026-07-15",
      })
    );
  });

  it("[Payload 8] - Denies review creation with negative rating (<1)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, "reviews", "rev-hax-2");
    await assertFails(
      setDoc(ref, {
        id: "rev-hax-2",
        productId: "prod-hx-origins",
        name: "Hacker",
        rating: -1,
        text: "Negative rating hack",
        date: "2026-07-15",
      })
    );
  });

  it("[Payload 9] - Denies review updates (immutable constraint)", async () => {
    // Setting up the initial review under a high-privilege system view
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "reviews", "r1"), {
        id: "r1",
        productId: "p1",
        name: "Ali M.",
        rating: 5,
        text: "Excellent speeds",
        date: "2026-07-01",
      });
    });

    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, "reviews", "r1");
    await assertFails(
      updateDoc(ref, {
        text: "Modifying review contents maliciously",
      })
    );
  });

  it("[Payload 10] - Denies review deletion to non-admin users", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "reviews", "r1"), {
        id: "r1",
        productId: "p1",
        name: "Ali M.",
        rating: 5,
        text: "Excellent speeds",
        date: "2026-07-01",
      });
    });

    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, "reviews", "r1");
    await assertFails(deleteDoc(ref));
  });

  // --- SETTINGS TESTS ---

  it("[Payload 11] - Denies store setting updates to non-admins", async () => {
    const context = testEnv.authenticatedContext("user-uid", {
      email: "regular-user@gmail.com",
      email_verified: true,
    });
    const db = context.firestore();
    const ref = doc(db, "settings", "global");
    await assertFails(
      updateDoc(ref, {
        title: "Hacked Store Title",
        description: "Store defaced!",
      })
    );
  });

  it("[Payload 12] - Denies store setting updates with oversized value payload", async () => {
    const context = testEnv.authenticatedContext("admin-uid", {
      email: "alaakhaledhassa174@gmail.com",
      email_verified: true,
    });
    const db = context.firestore();
    const ref = doc(db, "settings", "global");
    
    // 5000 character overflow payload
    const overflowText = "A".repeat(5001);
    await assertFails(
      setDoc(ref, {
        title: "Alaa Store",
        phone: "+961 71 135 241",
        description: overflowText,
      })
    );
  });

  // --- HEALTHY WRITE VERIFICATION ---

  it("Allows authenticated Admin to create a valid product", async () => {
    const context = testEnv.authenticatedContext("admin-uid", {
      email: "alaakhaledhassa174@gmail.com",
      email_verified: true,
    });
    const db = context.firestore();
    const ref = doc(db, "products", "prod-valid-1");
    await assertSucceeds(
      setDoc(ref, {
        id: "prod-valid-1",
        name: "Premium Charger",
        category: "Accessories",
        basePrice: 45.00,
        desc: "A highly premium ultra-fast charging brick.",
        stock: 50,
        visible: true,
        imageUrls: [],
        options: [],
        variants: [],
        nameAr: "",
        descAr: "",
        categoryAr: "",
        featured: false,
      })
    );
  });

  it("Allows any guest user to submit a valid review", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const ref = doc(db, "reviews", "rev-valid-1");
    await assertSucceeds(
      setDoc(ref, {
        id: "rev-valid-1",
        productId: "p1",
        name: "John Doe",
        rating: 4,
        text: "Very solid build quality. Strongly recommended.",
        date: "2026-07-15",
      })
    );
  });
});
```
