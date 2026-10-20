import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useDirections } from '../../store/hooks';
import { useLang } from '../../i18n/LanguageContext';
import ServiceIcon from '../ServiceIcon';

export default function ServicesGrid() {
  const { l, t } = useLang();
  const services = useDirections();
  return (
    <section id="services" className="scroll-mt-24 bg-brand-soft py-16 lg:py-20">
      <div className="container-site">
        <h2 className="text-3xl font-extrabold text-navy">{t('servicesTitle')}</h2>
        <p className="mt-2 max-w-3xl text-ink/70">{t('servicesLead')}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link key={s.id} to={`/services/${s.id}`} className="group flex flex-col overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-lg">
              <img src={s.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
                <ServiceIcon name={s.icon} size={26} className="text-brand" />
                <h3 className="mt-3 text-lg font-bold leading-snug text-navy">{l(s.title)}</h3>
                <p className="mt-2 flex-1 text-sm text-ink/70">{l(s.description)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark">
                  {t('more')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
