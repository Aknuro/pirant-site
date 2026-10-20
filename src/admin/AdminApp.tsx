import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from '../store/site';
import AdminLayout, { SECTION_ROLES } from './AdminLayout';
import Login from './Login';
import { ConfirmProvider, DirtyProvider, PageTitle, Panel, ToastProvider } from './ui';
import Dashboard from './pages/Dashboard';
import Directions from './pages/Directions';
import DirectionEditor from './pages/DirectionEditor';
import NewsList from './pages/NewsList';
import NewsEditor from './pages/NewsEditor';
import Inquiries from './pages/Inquiries';
import Company from './pages/Company';
import Contacts from './pages/Contacts';
import Partners from './pages/Partners';
import Users from './pages/Users';
import DataPage from './pages/DataPage';
import Notifications from './pages/Notifications';
import type { ReactElement } from 'react';
import type { Role } from '../types';

function Guard({ section, children }: { section: string; children: ReactElement }) {
  const me = useSession();
  const roles: Role[] | undefined = SECTION_ROLES[section];
  if (roles && me && !roles.includes(me.role)) {
    return <><PageTitle title="Недостаточно прав" /><Panel><p className="text-sm">Этот раздел доступен только суперадминистратору.</p></Panel></>;
  }
  return children;
}

export default function AdminApp() {
  const me = useSession();
  // панель не должна попадать в поисковую выдачу
  useEffect(() => {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <DirtyProvider>
          {!me ? <Login /> : (
            <Routes>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="directions" element={<Directions />} />
                <Route path="directions/:id" element={<DirectionEditor />} />
                <Route path="news" element={<NewsList />} />
                <Route path="news/:id" element={<NewsEditor />} />
                <Route path="inquiries" element={<Inquiries />} />
                <Route path="company" element={<Guard section="company"><Company /></Guard>} />
                <Route path="contacts" element={<Guard section="contacts"><Contacts /></Guard>} />
                <Route path="partners" element={<Guard section="partners"><Partners /></Guard>} />
                <Route path="users" element={<Guard section="users"><Users /></Guard>} />
                <Route path="notifications" element={<Guard section="notifications"><Notifications /></Guard>} />
                <Route path="data" element={<Guard section="data"><DataPage /></Guard>} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
          )}
        </DirtyProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
