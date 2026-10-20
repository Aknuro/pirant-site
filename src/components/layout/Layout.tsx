import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FloatingLeadButton from '../lead/FloatingLeadButton';
import LeadModal from '../lead/LeadModal';
import { LeadModalProvider } from '../lead/LeadModalContext';
import Footer from './Footer';
import Header from './Header';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <LeadModalProvider>
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <FloatingLeadButton />
      <LeadModal />
    </div>
    </LeadModalProvider>
  );
}
