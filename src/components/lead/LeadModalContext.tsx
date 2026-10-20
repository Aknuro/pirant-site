import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Ctx { open: boolean; openLead: () => void; closeLead: () => void }
const LeadModalContext = createContext<Ctx | null>(null);

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openLead = useCallback(() => setOpen(true), []);
  const closeLead = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, openLead, closeLead }), [open, openLead, closeLead]);
  return <LeadModalContext.Provider value={value}>{children}</LeadModalContext.Provider>;
}

export function useLeadModal() {
  const ctx = useContext(LeadModalContext);
  if (!ctx) throw new Error('useLeadModal must be used inside LeadModalProvider');
  return ctx;
}
