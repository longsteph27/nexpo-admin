export type OrderStatus = 'draft' | 'submitted' | 'confirmed' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id?: string;
  facility_id?: string | { id: string; name?: string; dimension?: string; price?: number; image?: { id: string } | string | null };
  quantity: number;
  unit_price?: number;
  done?: boolean;
}

export interface FacilityOrder {
  id: string;
  status: OrderStatus;
  date_created?: string;
  date_updated?: string;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[]; logo?: { id: string } | string | null };
  event_id?: number;
  ref_number?: string;
  total_amount?: number;
  notes?: string;
  items?: OrderItem[];
}

export interface FacilityOrderWithDetails extends FacilityOrder {
  exhibitor_id: {
    id: string;
    translations?: { languages_code?: string; company_name?: string }[];
    logo?: { id: string } | string | null;
  };
  items: OrderItem[];
}

export interface OrderListOptions {
  page?: number;
  limit?: number;
  status?: OrderStatus | '';
  sort?: string;
  search?: string;
}

export interface OrderListResponse {
  orders: FacilityOrderWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}
