export type FieldCategory =
  | 'Text'
  | 'Numeric'
  | 'Boolean'
  | 'Media'
  | 'Structured'
  | 'Selection'
  | 'Relational'
  | 'Reference'
  | 'Temporal';

export interface FieldTypeConfig {
  value: string;
  label: string;
  category: FieldCategory;
  component: string;
}

export const FIELD_TYPES: Record<string, FieldTypeConfig> = {
  text: {
    value: "text",
    label: "Text",
    category: "Text",
    component: "TextInput"
  },
  textarea: {
    value: "textarea",
    label: "Text Area",
    category: "Text",
    component: "TextareaInput"
  },
  email: {
    value: "email",
    label: "Email",
    category: "Text",
    component: "EmailInput"
  },
  number: {
    value: "number",
    label: "Number",
    category: "Numeric",
    component: "NumberInput"
  },
  decimal: {
    value: "decimal",
    label: "Decimal / Float",
    category: "Numeric",
    component: "DecimalInput"
  },
  checkbox: {
    value: "checkbox",
    label: "Checkbox (Boolean)",
    category: "Boolean",
    component: "CheckboxInput"
  },
  image: {
    value: "image",
    label: "Image Upload",
    category: "Media",
    component: "ImageUploader"
  },
  image_array: {
    value: "image_array",
    label: "Array of Images",
    category: "Media",
    component: "ImageUploader"
  },
  list: {
    value: "list",
    label: "List",
    category: "Structured",
    component: "ListInput"
  },
  json_object: {
    value: "json_object",
    label: "JSON Object",
    category: "Structured",
    component: "JsonEditor"
  },
  json_array: {
    value: "json_array",
    label: "JSON Array",
    category: "Structured",
    component: "JsonEditor"
  },
  enum: {
    value: "enum",
    label: "Dropdown",
    category: "Selection",
    component: "SelectInput"
  },
  // ── Reference / Relational types ─────────────────────────────────────────
  // When a field is one of these types, the form builder shows the
  // ReferenceFieldConfig panel (collection picker + options).
  reference: {
    value: "reference",
    label: "Relational Data 🔗",
    category: "Reference",
    component: "ReferenceInput"
  },
  // ── Temporal ─────────────────────────────────────────────────────────────
  datetime: {
    value: "datetime",
    label: "Date & Time",
    category: "Temporal",
    component: "DatetimePicker"
  }
};

// Helper to get grouped types for UI dropdowns
export function getGroupedFieldTypes(): Record<FieldCategory, FieldTypeConfig[]> {
  const groups: Record<string, FieldTypeConfig[]> = {};

  Object.values(FIELD_TYPES).forEach(config => {
    if (!groups[config.category]) {
      groups[config.category] = [];
    }
    groups[config.category].push(config);
  });

  return groups as Record<FieldCategory, FieldTypeConfig[]>;
}
