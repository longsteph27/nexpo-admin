import { useEffect, useRef, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

// --- Types ---
export type Operator = "_eq" | "_neq" | "_contains" | "_gt" | "_gte" | "_lt" | "_lte" | "_in" | "_nin";
export type Action = "show" | "hide" | "required" | "optional" | "readonly" | "set_options" | "set_value";

/**
 * Cấu trúc condition trong Directus (sau khi patch schema):
 * Mỗi row trong Repeater có flat fields:
 *   source_field_id, operator, value, action, extra_value, extra_options
 *
 * Legacy (trước khi patch): { item: { source_field_id, operator, value, action, extra } }
 */
export interface Condition {
  source_field_id: string;
  operator: Operator;
  value: any;
  action: Action;
  // New flat structure (sau patch schema)
  extra_value?: any;
  extra_options?: { label: string; value: string | number }[] | null;
  // Legacy nested structure (trước patch schema)
  extra?: {
    options?: { label?: string; text?: string; value: string | number }[];
    value?: any;
  };
}

// Raw item từ Directus có thể bị wrap trong .item (legacy list interface)
type RawConditionRow = Condition | { item: Condition };

export interface Field {
  id: string;
  name: string;
  type: "input" | "textarea" | "email" | "number" | "select" | "multiselect" | string;
  options?: string[] | { label: string; value: string | number }[] | { text: string; value: string | number }[];
  is_required: boolean;
  conditions?: RawConditionRow[];
}

export interface FormConditionsState {
  visibleFields: Record<string, boolean>;
  readonlyFields: Record<string, boolean>;
  requiredFields: Record<string, boolean>;
  dynamicOptions: Record<string, { label: string; value: string | number }[]>;
}

/** Unwrap cả legacy { item: {...} } lẫn flat condition object */
function normalizeCondition(raw: RawConditionRow): Condition {
  if (raw && typeof raw === "object" && "item" in raw && raw.item) {
    return raw.item as Condition;
  }
  return raw as Condition;
}

/** Lấy danh sách options từ condition (hỗ trợ cả flat extra_options và legacy extra.options) */
function getConditionOptions(cond: Condition): { label: string; value: string | number }[] | null {
  // Flat structure (sau patch)
  if (cond.extra_options && Array.isArray(cond.extra_options)) {
    return cond.extra_options.map(o => ({
      label: String((o as any).label || (o as any).text || o.value),
      value: o.value,
    }));
  }
  // Legacy nested structure
  if (cond.extra?.options && Array.isArray(cond.extra.options)) {
    return cond.extra.options.map(o => ({
      label: String(o.label || (o as any).text || o.value),
      value: o.value,
    }));
  }
  return null;
}

/** Lấy value từ condition (hỗ trợ cả flat extra_value và legacy extra.value) */
function getConditionSetValue(cond: Condition): any {
  if (cond.extra_value !== undefined && cond.extra_value !== null) return cond.extra_value;
  if (cond.extra?.value !== undefined) return cond.extra.value;
  return undefined;
}

/**
 * Parse value string cho operator _in / _nin.
 * Directus list interface lưu value là string dạng "A,B,C" hoặc đã là array.
 */
function parseValueForOperator(value: any, operator: Operator): any {
  if (operator === "_in" || operator === "_nin") {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value.split(",").map(s => s.trim()).filter(Boolean);
    }
  }
  return value;
}

// --- Helper: Đánh giá Operator ---
function evaluateCondition(sourceValue: any, operator: Operator, rawTargetValue: any): boolean {
  const targetValue = parseValueForOperator(rawTargetValue, operator);
  const targetArr = Array.isArray(targetValue) ? targetValue : [targetValue];

  // Nếu field trống, chỉ match _neq hoặc _nin
  if ((sourceValue === undefined || sourceValue === null || sourceValue === "") && operator !== "_neq" && operator !== "_nin") {
    return false;
  }

  switch (operator) {
    case "_eq":
      return String(sourceValue) === String(targetValue);
    case "_neq":
      return String(sourceValue) !== String(targetValue);
    case "_contains":
      if (Array.isArray(sourceValue)) return sourceValue.includes(targetValue);
      return String(sourceValue).toLowerCase().includes(String(targetValue).toLowerCase());
    case "_in":
      // Multiselect: ít nhất 1 value chọn nằm trong targetArr
      if (Array.isArray(sourceValue)) return sourceValue.some(v => targetArr.map(String).includes(String(v)));
      return targetArr.map(String).includes(String(sourceValue));
    case "_nin":
      if (Array.isArray(sourceValue)) return !sourceValue.some(v => targetArr.map(String).includes(String(v)));
      return !targetArr.map(String).includes(String(sourceValue));
    case "_gt":
      return Number(sourceValue) > Number(targetValue);
    case "_gte":
      return Number(sourceValue) >= Number(targetValue);
    case "_lt":
      return Number(sourceValue) < Number(targetValue);
    case "_lte":
      return Number(sourceValue) <= Number(targetValue);
    default:
      return false;
  }
}

