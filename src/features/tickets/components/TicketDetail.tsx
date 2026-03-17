'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useTicket, useUpdateTicket, useAddReply } from '../hooks/useTickets';
import type { TicketStatus, TicketPriority } from '../types';

const STATUS_MAP: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', cls: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', cls: 'bg-gray-100 text-gray-500' },
};

const PRIORITY_MAP: Record<TicketPriority, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'text-gray-400' },
  medium: { label: 'Medium', cls: 'text-blue-500' },
  high: { label: 'High', cls: 'text-orange-500' },
  urgent: { label: 'Urgent', cls: 'text-red-600' },
};

function formatDateTime(dt?: string) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function getExhibitorName(exhibitor: { translations?: { languages_code?: string; company_name?: string }[] } | undefined): string {
  if (!exhibitor) return 'Unknown';
  const translations = exhibitor.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  return en?.company_name || translations[0]?.company_name || 'Unknown';
}

export function TicketDetail() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const ticketId = params.ticketId as string;

  const { data: ticket, isLoading, error, refetch } = useTicket(ticketId);
  const updateMutation = useUpdateTicket();
  const addReplyMutation = useAddReply();

  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies?.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Icon icon="lucide:alert-circle" className="w-10 h-10 text-red-400 mb-3" />
        <p className="font-medium">Ticket not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/events/${eventId}/tickets`)}>
          <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5 mr-1.5" />Back
        </Button>
      </div>
    );
  }

  const { label: sLabel, cls: sCls } = STATUS_MAP[ticket.status] ?? { label: ticket.status, cls: '' };
  const { label: pLabel, cls: pCls } = PRIORITY_MAP[ticket.priority] ?? { label: ticket.priority, cls: '' };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    await updateMutation.mutateAsync({ id: ticket.id, payload: { status: newStatus } });
    await refetch();
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await addReplyMutation.mutateAsync({ ticketId: ticket.id, message: replyText.trim() });
      setReplyText('');
      await refetch();
    } finally {
      setSending(false);
    }
  };

  const replies = [...(ticket.replies ?? [])].sort((a, b) =>
    new Date(a.date_created ?? 0).getTime() - new Date(b.date_created ?? 0).getTime()
  );

  return (
    <div className="space-y-4">
      <ContainerHeader className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push(`/events/${eventId}/tickets`)} className="p-1.5 hover:bg-slate-100 rounded-lg mt-0.5">
            <Icon icon="lucide:arrow-left" className="w-4 h-4 text-content-secondary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-content-primary">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sCls}`}>{sLabel}</span>
              <span className={`text-xs font-semibold ${pCls}`}>{pLabel}</span>
              <span className="text-xs text-content-tertiary">· {getExhibitorName(ticket.exhibitor_id)}</span>
              <span className="text-xs text-content-tertiary">· {formatDateTime(ticket.date_created)}</span>
            </div>
          </div>
        </div>
        {/* Status selector */}
        <div className="flex items-center gap-2 shrink-0">
          {updateMutation.isPending && (
            <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-blue-600" />
          )}
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            disabled={updateMutation.isPending}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition disabled:opacity-60 cursor-pointer"
          >
            {(Object.entries(STATUS_MAP) as [TicketStatus, { label: string; cls: string }][]).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </ContainerHeader>

      <Container className="space-y-4">
        {/* Original message */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon icon="lucide:building-2" className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-content-primary">{getExhibitorName(ticket.exhibitor_id)}</span>
            <span className="text-xs text-content-tertiary ml-auto">{formatDateTime(ticket.date_created)}</span>
          </div>
          <p className="text-sm text-content-primary whitespace-pre-wrap">{ticket.message || '(no message)'}</p>
        </div>

        {/* Replies thread */}
        {replies.length > 0 && (
          <div className="space-y-3">
            {replies.map((reply) => {
              const isSupport = reply.sender_type === 'support';
              return (
                <div
                  key={reply.id}
                  className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    isSupport
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-content-primary border border-slate-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                    <p className={`text-xs mt-1 ${isSupport ? 'text-blue-200' : 'text-content-tertiary'}`}>
                      {isSupport ? 'Support' : 'Exhibitor'} · {formatDateTime(reply.date_created)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={repliesEndRef} />
          </div>
        )}

        {/* Reply input */}
        {ticket.status !== 'closed' && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">Reply</p>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              rows={4}
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply();
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-content-tertiary">⌘ + Enter to send</span>
              <Button size="sm" variant="gradient" onClick={handleSendReply} disabled={!replyText.trim() || sending}>
                {sending
                  ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                  : <><Icon icon="lucide:send" className="w-3.5 h-3.5 mr-1.5" />Send Reply</>
                }
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
