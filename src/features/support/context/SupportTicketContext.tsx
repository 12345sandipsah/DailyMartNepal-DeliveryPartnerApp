import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {
  createPartnerSupportTicket,
  getPartnerSupportTicket,
  getPartnerSupportTickets,
  replyToPartnerSupportTicket,
} from '../../../shared/services/api';
import type {PartnerSupportTicket} from '../../../shared/services/api';

export type TicketStatus = 'OPEN' | 'IN PROGRESS' | 'WAITING FOR CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketCategory =
  | 'Delivery' | 'Payment' | 'Customer' | 'Vehicle' | 'Warehouse' | 'Account' | 'Other'
  | 'Orders' | 'Payments' | 'Customers' | 'Refunds' | 'Product Quality' | 'Missing or Incorrect Items'
  | 'Cancellation' | 'Offers & Coupons' | 'App & Technical' | 'Safety / Emergency' | 'Feedback';

export type SupportTicketMessage = {
  id: string;
  authorType: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  backendId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  orderReference?: string;
  emergencyLocation?: {latitude: number; longitude: number; capturedAt?: string} | null;
  createdAt: string;
  updatedAt: string;
  latestResponse: string;
  resolution: string;
  messages: SupportTicketMessage[];
};

export type CreateSupportTicketInput = {
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  orderReference?: string;
  isEmergency?: boolean;
};

type SupportTicketContextValue = {
  tickets: SupportTicket[];
  isLoaded: boolean;
  refreshTickets: () => Promise<void>;
  refreshTicket: (ticketId: string) => Promise<SupportTicket>;
  addTicket: (input: CreateSupportTicketInput) => Promise<SupportTicket>;
  replyToTicket: (ticketId: string, message: string) => Promise<SupportTicket>;
  getTicketById: (ticketId: string) => SupportTicket | undefined;
};

const SupportTicketContext = createContext<SupportTicketContextValue | undefined>(undefined);
const dateLabel = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString('en-NP', {day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'});
};
const normalizeStatus = (status: PartnerSupportTicket['status']): TicketStatus => {
  if (status === 'In Progress') return 'IN PROGRESS';
  if (status === 'Waiting for Customer') return 'WAITING FOR CUSTOMER';
  return status.toUpperCase() as TicketStatus;
};
const normalizePriority = (priority: PartnerSupportTicket['priority']): TicketPriority => {
  if (priority === 'Medium') return 'NORMAL';
  return priority.toUpperCase() as TicketPriority;
};
const toTicket = (ticket: PartnerSupportTicket): SupportTicket => {
  const latest = ticket.messages?.[ticket.messages.length - 1];
  return {
    id: ticket.reference,
    backendId: ticket.id,
    subject: ticket.subject,
    category: ticket.category as TicketCategory,
    priority: normalizePriority(ticket.priority),
    status: normalizeStatus(ticket.status),
    description: ticket.description,
    orderReference: ticket.order?.reference || undefined,
    emergencyLocation: ticket.emergencyLocation || null,
    createdAt: dateLabel(ticket.createdAt),
    updatedAt: dateLabel(ticket.updatedAt),
    latestResponse: latest?.body || ticket.resolution || ticket.description,
    resolution: ticket.resolution || '',
    messages: ticket.messages || [],
  };
};
const toBackendPriority = (priority: TicketPriority): 'Low' | 'Medium' | 'High' | 'Urgent' => {
  switch (priority) {
    case 'LOW': return 'Low';
    case 'HIGH': return 'High';
    case 'URGENT': return 'Urgent';
    case 'NORMAL': return 'Medium';
  }
};

type SupportTicketProviderProps = {children: ReactNode};

export const SupportTicketProvider = ({children}: SupportTicketProviderProps) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const ticketListRequestRef = useRef(0);

  const refreshTickets = useCallback(async () => {
    const requestId = ++ticketListRequestRef.current;
    try {
      const records = await getPartnerSupportTickets();
      if (requestId === ticketListRequestRef.current) setTickets(records.map(toTicket));
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const refreshTicket = useCallback(async (ticketId: string): Promise<SupportTicket> => {
    const record = await getPartnerSupportTicket(ticketId);
    const updated = toTicket(record);
    ticketListRequestRef.current += 1;
    setTickets(current => [updated, ...current.filter(ticket => ticket.id !== updated.id)]);
    return updated;
  }, []);

  useEffect(() => {
    let active = true;
    const requestId = ++ticketListRequestRef.current;
    getPartnerSupportTickets()
      .then(records => {
        if (active && requestId === ticketListRequestRef.current) setTickets(records.map(toTicket));
      })
      .catch(error => { console.warn('Support ticket load failed:', error); })
      .finally(() => { if (active) setIsLoaded(true); });
    return () => { active = false; };
  }, []);

  const addTicket = useCallback(async (input: CreateSupportTicketInput): Promise<SupportTicket> => {
    const subject = input.subject.trim();
    const description = input.description.trim();
    if (subject.length < 5) throw new Error('The ticket subject must contain at least 5 characters.');
    if (description.length < 10) throw new Error('The ticket description must contain at least 10 characters.');
    const created = await createPartnerSupportTicket({
      category: input.category,
      priority: toBackendPriority(input.priority),
      subject,
      description,
      orderReference: input.orderReference?.trim() || undefined,
      isEmergency: input.isEmergency,
    });
    const next = toTicket(created);
    ticketListRequestRef.current += 1;
    setTickets(current => [next, ...current.filter(ticket => ticket.id !== next.id)]);
    return next;
  }, []);

  const replyToTicket = useCallback(async (ticketId: string, message: string): Promise<SupportTicket> => {
    const created = await replyToPartnerSupportTicket(ticketId, message.trim());
    const next = toTicket(created);
    ticketListRequestRef.current += 1;
    setTickets(current => [next, ...current.filter(ticket => ticket.id !== next.id)]);
    return next;
  }, []);

  const getTicketById = useCallback((ticketId: string) =>
    tickets.find(ticket => ticket.id === ticketId || ticket.backendId === ticketId), [tickets]);

  const value = useMemo<SupportTicketContextValue>(
    () => ({tickets, isLoaded, refreshTickets, refreshTicket, addTicket, replyToTicket, getTicketById}),
    [tickets, isLoaded, refreshTickets, refreshTicket, addTicket, replyToTicket, getTicketById],
  );

  return <SupportTicketContext.Provider value={value}>{children}</SupportTicketContext.Provider>;
};

export const useSupportTickets = (): SupportTicketContextValue => {
  const context = useContext(SupportTicketContext);
  if (!context) throw new Error('useSupportTickets must be used inside SupportTicketProvider.');
  return context;
};
