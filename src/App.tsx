import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import About from './pages/About';
import Contacts from './pages/Contacts';
import History from './pages/History';
import Home from './pages/Home';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import NotFound from './pages/NotFound';
import Partners from './pages/Partners';
import ServicePage from './pages/ServicePage';
import AdminApp from './admin/AdminApp';
import { useStoreReady } from './store/site';

export default function App() {
  const ready = useStoreReady();
  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-ink/60" role="status">Загрузка…</div>;
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services/:id" element={<ServicePage />} />
        <Route path="/history" element={<History />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
