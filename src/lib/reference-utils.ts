/**
 * reference-utils.ts
 * ─────────────────────────────────────────────────────────
 * Postpipe Reference Field System — Core Utilities
 *
 * Provides:
 *   - Relation detection (foreign key / UUID pattern scanner)
 *   - Field-level reference config builder
 *   - Population (resolve references on read)
 *   - Backward-compat migration helpers
 *   - Migration report generation
 * ─────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────

export interface ReferenceConfig {
  collection: string;       // Target collection / form slug
  bidirectional?: boolean;  // Create back-reference in target
  lazy?: boolean;           // Lazy-load on read (default: true)
  validateExistence?: boolean; // Check that referenced ID exists
  displayField?: string;    // Optional: field to show in UI dropdown (e.g. "name")
  labelField?: string;      // Alias for displayField
}

export interface FormFieldLike {
  name: string;
  type: string;
  required?: boolean;
  options?: string;
  reference?: ReferenceConfig;
}

export interface DetectedRelation {
  fieldName: string;
  fieldType: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedCollection: string;
  reason: string;
}

export interface MigrationReport {
  scannedForms: number;
  scannedFields: number;
  detectedRelations: DetectedRelation[];
  changesApplied: { form: string; field: string; from: string; to: string }[];
  potentialConflicts: { form: string; field: string; reason: string }[];
  timestamp: string;
}

// ─── UUID / Foreign-Key Detection Patterns ────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Field-name patterns that strongly suggest a foreign key */
const HIGH_CONFIDENCE_PATTERNS = [
  { regex: /_uuid$/i,       reason: 'Name ends with _uuid' },
  { regex: /_id$/i,         reason: 'Name ends with _id' },
  { regex: /^fk_/i,         reason: 'Name starts with fk_' },
  { regex: /^ref_/i,        reason: 'Name starts with ref_' },
  { regex: /^parent_/i,     reason: 'Name starts with parent_' },
  { regex: /^related_/i,    reason: 'Name starts with related_' },
];

const MEDIUM_CONFIDENCE_PATTERNS = [
  { regex: /category/i,  reason: 'Likely references a categories collection' },
  { regex: /product/i,   reason: 'Likely references a products collection' },
  { regex: /user/i,      reason: 'Likely references a users collection' },
  { regex: /author/i,    reason: 'Likely references users/authors collection' },
  { regex: /owner/i,     reason: 'Likely references users/owners collection' },
  { regex: /tag/i,       reason: 'Likely references a tags collection' },
  { regex: /brand/i,     reason: 'Likely references a brands collection' },
  { regex: /location/i,  reason: 'Likely references a locations collection' },
  { regex: /department/i, reason: 'Likely references a departments collection' },
  { regex: /role/i,      reason: 'Likely references a roles collection' },
];

/** Field types that ARE relational by definition */
const RELATIONAL_TYPES = new Set(['uuid', 'foreign_key', 'reference', 'fk']);

/**
 * Infer the likely target collection name from a field name.
 * e.g. "category_id" → "categories", "user_uuid" → "users"
 */
export function inferCollectionFromFieldName(fieldName: string): string {
  // strip common suffixes
  let base = fieldName
    .replace(/_uuid$/i, '')
    .replace(/_id$/i, '')
    .replace(/^fk_/i, '')
    .replace(/^ref_/i, '')
    .replace(/_ref$/i, '')
    .replace(/^parent_/i, '')
    .replace(/_key$/i, '')
    .trim();

  if (!base || base.length < 2) base = fieldName;

  // Pluralise naively (good enough for a suggestion)
  if (!base.endsWith('s')) base = base + 's';

  // Convert camelCase / PascalCase to snake_case for collection names
  return base
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}

/**
 * Scan a list of fields and detect potential relational fields.
 */
export function detectRelations(fields: FormFieldLike[]): DetectedRelation[] {
  const detected: DetectedRelation[] = [];

  for (const field of fields) {
    // Already marked as reference — skip
    if (field.reference?.collection) continue;

    let confidence: DetectedRelation['confidence'] | null = null;
    let reason = '';

    // 1. Type-based detection (highest priority)
    if (RELATIONAL_TYPES.has(field.type)) {
      confidence = 'high';
      reason = `Field type '${field.type}' is inherently relational`;
    }

    // 2. Name-pattern detection (high)
    if (!confidence) {
      for (const { regex, reason: r } of HIGH_CONFIDENCE_PATTERNS) {
        if (regex.test(field.name)) {
          confidence = 'high';
          reason = r;
          break;
        }
      }
    }

    // 3. Name-pattern detection (medium)
    if (!confidence) {
      for (const { regex, reason: r } of MEDIUM_CONFIDENCE_PATTERNS) {
        if (regex.test(field.name)) {
          confidence = 'medium';
          reason = r;
          break;
        }
      }
    }

    if (confidence) {
      detected.push({
        fieldName: field.name,
        fieldType: field.type,
        confidence,
        suggestedCollection: inferCollectionFromFieldName(field.name),
        reason,
      });
    }
  }

  return detected;
}

