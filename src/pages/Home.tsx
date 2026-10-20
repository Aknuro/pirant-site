import AboutBlock from '../components/AboutBlock';
import CtaBand from '../components/CtaBand';
import Hero from '../components/home/Hero';
import NewsSection from '../components/home/NewsSection';
import PartnersStrip from '../components/home/PartnersStrip';
import ServicesGrid from '../components/home/ServicesGrid';
import Stats from '../components/home/Stats';
import ProcessCycle from '../components/ProcessCycle';

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <AboutBlock />
      <ServicesGrid />
      <ProcessCycle />
      <NewsSection />
      <PartnersStrip />
      <CtaBand />
    </>
  );
}
