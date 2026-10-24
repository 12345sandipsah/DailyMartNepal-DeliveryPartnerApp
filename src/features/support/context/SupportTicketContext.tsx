
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TicketStatus = 'OPEN' | 'IN PROGRESS' | 'RESOLVED';

export type TicketPriority = 'NORMAL' | 'HIGH' | 'URGENT';

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
  isLoaded: boolean;
  addTicket: (input: CreateSupportTicketInput) => SupportTicket;
  getTicketById: (ticketId: string) => SupportTicket | undefined;
};

const STORAGE_KEY = '@dailymart_delivery_support_tickets';

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

const VALID_STATUSES: TicketStatus[] = [
  'OPEN',
  'IN PROGRESS',
  'RESOLVED',
];

const VALID_PRIORITIES: TicketPriority[] = [
  'NORMAL',
  'HIGH',
  'URGENT',
];

const VALID_CATEGORIES: TicketCategory[] = [
  'Delivery',
  'Payment',
  'Customer',
  'Vehicle',
  'Warehouse',
  'Account',
  'Other',
];

const SupportTicketContext =
  createContext<SupportTicketContextValue | undefined>(undefined);

const formatCurrentDateTime = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  return `Today, ${displayHour}:${minutes} ${period}`;
};

const getHighestTicketNumber = (
  tickets: SupportTicket[],
): number => {
  const numbers = tickets
    .map(ticket => {
      const match = /^SUP-(\d+)$/.exec(ticket.id);
      return match ? Number(match[1]) : 0;
    })
    .filter(number => Number.isSafeInteger(number) && number >= 0);

  return numbers.length > 0 ? Math.max(...numbers) : 999;
};

const isValidTicket = (value: unknown): value is SupportTicket => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const ticket = value as Partial<SupportTicket>;

  return (
    typeof ticket.id === 'string' &&
    /^SUP-\d+$/.test(ticket.id) &&
    typeof ticket.subject === 'string' &&
    typeof ticket.description === 'string' &&
    typeof ticket.createdAt === 'string' &&
    typeof ticket.updatedAt === 'string' &&
    typeof ticket.latestResponse === 'string' &&
    VALID_CATEGORIES.includes(ticket.category as TicketCategory) &&
    VALID_PRIORITIES.includes(ticket.priority as TicketPriority) &&
    VALID_STATUSES.includes(ticket.status as TicketStatus) &&
    (ticket.orderReference === undefined ||
      typeof ticket.orderReference === 'string')
  );
};

const sanitizeTickets = (value: unknown): SupportTicket[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const validTickets = value.filter(isValidTicket);
  const uniqueTickets = new Map<string, SupportTicket>();

  validTickets.forEach(ticket => {
    uniqueTickets.set(ticket.id, {
      ...ticket,
      subject: ticket.subject.trim(),
      description: ticket.description.trim(),
      orderReference: ticket.orderReference?.trim() || undefined,
    });
  });

  return Array.from(uniqueTickets.values());
};

type SupportTicketProviderProps = {
  children: ReactNode;
};

