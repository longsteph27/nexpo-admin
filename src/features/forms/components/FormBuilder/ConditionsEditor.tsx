'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldCondition, FieldConditionAction, FieldConditionOperator, BuilderFormField } from '../../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const OPERATORS: { value: FieldConditionOperator; label: string }[] = [
  { value: '_eq',       label: 'Bằng (=)' },
  { value: '_neq',      label: 'Khác (≠)' },
  { value: '_contains', label: 'Chứa' },
  { value: '_gt',       label: 'Lớn hơn (>)' },
  { value: '_gte',      label: 'Lớn hơn bằng (≥)' },
  { value: '_lt',       label: 'Nhỏ hơn (<)' },
  { value: '_lte',      label: 'Nhỏ hơn bằng (≤)' },
  { value: '_in',       label: 'Nằm trong (in)' },
  { value: '_nin',      label: 'Ngoài (not in)' },
];

const ACTIONS: { value: FieldConditionAction; label: string; icon: string; supportedTypes?: string[] }[] = [
  { value: 'show',        label: 'Hiển thị (show)',     icon: 'lucide:eye' },
  { value: 'hide',        label: 'Ẩn (hide)',           icon: 'lucide:eye-off' },
  { value: 'required',    label: 'Bắt buộc',            icon: 'lucide:asterisk' },
  { value: 'optional',    label: 'Không bắt buộc',      icon: 'lucide:minus-circle' },
  { value: 'readonly',    label: 'Chỉ đọc',             icon: 'lucide:lock' },
  { 
    value: 'set_options', 
    label: 'Đổi options dropdown', 
    icon: 'lucide:list',
    supportedTypes: ['select', 'multiselect']
  },
  { value: 'set_value',   label: 'Gán giá trị',         icon: 'lucide:pen-line' },
];

