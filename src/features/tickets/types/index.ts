export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SenderType = 'exhibitor' | 'support';

export interface TicketReply {
  id: string;
  date_created?: string;
  user_created?: string | { id: string; first_name?: string; last_name?: string; email?: string };
  ticket_id?: string;
  message: string;
  sender_type: SenderType;
}

export interface SupportTicket {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  date_created?: string;
  date_updated?: string;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[]; logo?: { id: string } | string | null };
  event_id?: number;
  subject: string;
  message?: string;
  replies?: TicketReply[];
}

export interface SupportTicketWithDetails extends SupportTicket {
  exhibitor_id: {
    id: string;
    translations?: { languages_code?: string; company_name?: string }[];
    logo?: { id: string } | string | null;
  };
  replies: TicketReply[];
}

export interface TicketListOptions {
  page?: number;
  limit?: number;
  status?: TicketStatus | '';
  sort?: string;
  search?: string;
}

export interface TicketListResponse {
  tickets: SupportTicketWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}