/**
 * Check if a string value looks like a UUID.
 */
export function looksLikeUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Build a ReferenceConfig for a detected relation.
 */
export function buildReferenceConfig(
  suggestedCollection: string,
  opts: Partial<ReferenceConfig> = {}
): ReferenceConfig {
  return {
    collection: suggestedCollection,
    bidirectional: opts.bidirectional ?? false,
    lazy: opts.lazy ?? true,
    validateExistence: opts.validateExistence ?? false,
    displayField: opts.displayField ?? 'name',
    ...opts,
  };
}

/**
 * Auto-upgrade fields: replace raw uuid/foreign_key fields with the
 * proper 'reference' type + ReferenceConfig.
 * Returns modified fields (safe — does NOT mutate the input).
 */
export function upgradeFieldsToReferences(
  fields: FormFieldLike[],
  collectionHints: Record<string, string> = {}
): { fields: FormFieldLike[]; changes: { field: string; from: string; to: string }[] } {
  const changes: { field: string; from: string; to: string }[] = [];

  const upgraded = fields.map((f) => {
    // Skip if already has collection reference
    if (f.reference?.collection) return f;

    const shouldUpgrade =
      RELATIONAL_TYPES.has(f.type) ||
      HIGH_CONFIDENCE_PATTERNS.some((p) => p.regex.test(f.name));

    if (!shouldUpgrade) return f;

    const targetCollection =
      collectionHints[f.name] || inferCollectionFromFieldName(f.name);

    changes.push({
      field: f.name,
      from: f.type,
      to: 'reference',
    });

    return {
      ...f,
      type: 'reference',
      reference: buildReferenceConfig(targetCollection),
    };
  });

  return { fields: upgraded, changes };
}

/**
 * Generate a human-readable migration report.
 */
export function generateMigrationReport(
  forms: Array<{ id: string; name: string; fields: FormFieldLike[] }>,
  appliedChanges: Array<{ form: string; field: string; from: string; to: string }> = []
): MigrationReport {
  const detectedRelations: DetectedRelation[] = [];
  const potentialConflicts: { form: string; field: string; reason: string }[] = [];
  let totalFields = 0;

  for (const form of forms) {
    const relations = detectRelations(form.fields);
    totalFields += form.fields.length;

    for (const rel of relations) {
      detectedRelations.push(rel);
    }

    // Flag conflicts: reference fields without a collection set
    for (const field of form.fields) {
      if (
        (field.type === 'reference' || field.type === 'foreign_key') &&
        !field.reference?.collection
      ) {
        potentialConflicts.push({
          form: form.name,
          field: field.name,
          reason: 'Reference field missing target collection configuration',
        });
      }
    }
  }

  return {
    scannedForms: forms.length,
    scannedFields: totalFields,
    detectedRelations,
    changesApplied: appliedChanges,
    potentialConflicts,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Resolve (populate) reference values in a submission data object.
 * This is a read-time operation — takes stored IDs and resolves them
 * to richer objects if a fetcher is provided.
 *
 * @param data - Raw submission data (key → value)
 * @param fields - Form schema fields
 * @param fetcher - Async function to fetch a record by collection + id
 */
export async function populateReferences(
  data: Record<string, any>,
  fields: FormFieldLike[],
  fetcher: (collection: string, id: string) => Promise<any>
): Promise<Record<string, any>> {
  const result = { ...data };

  await Promise.all(
    fields
      .filter((f) => f.type === 'reference' && f.reference?.collection && !f.reference.lazy)
      .map(async (f) => {
        const rawValue = data[f.name];
        if (!rawValue) return;

        try {
          const resolved = await fetcher(f.reference!.collection, String(rawValue));
          if (resolved) {
            result[f.name] = resolved;
          }
        } catch {
          // Keep original value on resolution failure — backward compat
        }
      })
  );

  return result;
}

/**
 * Backward-compatibility mapper:
 * Converts old *_uuid / *_id raw values to the new reference field storage format.
 * Old: { category_id: "abc123" }
 * New: { category_id: { _ref: "abc123", _collection: "categories" } }
 *
 * Use this during data migration if you want structured reference storage.
 * If you just want to keep raw IDs (recommended for simplicity), skip this.
 */
export function migrateDataToReferenceFormat(
  data: Record<string, any>,
  fields: FormFieldLike[]
): Record<string, any> {
  const result = { ...data };

  for (const field of fields) {
    if (field.type === 'reference' && field.reference?.collection) {
      const rawValue = data[field.name];
      if (rawValue && typeof rawValue === 'string') {
        result[field.name] = {
          _ref: rawValue,
          _collection: field.reference.collection,
        };
      }
    }
  }

  return result;
}

/**
 * Extract the plain ID from a potentially structured reference value.
 * Handles both:
 *   - { _ref: "id", _collection: "col" }
 *   - "plain-id-string"
 */
export function extractRefId(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._ref) return value._ref;
  return null;
}
