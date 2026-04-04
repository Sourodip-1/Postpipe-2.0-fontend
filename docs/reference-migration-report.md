# Postpipe Reference Field System — Migration Report

> **Generated:** 2026-04-03 | **Status:** ✅ Applied

---

## 1. Detected Relations (Scan Results)

| Field Pattern | Confidence | Suggested Collection | Reason |
|---|---|---|---|
| `*_uuid` | 🟢 High | inferred from name | Name ends with `_uuid` |
| `*_id` | 🟢 High | inferred from name | Name ends with `_id` |
| `fk_*` | 🟢 High | inferred from name | Name starts with `fk_` |
| `ref_*` | 🟢 High | inferred from name | Name starts with `ref_` |
| `parent_*` | 🟢 High | inferred from name | Name starts with `parent_` |
| `category*` | 🟡 Medium | `categories` | Likely references a categories collection |
| `product*` | 🟡 Medium | `products` | Likely references a products collection |
| `user*` / `author*` | 🟡 Medium | `users` | Likely references users collection |
| `tag*` | 🟡 Medium | `tags` | Likely references a tags collection |
| Field type `uuid` | 🟢 High | inferred from name | Field type is inherently relational |
| Field type `foreign_key` | 🟢 High | inferred from name | Field type is inherently relational |
| Field type `reference` | 🟢 High | inferred from name | Field type is inherently relational |

---

## 2. Changes Applied

### 2a. New Files Created / Replaced

| File | Change |
|---|---|
| `src/lib/reference-utils.ts` | **Created** — Full reference system utilities |
| `src/components/ui/reference-input.tsx` | **Replaced** — Working ReferenceFieldConfig + ReferenceInput |
| `src/config/field-types.ts` | **Replaced** — Clearer Reference category labels |

### 2b. Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/new-form-client.tsx` | ReferenceFieldConfig panel, auto-suggest, collection loader, reference persistence, reference preview |
| `src/app/actions/dashboard.ts` | Added `getFormsAction()` |
| `static-system/my-connector/src/server.ts` | Added `POST /postpipe/resolve` endpoint |

---

## 3. Architecture

```
User selects "Reference (Relational) 🔗"
        │
        ▼
ReferenceFieldConfig panel appears
  ├─ Collection picker (your deployed forms)
  ├─ Bidirectional, Lazy Load, Validate toggles
        │
        ▼
Persisted to MongoDB as:
  { type: "reference", reference: { collection: "categories", lazy: true, ... } }
        │
        ▼
Submission stores raw ID: { "Category": "abc123" }
        │
        ▼ (optional read-time)
POST /postpipe/resolve → returns populated records
```

---

## 4. Backward Compatibility

> All existing data is preserved. No destructive migration needed.
>
> - Old uuid/foreign_key fields keep storing raw string IDs unchanged
> - The reference config is **additive** — absent = behaves exactly as before
> - /postpipe/resolve is opt-in — existing APIs untouched
> - extractRefId() handles both plain strings and structured { _ref, _collection } values

---

## 5. Potential Conflicts

| Scenario | Risk | Mitigation |
|---|---|---|
| Reference fields with no collection set | Medium | Preview shows "No collection selected" warning |
| Collection renamed after reference created | Low | Slug (immutable ID) is stored, not display name |
| `@radix-ui/react-debounce` broken import | Was crash | Fixed — replaced with native useDebounce hook |

---

## 6. New API

### `POST /postpipe/resolve`
```json
// Request
{ "collection": "categories", "ids": ["id1", "id2"], "targetDatabase": "main" }

// Response
{ "success": true, "count": 2, "resolved": { "id1": { "name": "Electronics" }, "id2": null } }
```

### `getFormsAction()` (Server Action)
Returns `[{ id, name, fields }]` — used to populate collection picker.

### `reference-utils.ts` exports
```ts
detectRelations(fields)            // scan FK-like fields
inferCollectionFromFieldName(name) // "category_id" → "categories"
upgradeFieldsToReferences(fields)  // auto-upgrade UUID/FK fields
generateMigrationReport(forms)     // produce migration reports
populateReferences(data, fields)   // resolve refs on read
extractRefId(value)                // handle plain or structured refs
```

---

## 7. User Flow (Zero Hassle)

1. Open **Form Builder** → add a field
2. Set type to **"Reference (Relational) 🔗"**
3. Pick collection from **auto-loaded dropdown** (all your forms appear)
4. Toggle options if needed
5. **Deploy** — done. No UUID typing. No manual wiring.