const EMPTY_CONDITION: FieldCondition = {
  source_field_id: '',
  operator: '_eq',
  value: '',
  action: 'show',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConditionsEditorProps {
  conditions: FieldCondition[];
  allFields: BuilderFormField[];   // tất cả fields trong form (để chọn source)
  currentFieldId: string;          // field đang edit (exclude khỏi source list)
  activeLang: 'en-US' | 'vi-VN';
  onChange: (conditions: FieldCondition[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConditionsEditor({
  conditions,
  allFields,
  currentFieldId,
  activeLang,
  onChange,
}: ConditionsEditorProps) {

  // Fields khả dụng để chọn làm source (bỏ field hiện tại)
  const sourceFields = allFields.filter((f) => f.id !== currentFieldId);

  // Lấy options gốc của field hiện tại để pick nhanh
  const currentField = allFields.find((f) => f.id === currentFieldId);
  const baseOptions = currentField?.translations?.[activeLang]?.options || [];

  function addRule() {
    onChange([...conditions, { ...EMPTY_CONDITION }]);
  }

  function removeRule(index: number) {
    onChange(conditions.filter((_, i) => i !== index));
  }

  function updateRule(index: number, patch: Partial<FieldCondition>) {
    onChange(conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function updateExtraOption(ruleIdx: number, optIdx: number, patch: { label?: string; value?: string }) {
    const rule = conditions[ruleIdx];
    const arr = [...(rule.extra_options || [])];
    arr[optIdx] = { ...arr[optIdx], ...patch };
    updateRule(ruleIdx, { extra_options: arr });
  }

  function addExtraOption(ruleIdx: number) {
    const rule = conditions[ruleIdx];
    const arr = [...(rule.extra_options || []), { label: '', value: '' }];
    updateRule(ruleIdx, { extra_options: arr });
  }

  function removeExtraOption(ruleIdx: number, optIdx: number) {
    const rule = conditions[ruleIdx];
    const arr = (rule.extra_options || []).filter((_, i) => i !== optIdx);
    updateRule(ruleIdx, { extra_options: arr });
  }

  /** Toggle một option từ base list vào extra_options của rule */
  function toggleBaseOption(ruleIdx: number, baseOpt: { label: string; value: string }) {
    const rule = conditions[ruleIdx];
    const currentExtras = rule.extra_options || [];
    const exists = currentExtras.find(o => o.value === baseOpt.value);

    if (exists) {
      removeExtraOption(ruleIdx, currentExtras.indexOf(exists));
    } else {
      updateRule(ruleIdx, {
        extra_options: [...currentExtras, { ...baseOpt }]
      });
    }
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon icon="lucide:git-branch" className="w-3.5 h-3.5 text-purple-600" />
          <label className="text-xs font-semibold text-content-secondary">Conditions</label>
          {conditions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">
              {conditions.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
        >
          <Icon icon="lucide:plus" className="w-3 h-3" />
          Add Rule
        </button>
      </div>

      {/* Empty state */}
      {conditions.length === 0 && (
        <div className="text-center py-3 border border-dashed border-gray-200 rounded-lg">
          <Icon icon="lucide:git-branch" className="w-5 h-5 mx-auto mb-1 text-gray-300" />
          <p className="text-[11px] text-gray-400">No conditions. Click "Add Rule" to start.</p>
        </div>
      )}

      {/* Rule list */}
      <AnimatePresence initial={false}>
        {conditions.map((rule, idx) => {
          const sourceField = allFields.find((f) => f.id === rule.source_field_id);
          const sourceLabel = sourceField?.translations?.[activeLang]?.label || sourceField?.name || rule.source_field_id;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="border border-purple-100 bg-purple-50/40 rounded-lg p-3 space-y-2.5"
            >
              {/* Row header: rule number + delete */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">
                  Rule {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                  title="Delete rule"
                >
                  <Icon icon="lucide:trash-2" className="w-3 h-3" />
                </button>
              </div>

              {/* IF: Source field */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">IF field</label>
                <select
                  value={rule.source_field_id}
                  onChange={(e) => updateRule(idx, { source_field_id: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="">— Select source field —</option>
                  {sourceFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.translations?.[activeLang]?.label || f.name || f.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator + Value row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Operator</label>
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(idx, { operator: e.target.value as FieldConditionOperator })}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">
                    Value
                    {(rule.operator === '_in' || rule.operator === '_nin') && (
                      <span className="text-gray-400 ml-1">(A,B,C)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => updateRule(idx, { value: e.target.value })}
                    placeholder="Value..."
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* THEN: Action */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">THEN action</label>
                <select
                  value={rule.action}
                  onChange={(e) => updateRule(idx, { action: e.target.value as FieldConditionAction })}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  {ACTIONS
                    .filter(a => !a.supportedTypes || (currentField?.type && a.supportedTypes.includes(currentField.type)))
                    .map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))
                  }
                </select>
              </div>

              {/* Extra: set_value */}
              {rule.action === 'set_value' && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Set value to</label>
                  <input
                    type="text"
                    value={rule.extra_value || ''}
                    onChange={(e) => updateRule(idx, { extra_value: e.target.value })}
                    placeholder="Giá trị sẽ được gán..."
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              )}

              {/* Extra: set_options — inline options builder + quick pick */}
              {rule.action === 'set_options' && (
                <div className="space-y-2">
                  {/* Quick pick from base options */}
                  {baseOptions.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1.5">
                        Chọn nhanh từ các options hiện có:
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {baseOptions.map((opt, bIdx) => {
                          const isSelected = (rule.extra_options || []).some(o => o.value === opt.value);
                          return (
                            <button
                              key={bIdx}
                              type="button"
                              onClick={() => toggleBaseOption(idx, opt)}
                              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                                isSelected
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1.5">
                      Danh sách options hiển thị (có thể thêm mới):
                    </label>
                    <div className="space-y-1.5">
                      {(rule.extra_options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-6">
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => updateExtraOption(idx, optIdx, { label: e.target.value })}
                              placeholder="Label"
                              className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          </div>
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={opt.value}
                              onChange={(e) => updateExtraOption(idx, optIdx, { value: e.target.value })}
                              placeholder="Value"
                              className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExtraOption(idx, optIdx)}
                            className="col-span-1 p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                          >
                            <Icon icon="lucide:x" className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addExtraOption(idx)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <Icon icon="lucide:plus" className="w-3 h-3" />
                        Thêm option tùy chỉnh
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary chip */}
              {rule.source_field_id && rule.action && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px]">
                    <Icon icon="lucide:eye" className="w-2.5 h-2.5" />
                    IF <strong>{sourceLabel}</strong> {rule.operator} <strong>"{rule.value}"</strong>
                    → {ACTIONS.find(a => a.value === rule.action)?.label}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
