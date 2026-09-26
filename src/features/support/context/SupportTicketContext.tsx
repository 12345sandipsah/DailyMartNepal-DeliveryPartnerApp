import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {ReactNode} from 'react';

export type TicketStatus =
  | 'OPEN'
  | 'IN PROGRESS'
  | 'RESOLVED';

export type TicketPriority =
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export type TicketCategory =
  | 'Delivery'
  | 'Payment'
  | 'Customer'
  | 'Vehicle'
  | 'Warehouse'
  | 'Account'
  | 'Other';

export type SupportTicket = {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  orderReference?: string;
  createdAt: string;
  updatedAt: string;
  latestResponse: string;
};

export type CreateSupportTicketInput = {
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  orderReference?: string;
};

type SupportTicketContextValue = {
  tickets: SupportTicket[];
  addTicket: (
    input: CreateSupportTicketInput,
  ) => SupportTicket;
  getTicketById: (
    ticketId: string,
  ) => SupportTicket | undefined;
};

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'SUP-1001',
    subject: 'Unable to contact customer',
    category: 'Delivery',
    priority: 'HIGH',
    status: 'IN PROGRESS',
    description:
      'The customer is not answering calls and I am unable to complete the delivery. I have already tried calling the customer several times.',
    orderReference: 'DM12345',
    createdAt: 'Today, 9:45 AM',
    updatedAt: 'Today, 10:35 AM',
    latestResponse:
      'Our support team is reviewing the delivery issue and will guide you shortly.',
  },
  {
    id: 'SUP-1000',
    subject: 'Payment collection clarification',
    category: 'Payment',
    priority: 'NORMAL',
    status: 'RESOLVED',
    description:
      'I needed clarification about the cash collection amount for the delivery.',
    orderReference: 'DM12340',
    createdAt: 'Yesterday, 3:40 PM',
    updatedAt: 'Yesterday, 4:20 PM',
    latestResponse:
      'The payment amount has been verified and the issue has been resolved.',
  },
  {
    id: 'SUP-0998',
    subject: 'Warehouse pickup delay',
    category: 'Warehouse',
    priority: 'URGENT',
    status: 'OPEN',
    description:
      'The parcel was not ready when I arrived at the warehouse for pickup.',
    orderReference: 'DM12337',
    createdAt: 'Yesterday, 10:30 AM',
    updatedAt: 'Yesterday, 11:15 AM',
    latestResponse:
      'Your ticket is waiting for a support team response.',
  },
  {
    id: 'SUP-0997',
    subject: 'Vehicle issue during delivery',
    category: 'Vehicle',
    priority: 'HIGH',
    status: 'RESOLVED',
    description:
      'The delivery vehicle had a minor issue during the delivery route.',
    createdAt: '2 days ago, 2:10 PM',
    updatedAt: '2 days ago, 3:00 PM',
    latestResponse:
      'The vehicle issue was recorded and the ticket has been resolved.',
  },
];

const SupportTicketContext =
  createContext<SupportTicketContextValue | undefined>(
    undefined,
  );

const formatCurrentDateTime = (): string => {
  const now = new Date();

  const hours = now.getHours();

  const minutes = now
    .getMinutes()
    .toString()
    .padStart(2, '0');

  const period = hours >= 12 ? 'PM' : 'AM';

  const displayHour =
    hours % 12 === 0 ? 12 : hours % 12;

  return `Today, ${displayHour}:${minutes} ${period}`;
};

const generateTicketId = (
  existingTickets: SupportTicket[],
): string => {
  const numericIds = existingTickets
    .map(ticket =>
      Number(ticket.id.replace('SUP-', '')),
    )
    .filter(number => !Number.isNaN(number));

  const highestId =
    numericIds.length > 0
      ? Math.max(...numericIds)
      : 999;

  return `SUP-${highestId + 1}`;
};

type SupportTicketProviderProps = {
  children: ReactNode;
};

export const SupportTicketProvider = ({
  children,
}: SupportTicketProviderProps) => {
  const [tickets, setTickets] =
    useState<SupportTicket[]>(INITIAL_TICKETS);

  const addTicket = useCallback(
    (input: CreateSupportTicketInput): SupportTicket => {
      const now = formatCurrentDateTime();

      let createdTicket: SupportTicket;

      setTickets(currentTickets => {
        const newTicket: SupportTicket = {
          id: generateTicketId(currentTickets),
          subject: input.subject.trim(),
          category: input.category,
          priority: input.priority,
          status: 'OPEN',
          description: input.description.trim(),
          orderReference:
            input.orderReference?.trim() || undefined,
          createdAt: now,
          updatedAt: now,
          latestResponse:
            'Your support request has been received and is waiting for review.',
        };

        createdTicket = newTicket;

        return [newTicket, ...currentTickets];
      });

      return createdTicket!;
    },
    [],
  );

  const getTicketById = useCallback(
    (ticketId: string) => {
      return tickets.find(
        ticket => ticket.id === ticketId,
      );
    },
    [tickets],
  );

  const value = useMemo<SupportTicketContextValue>(
    () => ({
      tickets,
      addTicket,
      getTicketById,
    }),
    [tickets, addTicket, getTicketById],
  );

  return (
    <SupportTicketContext.Provider value={value}>
      {children}
    </SupportTicketContext.Provider>
  );
};

export const useSupportTickets = (): SupportTicketContextValue => {
  const context = useContext(SupportTicketContext);

  if (!context) {
    throw new Error(
      'useSupportTickets must be used inside SupportTicketProvider.',
    );
  }

  return context;
};