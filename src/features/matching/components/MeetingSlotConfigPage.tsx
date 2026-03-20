'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { toast } from 'sonner';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slotApi } from '../api/slotApi';
import type { MeetingSlot, MeetingSlotConfig } from '../types';

const STATUS_MAP = {
  available: { label: 'Available', cls: 'bg-green-100 text-green-700' },
  disabled:  { label: 'Disabled',  cls: 'bg-gray-100 text-gray-500' },
};

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function MeetingSlotConfigPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  const selection = useSelection();

  // Config form state
  const [mode, setMode] = useState<'flexible' | 'slot'>('flexible');
  const [category, setCategory] = useState<string>('all');
  const [duration, setDuration] = useState(30);
  const [breakMin, setBreakMin] = useState(0);
  const [maxExhibitor, setMaxExhibitor] = useState<string>('');
  const [maxVisitor, setMaxVisitor] = useState<string>('');
  const [configDirty, setConfigDirty] = useState(false);

  // Generate form state
  const [genDate, setGenDate] = useState('');
  const [genStart, setGenStart] = useState('08:00');
  const [genEnd, setGenEnd] = useState('17:00');
  const [genLocation, setGenLocation] = useState('');

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['slot-config', eventId],
    queryFn: () => slotApi.getConfig(eventId),
  });

  // Sync config into form state using useEffect
  useEffect(() => {
    if (config) {
      setMode(config.mode);
      setCategory(config.meeting_category ?? 'all');
      setDuration(config.slot_duration_minutes ?? 30);
      setBreakMin(config.break_minutes ?? 0);
      setMaxExhibitor(config.max_per_exhibitor != null ? String(config.max_per_exhibitor) : '');
      setMaxVisitor(config.max_per_visitor != null ? String(config.max_per_visitor) : '');
      setConfigDirty(false);
    }
  }, [config]);

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['meeting-slots', eventId],
    queryFn: () => slotApi.getSlots(eventId),
  });

  const configMutation = useMutation({
    mutationFn: () => slotApi.upsertConfig(eventId, {
      mode,
      meeting_category: (category || null) as MeetingSlotConfig['meeting_category'],
      slot_duration_minutes: mode === 'slot' ? duration : null,
      break_minutes: mode === 'slot' ? breakMin : null,
      max_per_exhibitor: maxExhibitor ? parseInt(maxExhibitor) : null,
      max_per_visitor: maxVisitor ? parseInt(maxVisitor) : null,
    }),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình');
      setConfigDirty(false);
      queryClient.invalidateQueries({ queryKey: ['slot-config', eventId] });
    },
    onError: () => toast.error('Lưu cấu hình thất bại'),
  });

  const previewSlots = useMemo(() => {
    if (!genDate || !genStart || !genEnd || mode !== 'slot') return [];
    return slotApi.generateSlotTimes(genDate, genStart, genEnd, duration, breakMin);
  }, [genDate, genStart, genEnd, duration, breakMin, mode]);

  const generateMutation = useMutation({
    mutationFn: () => {
      const times = slotApi.generateSlotTimes(genDate, genStart, genEnd, duration, breakMin);
      if (!times.length) throw new Error('No slots to generate');
      const configId = config?.id;
      return slotApi.createSlots(times.map(t => ({
        ...t,
        event_id: eventId,
        config_id: configId,
        location: genLocation || null,
        status: 'available' as const,
      })));
    },
    onSuccess: (created) => {
      toast.success(`Đã tạo ${created.length} timeslot`);
      queryClient.invalidateQueries({ queryKey: ['meeting-slots', eventId] });
    },
    onError: (err: any) => toast.error(err.message || 'Tạo slots thất bại'),
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'available' | 'disabled' }) =>
      slotApi.updateSlot(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting-slots', eventId] }),
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'disable' | 'enable' | 'delete' }) => {
      if (action === 'delete') {
        await slotApi.deleteSlots(ids);
        return { action, count: ids.length };
      }
      await slotApi.bulkUpdateSlots(ids, { status: action === 'disable' ? 'disabled' : 'available' });
      return { action, count: ids.length };
    },
    onSuccess: ({ action, count }) => {
      toast.success(`${count} slot đã ${action === 'delete' ? 'xóa' : action === 'disable' ? 'vô hiệu hóa' : 'kích hoạt'}`);
      selection.clear();
      queryClient.invalidateQueries({ queryKey: ['meeting-slots', eventId] });
    },
    onError: () => toast.error('Thao tác thất bại'),
  });

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, MeetingSlot[]>();
    for (const s of slots) {
      const day = s.start_at.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    }
    return map;
  }, [slots]);

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-content-primary">Cấu hình Timeslot Meeting</h1>
            <p className="text-content-tertiary mt-1 text-sm">Thiết lập chế độ lịch hẹn: linh hoạt hoặc phân chia timeslot cố định.</p>
          </div>
        </div>
      </ContainerHeader>

      {/* Config Section */}
      <Container>
        <h2 className="text-sm font-semibold text-content-primary mb-4">Chế độ lịch hẹn</h2>
        {configLoading ? (
          <div className="flex items-center gap-2 text-content-secondary py-4">
            <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-3">
              {(['flexible', 'slot'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setConfigDirty(true); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${mode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-content-secondary hover:border-slate-300'}`}>
                  <Icon icon={m === 'flexible' ? 'lucide:calendar' : 'lucide:layout-grid'} className="w-4 h-4" />
                  {m === 'flexible' ? 'Flexible (tự do)' : 'Slot-based (timeslot cố định)'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-medium text-content-secondary mb-1.5 block">Áp dụng cho</label>
                <select value={category} onChange={e => { setCategory(e.target.value); setConfigDirty(true); }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="all">Tất cả loại meeting</option>
                  <option value="business">Business Matching</option>
                  <option value="talent">Talent Matching</option>
                </select>
              </div>

              {/* Max per exhibitor */}
              <div>
                <label className="text-xs font-medium text-content-secondary mb-1.5 block">Giới hạn / Exhibitor</label>
                <input type="number" min={1} value={maxExhibitor} onChange={e => { setMaxExhibitor(e.target.value); setConfigDirty(true); }}
                  placeholder="Không giới hạn"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              {/* Max per visitor */}
              <div>
                <label className="text-xs font-medium text-content-secondary mb-1.5 block">Giới hạn / Visitor</label>
                <input type="number" min={1} value={maxVisitor} onChange={e => { setMaxVisitor(e.target.value); setConfigDirty(true); }}
                  placeholder="Không giới hạn"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              {/* Duration - only show when slot mode */}
              {mode === 'slot' && (
                <div>
                  <label className="text-xs font-medium text-content-secondary mb-1.5 block">Thời lượng mỗi slot (phút)</label>
                  <input type="number" min={5} max={480} step={5} value={duration} onChange={e => { setDuration(parseInt(e.target.value) || 30); setConfigDirty(true); }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
              )}

              {mode === 'slot' && (
                <div>
                  <label className="text-xs font-medium text-content-secondary mb-1.5 block">Thời gian nghỉ giữa slots (phút)</label>
                  <input type="number" min={0} max={60} step={5} value={breakMin} onChange={e => { setBreakMin(parseInt(e.target.value) || 0); setConfigDirty(true); }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
              )}
            </div>

            {configDirty && (
              <div className="flex justify-end">
                <Button size="sm" variant="gradient" onClick={() => configMutation.mutate()} disabled={configMutation.isPending}>
                  {configMutation.isPending ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Icon icon="lucide:save" className="w-3.5 h-3.5 mr-1.5" />}
                  Lưu cấu hình
                </Button>
              </div>
            )}
          </div>
        )}
      </Container>

      {/* Generate Slots Section - only when slot mode */}
      {mode === 'slot' && (
        <Container>
          <h2 className="text-sm font-semibold text-content-primary mb-4">Tạo Timeslots</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-content-secondary mb-1.5 block">Ngày</label>
              <input type="date" value={genDate} onChange={e => setGenDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-secondary mb-1.5 block">Địa điểm (tùy chọn)</label>
              <input type="text" value={genLocation} onChange={e => setGenLocation(e.target.value)}
                placeholder="VD: Sảnh A, Phòng 3..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-secondary mb-1.5 block">Giờ bắt đầu</label>
              <input type="time" value={genStart} onChange={e => setGenStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-secondary mb-1.5 block">Giờ kết thúc</label>
              <input type="time" value={genEnd} onChange={e => setGenEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
          </div>

          {genDate && previewSlots.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2 text-sm text-blue-700">
              <Icon icon="lucide:info" className="w-4 h-4 flex-shrink-0" />
              <span>Sẽ tạo <strong>{previewSlots.length} slot</strong> × {duration} phút
                {breakMin > 0 ? ` (nghỉ ${breakMin} phút giữa mỗi slot)` : ''}.
                Từ {genStart} đến {genEnd} ngày {new Date(genDate).toLocaleDateString('vi-VN')}.
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" variant="gradient"
              onClick={() => generateMutation.mutate()}
              disabled={!genDate || previewSlots.length === 0 || generateMutation.isPending || !config?.id}>
              {generateMutation.isPending ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />}
              Tạo {previewSlots.length > 0 ? previewSlots.length : ''} Slots
            </Button>
          </div>
          {!config?.id && (
            <p className="text-xs text-amber-600 mt-2">Lưu cấu hình trước khi tạo slots.</p>
          )}
        </Container>
      )}

      {/* Slots Table */}
      <Container>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-content-primary">
            Danh sách Timeslots
            {slots.length > 0 && <span className="ml-2 text-xs font-normal text-content-tertiary">({slots.length} slots)</span>}
          </h2>
          {slots.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-content-tertiary">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Active: {slots.filter(s => s.status === 'available').length}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />Disabled: {slots.filter(s => s.status === 'disabled').length}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Total meetings: {slots.reduce((sum, s) => sum + (s.meeting_count ?? 0), 0)}</span>
            </div>
          )}
        </div>

        {slotsLoading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span>Đang tải...</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Icon icon="lucide:calendar-off" className="w-8 h-8 text-content-tertiary mb-2" />
            <p className="text-content-secondary text-sm">{mode === 'flexible' ? 'Chế độ Flexible — không cần tạo timeslots.' : 'Chưa có timeslot nào. Dùng form phía trên để tạo.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(slotsByDate.entries()).map(([date, daySlots]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">
                  {formatDate(date + 'T00:00:00')}
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                        <th className="px-3 py-2.5 w-10">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                            checked={daySlots.length > 0 && daySlots.every(s => selection.selected.has(s.id))}
                            ref={el => { if (el) el.indeterminate = daySlots.some(s => selection.selected.has(s.id)) && !daySlots.every(s => selection.selected.has(s.id)); }}
                            onChange={() => selection.toggleAll(daySlots.map(s => s.id))} />
                        </th>
                        <th className="text-left px-3 py-2.5 font-semibold text-content-secondary">Giờ</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-content-secondary">Địa điểm</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-content-secondary">Trạng thái</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-content-secondary">Meetings</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {daySlots.map(slot => {
                        const statusCfg = STATUS_MAP[slot.status] ?? STATUS_MAP.available;
                        const meetingCount = slot.meeting_count ?? 0;
                        return (
                          <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2.5">
                              <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                                checked={selection.selected.has(slot.id)}
                                onChange={() => selection.toggle(slot.id)} />
                            </td>
                            <td className="px-3 py-2.5 font-medium text-content-primary">
                              {formatTime(slot.start_at)} – {formatTime(slot.end_at)}
                              {slot.label && <span className="ml-1.5 text-xs text-content-tertiary">({slot.label})</span>}
                            </td>
                            <td className="px-3 py-2.5 text-content-secondary">{slot.location || '—'}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {meetingCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium">
                                  <Icon icon="lucide:calendar-check" className="w-3.5 h-3.5" />
                                  {meetingCount}
                                </span>
                              ) : (
                                <span className="text-xs text-content-tertiary">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => updateSlotMutation.mutate({ id: slot.id, status: slot.status === 'disabled' ? 'available' : 'disabled' })}
                                disabled={updateSlotMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-content-tertiary"
                                title={slot.status === 'disabled' ? 'Kích hoạt lại' : 'Vô hiệu hóa'}>
                                <Icon icon={slot.status === 'disabled' ? 'lucide:eye' : 'lucide:eye-off'} className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      <BulkActionBar
        count={selection.count}
        onClear={selection.clear}
        actions={[
          {
            label: 'Vô hiệu hóa',
            icon: 'lucide:eye-off',
            loading: bulkMutation.isPending,
            onClick: () => bulkMutation.mutate({ ids: selection.selectedArray, action: 'disable' }),
          },
          {
            label: 'Kích hoạt',
            icon: 'lucide:eye',
            loading: bulkMutation.isPending,
            onClick: () => bulkMutation.mutate({ ids: selection.selectedArray, action: 'enable' }),
          },
          {
            label: 'Xóa',
            icon: 'lucide:trash-2',
            variant: 'danger' as const,
            loading: bulkMutation.isPending,
            onClick: () => bulkMutation.mutate({ ids: selection.selectedArray, action: 'delete' }),
          },
        ]}
      />
    </div>
  );
}