// --- Hook Chính ---
export function useFormConditions(fields: Field[], form: UseFormReturn<any>) {
  const { control, setValue } = form;

  const formValues = useWatch({ control });
  const formValuesStr = JSON.stringify(formValues);
  // Stabilize fields reference — only re-run effect when fields content changes
  const fieldsStr = JSON.stringify(fields);
  const fieldsRef = useRef(fields);
  if (fieldsStr !== JSON.stringify(fieldsRef.current)) {
    fieldsRef.current = fields;
  }

  const [state, setState] = useState<FormConditionsState>(() => ({
    visibleFields: fields.reduce((acc, f) => ({ ...acc, [f.id]: true }), {}),
    readonlyFields: {},
    requiredFields: fields.reduce((acc, f) => ({ ...acc, [f.id]: !!f.is_required }), {}),
    dynamicOptions: {},
  }));

  useEffect(() => {
    const stableFields = fieldsRef.current;

    // 1. Reset state về mặc định
    const newState: FormConditionsState = {
      visibleFields: stableFields.reduce((acc, f) => ({ ...acc, [f.id]: true }), {} as Record<string, boolean>),
      readonlyFields: {},
      requiredFields: stableFields.reduce((acc, f) => ({ ...acc, [f.id]: !!f.is_required }), {} as Record<string, boolean>),
      dynamicOptions: {},
    };

    const sideEffectUpdates: Record<string, any> = {};

    // 2. Chạy Evaluation Engine
    stableFields.forEach((field) => {
      if (!field.conditions || field.conditions.length === 0) return;

      field.conditions.forEach((rawCond) => {
        // Normalize: unwrap legacy .item nếu có
        const cond = normalizeCondition(rawCond);
        if (!cond || !cond.source_field_id || !cond.operator || !cond.action) return;

        const sourceValue = formValues[cond.source_field_id];
        const isMatch = evaluateCondition(sourceValue, cond.operator, cond.value);

        if (isMatch) {
          switch (cond.action) {
            case "show":
              newState.visibleFields[field.id] = true;
              break;

            case "hide":
              newState.visibleFields[field.id] = false;
              // Reset value khi field bị ẩn
              if (formValues[field.id] !== undefined && formValues[field.id] !== "") {
                sideEffectUpdates[field.id] = field.type === "multiselect" ? [] : undefined;
              }
              break;

            case "required":
              newState.requiredFields[field.id] = true;
              break;

            case "optional":
              newState.requiredFields[field.id] = false;
              break;

            case "readonly":
              newState.readonlyFields[field.id] = true;
              break;

            case "set_options": {
              const options = getConditionOptions(cond);
              if (options) {
                newState.dynamicOptions[field.id] = options;
                // Reset value nếu không còn hợp lệ trong options mới
                const currentVal = formValues[field.id];
                if (currentVal) {
                  const valArr = Array.isArray(currentVal) ? currentVal : [currentVal];
                  const newValidValues = options.map(o => String(o.value));
                  const isValid = valArr.every(v => newValidValues.includes(String(v)));
                  if (!isValid) {
                    sideEffectUpdates[field.id] = Array.isArray(currentVal) ? [] : undefined;
                  }
                }
              }
              break;
            }

            case "set_value": {
              const newValue = getConditionSetValue(cond);
              if (newValue !== undefined && formValues[field.id] !== newValue) {
                sideEffectUpdates[field.id] = newValue;
              }
              break;
            }
          }
        }
      });
    });

    // 3. Update States UI — only setState when content actually changed
    setState((prev) => {
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(newState);
      return prevStr === nextStr ? prev : newState;
    });

    // 4. Side Effects: reset hidden fields, clear invalid options, set_value
    Object.keys(sideEffectUpdates).forEach((fieldId) => {
      setValue(fieldId, sideEffectUpdates[fieldId], { shouldValidate: false, shouldDirty: true });
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValuesStr, fieldsStr, setValue]);

  return state;
}