export const SupportTicketProvider = ({
  children,
}: SupportTicketProviderProps) => {
  const [tickets, setTickets] =
    useState<SupportTicket[]>(INITIAL_TICKETS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep the latest tickets available synchronously to addTicket.
  const ticketsRef = useRef<SupportTicket[]>(INITIAL_TICKETS);
  const nextTicketNumber = useRef(
    getHighestTicketNumber(INITIAL_TICKETS) + 1,
  );
  const isLoadedRef = useRef(false);
  const hasCreatedTicketRef = useRef(false);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistTickets = useCallback((nextTickets: SupportTicket[]) => {
    // Serialize writes so an older write cannot finish after a newer one.
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(() =>
        AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextTickets),
        ),
      )
      .catch(() => {
        // Tickets remain available in memory if local persistence fails.
        // A future backend/API integration should report this failure.
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (cancelled) {
          return;
        }

        let loadedTickets: SupportTicket[];

        if (storedValue !== null) {
          try {
            loadedTickets = sanitizeTickets(JSON.parse(storedValue));
          } catch {
            loadedTickets = INITIAL_TICKETS;
          }

          // An empty saved list is valid and should remain empty.
        } else {
          loadedTickets = INITIAL_TICKETS;
        }

        // Preserve tickets created while storage was loading.
        const ticketsCreatedDuringLoad = hasCreatedTicketRef.current
          ? ticketsRef.current.filter(
              ticket =>
                !INITIAL_TICKETS.some(
                  initialTicket => initialTicket.id === ticket.id,
                ),
            )
          : [];

        const mergedTickets = [
          ...ticketsCreatedDuringLoad,
          ...loadedTickets.filter(
            storedTicket =>
              !ticketsCreatedDuringLoad.some(
                newTicket => newTicket.id === storedTicket.id,
              ),
          ),
        ];

        ticketsRef.current = mergedTickets;
        nextTicketNumber.current =
          getHighestTicketNumber(mergedTickets) + 1;

        setTickets(mergedTickets);

        isLoadedRef.current = true;
        setIsLoaded(true);

        // Initialize storage for a first launch or repair invalid data.
        if (storedValue === null) {
          persistTickets(mergedTickets);
        } else {
          try {
            sanitizeTickets(JSON.parse(storedValue));
          } catch {
            persistTickets(mergedTickets);
          }
        }

        // Persist any ticket created before loading completed.
        if (ticketsCreatedDuringLoad.length > 0) {
          persistTickets(mergedTickets);
        }
      } catch {
        if (cancelled) {
          return;
        }

        // Keep the app usable when storage cannot be read.
        const fallbackTickets = ticketsRef.current;

        nextTicketNumber.current =
          getHighestTicketNumber(fallbackTickets) + 1;

        setTickets(fallbackTickets);
        isLoadedRef.current = true;
        setIsLoaded(true);
      }
    };

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, [persistTickets]);

  const addTicket = useCallback(
    (input: CreateSupportTicketInput): SupportTicket => {
      const subject = input.subject.trim();
      const description = input.description.trim();
      const orderReference = input.orderReference?.trim() || undefined;

      if (subject.length < 5) {
        throw new Error(
          'The ticket subject must contain at least 5 characters.',
        );
      }

      if (description.length < 10) {
        throw new Error(
          'The ticket description must contain at least 10 characters.',
        );
      }

      if (!VALID_CATEGORIES.includes(input.category)) {
        throw new Error('Please select a valid support category.');
      }

      if (!VALID_PRIORITIES.includes(input.priority)) {
        throw new Error('Please select a valid ticket priority.');
      }

      // Keep generated IDs unique against the current in-memory list.
      let ticketId = `SUP-${nextTicketNumber.current}`;

      while (
        ticketsRef.current.some(ticket => ticket.id === ticketId)
      ) {
        nextTicketNumber.current += 1;
        ticketId = `SUP-${nextTicketNumber.current}`;
      }

      nextTicketNumber.current += 1;

      const now = formatCurrentDateTime();

      const newTicket: SupportTicket = {
        id: ticketId,
        subject,
        category: input.category,
        priority: input.priority,
        status: 'OPEN',
        description,
        orderReference,
        createdAt: now,
        updatedAt: now,
        latestResponse:
          'Your support request has been received and is waiting for review.',
      };

      const updatedTickets = [newTicket, ...ticketsRef.current];

      ticketsRef.current = updatedTickets;
      hasCreatedTicketRef.current = true;

      setTickets(updatedTickets);
      persistTickets(updatedTickets);

      return newTicket;
    },
    [persistTickets],
  );

  const getTicketById = useCallback(
    (ticketId: string): SupportTicket | undefined => {
      return tickets.find(ticket => ticket.id === ticketId);
    },
    [tickets],
  );

  const value = useMemo<SupportTicketContextValue>(
    () => ({
      tickets,
      isLoaded,
      addTicket,
      getTicketById,
    }),
    [tickets, isLoaded, addTicket, getTicketById],
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
