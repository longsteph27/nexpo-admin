'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { toast } from 'sonner';
import { eventsApi } from '@/lib/api';
import { useFormsByEvent, useForm } from '@/features/forms/hooks/useForms';
import type { FormField } from '@/features/forms/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BadgeSizeKey = 'cr80' | '72x106' | '90x57' | 'a6' | 'a5' | 'custom';

export interface BadgeElement {
  id: string;
  type: 'field' | 'text' | 'qr';
  fieldId?: string;   // for type='field': UUID of form_field OR special key (full_name/email/phone_number)
  content?: string;   // for type='text'
  label: string;
  fontSize: number;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  enabled: boolean;
}

export interface BadgeConfig {
  size: BadgeSizeKey;
  widthMm: number;
  heightMm: number;
  elements: BadgeElement[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const BADGE_SIZES: Record<BadgeSizeKey, { label: string; width: number; height: number }> = {
  'cr80':   { label: 'CR80 – Thẻ tín dụng (85.6×54mm)',   width: 85.6, height: 54 },
  '72x106': { label: 'Badge sự kiện (72×106mm)',           width: 72,   height: 106 },
  '90x57':  { label: 'Name tag (90×57mm)',                  width: 90,   height: 57 },
  'a6':     { label: 'A6 (148×105mm)',                      width: 148,  height: 105 },
  'a5':     { label: 'A5 (210×148mm)',                      width: 210,  height: 148 },
  'custom': { label: 'Tùy chỉnh (mm)',                      width: 80,   height: 120 },
};

// Special parsed fields (not real form field UUIDs)
const PARSED_FIELDS: BadgeElement[] = [
  { id: '_parsed_name',  type: 'field', fieldId: 'full_name',    label: 'Họ và tên (tự nhận diện)',    fontSize: 16, bold: true,  align: 'center', enabled: true  },
  { id: '_parsed_email', type: 'field', fieldId: 'email',        label: 'Email (tự nhận diện)',        fontSize: 11, bold: false, align: 'center', enabled: false },
  { id: '_parsed_phone', type: 'field', fieldId: 'phone_number', label: 'Số điện thoại (tự nhận diện)', fontSize: 11, bold: false, align: 'center', enabled: false },
  { id: '_auto_number',  type: 'field', fieldId: 'auto_number',  label: 'Số thứ tự',                   fontSize: 11, bold: false, align: 'center', enabled: false },
  { id: '_badge_id',     type: 'field', fieldId: 'badge_id',     label: 'Badge ID',                    fontSize: 10, bold: false, align: 'center', enabled: false },
  { id: '_qr',           type: 'qr',                             label: 'Mã QR',                       fontSize: 10, bold: false, align: 'center', enabled: true  },
];

export const DEFAULT_BADGE_CONFIG: BadgeConfig = {
  size: '72x106',
  widthMm: 72,
  heightMm: 106,
  elements: PARSED_FIELDS,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFieldLabel(field: FormField): string {
  const t = field.translations?.find(t => t.languages_code === 'vi-VN')
         ?? field.translations?.find(t => t.languages_code === 'en-US')
         ?? field.translations?.[0];
  return t?.label?.trim() || field.name || field.id;
}

// Build badge elements from form fields (for initial load)
function buildElementsFromFormFields(
  formFields: FormField[],
  existing: BadgeElement[]
): BadgeElement[] {
  const existingMap = new Map(existing.map(e => [e.id, e]));

  // Keep parsed/special elements as-is
  const parsedEls = PARSED_FIELDS.map(p => existingMap.get(p.id) ?? p);

  // Form field elements (one per form field)
  const formEls = formFields
    .filter(f => !['file', 'image', 'upload'].includes(f.type ?? ''))
    .map(f => {
      const existingEl = existingMap.get(f.id);
      return existingEl ?? {
        id: f.id,
        type: 'field' as const,
        fieldId: f.id,   // UUID — resolved at print time
        label: getFieldLabel(f),
        fontSize: 12,
        bold: false,
        align: 'center' as const,
        enabled: false,
      };
    });

  // Put QR at end
  const qrEl = parsedEls.find(e => e.id === '_qr')!;
  const otherParsed = parsedEls.filter(e => e.id !== '_qr');

  return [...otherParsed, ...formEls, qrEl];
}

// ─── Badge Preview ────────────────────────────────────────────────────────────

function BadgePreview({ config }: { config: BadgeConfig }) {
  const SCALE = 2.5;
  const w = config.widthMm * SCALE;
  const h = config.heightMm * SCALE;
  const padding = 5 * SCALE;

  const sampleValues: Record<string, string> = {
    full_name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone_number: '0901 234 567',
    auto_number: '001',
    badge_id: 'BADGE-001',
    redeem_id: 'REDEEM-XYZ',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-gray-500">Preview ({config.widthMm}×{config.heightMm}mm)</p>
      <div
        className="bg-white border-2 border-gray-300 rounded shadow-md overflow-hidden flex flex-col items-center justify-center gap-1"
        style={{ width: Math.min(w, 220), height: Math.min(h, 320), padding, boxSizing: 'border-box', maxWidth: '100%' }}
      >
        {config.elements.filter(el => el.enabled).map(el => {
          const justify = el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start';
          const textAlign = el.align as React.CSSProperties['textAlign'];

          if (el.type === 'qr') {
            return (
              <div key={el.id} style={{ display: 'flex', justifyContent: justify, width: '100%' }}>
                <div className="bg-gray-100 border border-gray-300 rounded flex items-center justify-center" style={{ width: 40, height: 40 }}>
                  <Icon icon="lucide:qr-code" style={{ width: 28, height: 28, color: '#374151' }} />
                </div>
              </div>
            );
          }

          const text = el.type === 'text'
            ? (el.content || 'Nội dung')
            : (el.fieldId ? (sampleValues[el.fieldId] || el.label) : el.label);

          return (
            <div key={el.id} style={{ width: '100%', textAlign, lineHeight: 1.3 }}>
              <span style={{ fontSize: el.fontSize * 0.7, fontWeight: el.bold ? 700 : 400, color: '#111827' }}>
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Element Row ──────────────────────────────────────────────────────────────

function ElementRow({
  el, index, total, onChange, onMove,
}: {
  el: BadgeElement;
  index: number;
  total: number;
  onChange: (u: BadgeElement) => void;
  onMove: (from: number, to: number) => void;
}) {
  const isSpecial = el.id.startsWith('_');

  return (
    <div className={`border rounded-lg p-3 ${el.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/40'}`}>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button disabled={index === 0} onClick={() => onMove(index, index - 1)}
            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
            <Icon icon="lucide:chevron-up" className="w-3 h-3 text-gray-500" />
          </button>
          <button disabled={index === total - 1} onClick={() => onMove(index, index + 1)}
            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
            <Icon icon="lucide:chevron-down" className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        <button
          onClick={() => onChange({ ...el, enabled: !el.enabled })}
          className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${el.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${el.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Icon
            icon={el.type === 'qr' ? 'lucide:qr-code' : el.type === 'text' ? 'lucide:type' : isSpecial ? 'lucide:wand-2' : 'lucide:tag'}
            className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
          />
          <span className="text-sm font-medium text-gray-700 truncate">{el.label}</span>
        </div>
      </div>

      {el.enabled && el.type !== 'qr' && (
        <div className="flex items-center gap-3 mt-2 pl-10 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Size</span>
            <input type="number" min={8} max={48} value={el.fontSize}
              onChange={e => onChange({ ...el, fontSize: Number(e.target.value) })}
              className="w-12 text-xs border border-gray-200 rounded px-1 py-0.5 text-center" />
            <span className="text-xs text-gray-400">px</span>
          </div>

          <button
            onClick={() => onChange({ ...el, bold: !el.bold })}
            className={`text-xs px-2 py-0.5 rounded border font-bold transition-colors ${el.bold ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
          >B</button>

          <div className="flex border border-gray-200 rounded overflow-hidden">
            {(['left', 'center', 'right'] as const).map(a => (
              <button key={a} onClick={() => onChange({ ...el, align: a })}
                className={`px-1.5 py-0.5 transition-colors ${el.align === a ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                <Icon icon={`lucide:align-${a}`} className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {el.enabled && el.type === 'text' && (
        <div className="pl-10 mt-1.5">
          <input type="text" value={el.content || ''}
            onChange={e => onChange({ ...el, content: e.target.value })}
            placeholder="Nội dung văn bản..."
            className="w-full text-xs border border-gray-200 rounded px-2 py-1" />
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface BadgeConfigModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  initialConfig?: BadgeConfig | null;
  onSaved?: (config: BadgeConfig) => void;
}

export function BadgeConfigModal({ open, onClose, eventId, initialConfig, onSaved }: BadgeConfigModalProps) {
  const [config, setConfig] = useState<BadgeConfig>(initialConfig || DEFAULT_BADGE_CONFIG);
  const [saving, setSaving] = useState(false);

  // Load registration form for this event
  const { data: forms } = useFormsByEvent(eventId);
  const registrationForm = useMemo(
    () => (forms ?? []).find((f: any) => f.is_registration) ?? (forms ?? [])[0] ?? null,
    [forms]
  );
  const { data: formData } = useForm(registrationForm?.id ?? '');
  const formFields: FormField[] = useMemo(() => (formData as any)?.fields ?? [], [formData]);

  // Single effect: reset on open + merge form fields whenever either changes
  useEffect(() => {
    if (!open) return;
    const base = initialConfig || DEFAULT_BADGE_CONFIG;
    if (formFields.length > 0) {
      setConfig({ ...base, elements: buildElementsFromFormFields(formFields, base.elements) });
    } else {
      setConfig(base);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, formFields]);

  const updateSize = useCallback((key: BadgeSizeKey) => {
    const s = BADGE_SIZES[key];
    setConfig(prev => ({
      ...prev,
      size: key,
      widthMm: key === 'custom' ? prev.widthMm : s.width,
      heightMm: key === 'custom' ? prev.heightMm : s.height,
    }));
  }, []);

  const updateElement = useCallback((updated: BadgeElement) => {
    setConfig(prev => ({ ...prev, elements: prev.elements.map(el => el.id === updated.id ? updated : el) }));
  }, []);

  const moveElement = useCallback((from: number, to: number) => {
    setConfig(prev => {
      const els = [...prev.elements];
      const [item] = els.splice(from, 1);
      els.splice(to, 0, item);
      return { ...prev, elements: els };
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await eventsApi.updateEvent(eventId, { badge_config: config } as any);
      if (!res.success) throw new Error(res.error || 'Failed');
      toast.success('Đã lưu cấu hình badge');
      onSaved?.(config);
      onClose();
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Split elements for display: special (parsed) vs form fields
  const parsedIds = new Set(PARSED_FIELDS.map(p => p.id));
  const specialEls = config.elements.filter(e => parsedIds.has(e.id));
  const formEls = config.elements.filter(e => !parsedIds.has(e.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:credit-card" className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Cấu hình Badge</h2>
              <p className="text-xs text-gray-500">
                {registrationForm ? `Form: ${(registrationForm as any).id?.slice(0, 8)}…` : 'Thiết lập nội dung và khổ in badge'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Icon icon="lucide:x" className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left */}
            <div className="flex-1 space-y-5 min-w-0">

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Khổ badge</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(Object.keys(BADGE_SIZES) as BadgeSizeKey[]).map(key => (
                    <label key={key} className={`flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-colors ${config.size === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="badge_size" value={key} checked={config.size === key}
                        onChange={() => updateSize(key)} className="accent-blue-600" />
                      <span className="text-sm text-gray-700 flex-1">{BADGE_SIZES[key].label}</span>
                      {key !== 'custom' && (
                        <div className="bg-gray-200 border border-gray-300 rounded flex-shrink-0"
                          style={{ width: Math.round(BADGE_SIZES[key].width / 6), height: Math.round(BADGE_SIZES[key].height / 6), minWidth: 8, minHeight: 8 }} />
                      )}
                    </label>
                  ))}
                </div>
                {config.size === 'custom' && (
                  <div className="flex gap-3 mt-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Chiều rộng (mm)</label>
                      <input type="number" min={20} max={500} value={config.widthMm}
                        onChange={e => setConfig(p => ({ ...p, widthMm: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Chiều cao (mm)</label>
                      <input type="number" min={20} max={500} value={config.heightMm}
                        onChange={e => setConfig(p => ({ ...p, heightMm: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Elements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung badge</label>

                {/* Parsed / special fields */}
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <Icon icon="lucide:wand-2" className="w-3 h-3" /> Trường tự nhận diện
                </p>
                <div className="space-y-1.5 mb-3">
                  {specialEls.map((el, i) => (
                    <ElementRow key={el.id} el={el} index={config.elements.indexOf(el)} total={config.elements.length}
                      onChange={updateElement} onMove={moveElement} />
                  ))}
                </div>

                {/* Form fields */}
                {formEls.length > 0 && (
                  <>
                    <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                      <Icon icon="lucide:list" className="w-3 h-3" /> Trường từ form đăng ký
                    </p>
                    <div className="space-y-1.5">
                      {formEls.map((el) => (
                        <ElementRow key={el.id} el={el} index={config.elements.indexOf(el)} total={config.elements.length}
                          onChange={updateElement} onMove={moveElement} />
                      ))}
                    </div>
                  </>
                )}

                {formEls.length === 0 && formFields.length === 0 && registrationForm && (
                  <div className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-lg">
                    Đang tải form fields...
                  </div>
                )}
              </div>
            </div>

            {/* Right: Preview */}
            <div className="lg:w-56 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div className="sticky top-0">
                <BadgePreview config={config} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <><Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : <><Icon icon="lucide:save" className="w-4 h-4 mr-2" />Lưu cấu hình</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
