import AboutBlock from '../components/AboutBlock';
import CtaBand from '../components/CtaBand';
import Stats from '../components/home/Stats';
import PageHead from '../components/PageHead';
import ProcessCycle from '../components/ProcessCycle';
import { useLang } from '../i18n/LanguageContext';

export default function About() {
  const { t } = useLang();
  return (
    <>
      <PageHead title={t('about')} sub={t('trust')} />
      <Stats />
      <AboutBlock />
      <ProcessCycle />
      <CtaBand />
    </>
  );
}
