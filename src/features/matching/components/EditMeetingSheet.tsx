'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import directus from '@/lib/directus';
import { updateItem } from '@directus/sdk';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button-base';
import { slotApi } from '../api/slotApi';
import type { Meeting, MeetingStatus, MeetingSlot, MeetingSlotConfig } from '../types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: MeetingStatus; label: string; cls: string }[] = [
  { value: 'pending',   label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'confirmed', label: 'Confirmed', cls: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'scheduled', label: 'Scheduled', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'completed', label: 'Completed', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'cancelled', label: 'Cancelled', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  { value: 'rejected',  label: 'Rejected',  cls: 'bg-red-100 text-red-600 border-red-200' },
  { value: 'no_show',   label: 'No Show',   cls: 'bg-orange-100 text-orange-600 border-orange-200' },
];

const MEETING_TYPE_OPTIONS = [
  { value: 'physical', label: 'Trực tiếp (Physical)' },
  { value: 'virtual',  label: 'Online (Virtual)' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtSlot(slot: MeetingSlot, showCount = false): string {
  const d = new Date(slot.start_at);
  const date = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const t1 = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const t2 = new Date(slot.end_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const loc = slot.location ? ` · ${slot.location}` : '';
  const lbl = slot.label ? ` (${slot.label})` : '';
  const cnt = showCount && slot.meeting_count != null ? ` [${slot.meeting_count} meetings]` : '';
  return `${date} · ${t1}–${t2}${loc}${lbl}${cnt}`;
}

function getRegistrationName(reg: Meeting['registration_id']): string {
  if (!reg || typeof reg === 'string') return '—';
  return reg.full_name || reg.email || '—';
}

function getExhibitorName(ex: Meeting['exhibitor_id']): string {
  if (!ex || typeof ex === 'string') return '—';
  const t = ex.translations?.find(t => t.languages_code === 'vi-VN') || ex.translations?.[0];
  return t?.company_name || '—';
}

// ─── Field Row ─────────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-content-secondary block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white';

// ─── Main Component ─────────────────────────────────────────────────────────────

interface EditMeetingSheetProps {
  meeting: Meeting | null;
  eventId: number;
  open: boolean;
  onClose: () => void;
}

export function EditMeetingSheet({ meeting, eventId, open, onClose }: EditMeetingSheetProps) {
  const queryClient = useQueryClient();

  // Form state
  const [status, setStatus] = useState<MeetingStatus>('pending');
  const [slotMode, setSlotMode] = useState<'slot' | 'flexible'>('flexible');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [meetingType, setMeetingType] = useState<'physical' | 'virtual'>('physical');
  const [durationMin, setDurationMin] = useState<string>('');
  const [organizerNote, setOrganizerNote] = useState('');

  // Sync form with meeting data when sheet opens
  useEffect(() => {
    if (!meeting) return;
    setStatus(meeting.status as MeetingStatus);
    setLocation(meeting.location || '');
    setMeetingType((meeting.meeting_type as 'physical' | 'virtual') || 'physical');
    setDurationMin(meeting.duration_minutes ? String(meeting.duration_minutes) : '');
    setOrganizerNote(meeting.organizer_note || '');
    if (meeting.slot_id) {
      setSlotMode('slot');
      setSelectedSlotId(typeof meeting.slot_id === 'string' ? meeting.slot_id : meeting.slot_id.id);
    } else {
      setSlotMode('flexible');
      setSelectedSlotId('');
      setScheduledAt(
        meeting.scheduled_at
          ? new Date(meeting.scheduled_at).toISOString().slice(0, 16)
          : ''
      );
    }
  }, [meeting, open]);

  // Fetch slot config to know mode
  const { data: slotConfig } = useQuery<MeetingSlotConfig | null>({
    queryKey: ['slot-config', eventId],
    queryFn: () => slotApi.getConfig(eventId),
    enabled: open,
  });

  // Fetch available slots (only available — disabled slots are not bookable)
  const { data: slots = [] } = useQuery<MeetingSlot[]>({
    queryKey: ['meeting-slots-all', eventId],
    queryFn: () => slotApi.getSlots(eventId),
    enabled: open,
    select: (data) => data.filter(s => s.status === 'available'),
  });

  const currentSlot = slots.find(s => s.id === selectedSlotId) ?? null;
  const currentSlotIdOnMeeting = meeting?.slot_id
    ? (typeof meeting.slot_id === 'string' ? meeting.slot_id : meeting.slot_id.id)
    : null;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!meeting) return;

      const newSlotId = slotMode === 'slot' ? selectedSlotId || null : null;

      // Build meeting payload
      const payload: Partial<Meeting> = {
        status,
        location: location || undefined,
        meeting_type: meetingType,
        duration_minutes: durationMin ? parseInt(durationMin) : undefined,
        organizer_note: organizerNote || undefined,
        slot_id: newSlotId as any,
      };

      // If assigning a slot, sync scheduled_at and location from slot
      if (newSlotId && currentSlot) {
        payload.scheduled_at = currentSlot.start_at;
        if (!location && currentSlot.location) {
          payload.location = currentSlot.location;
        }
      } else if (slotMode === 'flexible') {
        payload.scheduled_at = scheduledAt ? new Date(scheduledAt).toISOString() : null as any;
      }

      await directus.request(updateItem('meetings' as any, meeting.id, payload));
    },
    onSuccess: () => {
      toast.success('Đã cập nhật meeting');
      queryClient.invalidateQueries({ queryKey: ['meetings', eventId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-slots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-slots-all', eventId] });
      onClose();
    },
    onError: () => toast.error('Lưu thất bại'),
  });

  if (!meeting) return null;

  const isBooked = !!currentSlotIdOnMeeting;
  const hasSlotConfig = slotConfig?.mode === 'slot';

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <SheetTitle className="text-base font-bold text-content-primary">
            Chỉnh sửa Meeting
          </SheetTitle>
          <p className="text-xs text-content-tertiary mt-0.5">
            {getRegistrationName(meeting.registration_id)} ↔ {getExhibitorName(meeting.exhibitor_id)}
          </p>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">

          {/* Current slot badge */}
          {isBooked && typeof meeting.slot_id === 'object' && meeting.slot_id && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
              <Icon icon="lucide:calendar-clock" className="w-4 h-4 flex-shrink-0" />
              <span>Đang gắn slot: <strong>{fmtSlot(meeting.slot_id as MeetingSlot)}</strong></span>
            </div>
          )}

          {/* Status */}
          <FieldRow label="Trạng thái">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${status === opt.value ? opt.cls : 'border-slate-200 text-content-secondary hover:border-slate-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldRow>

          {/* Timeslot or Flexible */}
          <FieldRow label="Lịch hẹn">
            <div className="flex gap-2 mb-3">
              {hasSlotConfig && (
                <button onClick={() => setSlotMode('slot')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${slotMode === 'slot' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-200 text-content-secondary'}`}>
                  <Icon icon="lucide:layout-grid" className="w-3.5 h-3.5" /> Gắn Timeslot
                </button>
              )}
              <button onClick={() => setSlotMode('flexible')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${slotMode === 'flexible' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-200 text-content-secondary'}`}>
                <Icon icon="lucide:calendar" className="w-3.5 h-3.5" /> Nhập tự do
              </button>
            </div>

            {slotMode === 'slot' ? (
              <div className="space-y-2">
                <select value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)}
                  className={inputCls}>
                  <option value="">— Chọn timeslot —</option>
                  {slots.map(s => (
                    <option key={s.id} value={s.id}>{fmtSlot(s, true)}</option>
                  ))}
                </select>
                {slots.length === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Icon icon="lucide:info" className="w-3.5 h-3.5" />
                    Không có slot trống. Tạo thêm ở trang Timeslots.
                  </p>
                )}
                {selectedSlotId && currentSlot && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-content-tertiary">
                      Sẽ tự điền: <span className="font-medium">{new Date(currentSlot.start_at).toLocaleString('vi-VN')}</span>
                      {currentSlot.location && <> · {currentSlot.location}</>}
                    </p>
                    <button onClick={() => setSelectedSlotId('')} className="text-xs text-red-500 hover:underline">Bỏ slot</button>
                  </div>
                )}
              </div>
            ) : (
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className={inputCls} />
            )}
          </FieldRow>

          {/* Location */}
          <FieldRow label="Địa điểm">
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder={currentSlot?.location || 'Phòng, booth, link...'}
              className={inputCls} />
          </FieldRow>

          {/* Meeting type + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Hình thức">
              <select value={meetingType} onChange={e => setMeetingType(e.target.value as any)}
                className={inputCls}>
                {MEETING_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Thời lượng (phút)">
              <input type="number" min={5} max={480} step={5} value={durationMin}
                onChange={e => setDurationMin(e.target.value)}
                placeholder="—"
                className={inputCls} />
            </FieldRow>
          </div>

          {/* Organizer note */}
          <FieldRow label="Ghi chú nội bộ (Organizer)">
            <textarea value={organizerNote} onChange={e => setOrganizerNote(e.target.value)}
              rows={3} placeholder="Ghi chú cho ban tổ chức..."
              className={`${inputCls} resize-none`} />
          </FieldRow>

          {/* Exhibitor note (readonly) */}
          {meeting.exhibitor_note && (
            <FieldRow label="Ghi chú từ Exhibitor (readonly)">
              <p className="text-sm text-content-secondary bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {meeting.exhibitor_note}
              </p>
            </FieldRow>
          )}

          {/* Visitor note (readonly) */}
          {meeting.visitor_note && (
            <FieldRow label="Ghi chú từ Visitor (readonly)">
              <p className="text-sm text-content-secondary bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {meeting.visitor_note}
              </p>
            </FieldRow>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-5 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-sm text-content-secondary hover:text-content-primary">Huỷ</button>
          <Button variant="gradient" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending
              ? <><Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin mr-1.5" />Đang lưu...</>
              : <><Icon icon="lucide:save" className="w-3.5 h-3.5 mr-1.5" />Lưu thay đổi</>
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
