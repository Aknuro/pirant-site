import type { Localized, NewsItem, Partner, PartnerCategory } from '../types';
import type { IconName } from '../components/Icon';

export const contacts = {
  phone: '+7 778 800 44 77',
  phoneHref: 'tel:+77788004477',
  whatsapp: '77788004477', // формат для wa.me: без + и пробелов
  phone2: '+7 701 715 20 61',
  phone2Href: 'tel:+77017152061',
  email: 'info@pirant.kz',
  telegram: '', // логин без @ или ссылка; заполняется в панели управления → Контакты
  site: 'https://pirant.kz/',
  offices: [
    { id: 'astana', city: { ru: 'Астана', kk: 'Астана', en: 'Astana' }, address: 'г. Астана, район Есиль, ул. А. Ермекова 1/1, 4 этаж, офис 3', mapQuery: 'Астана, улица А. Ермекова 1/1', phone: '+7 701 715 20 61' },
    { id: 'almaty', city: { ru: 'Алматы', kk: 'Алматы', en: 'Almaty' }, address: 'г. Алматы, Бостандыкский район, ул. Туркебаева 257А, оф. 35', mapQuery: 'Алматы, улица Туркебаева 257А', phone: '+7 778 800 44 77' },
  ],
};

export const stats = [
  { value: '20+', label: { ru: 'лет на рынке', kk: 'жыл нарықта', en: 'years on the market' } },
  { value: '150+', label: { ru: 'реализованных проектов', kk: 'іске асырылған жоба', en: 'completed projects' } },
  { value: '10+', label: { ru: 'регионов присутствия', kk: 'өңірде өкілдік', en: 'regions covered' } },
];

export const advantages: { icon: IconName; title: Record<'ru' | 'en', string>; text: string }[] = [
  { icon: 'building', title: { ru: 'Комплексный подход', en: 'Integrated approach' }, text: 'Полный цикл работ — от проектирования до сервисной поддержки' },
  { icon: 'shield', title: { ru: 'Надежность и безопасность', en: 'Reliability and security' }, text: 'Решения, соответствующие международным стандартам и требованиям безопасности' },
  { icon: 'users', title: { ru: 'Опыт и экспертиза', en: 'Experience and expertise' }, text: 'Команда сертифицированных специалистов с многолетним опытом реализации проектов' },
  { icon: 'handshake', title: { ru: 'Надежные партнеры', en: 'Trusted partners' }, text: 'Сотрудничество с ведущими мировыми производителями оборудования и технологий' },
];

export const cycle: { icon: IconName; title: string; text: string }[] = [
  { icon: 'clipboard', title: 'Анализ потребностей', text: 'Изучаем задачи заказчика, объект и требования к безопасности.' },
  { icon: 'ruler', title: 'Проектирование', text: 'Разрабатываем архитектуру решения и техническую документацию.' },
  { icon: 'package', title: 'Поставка оборудования', text: 'Поставляем оборудование проверенных мировых производителей.' },
  { icon: 'wrench', title: 'Монтаж и интеграция', text: 'Монтируем системы и интегрируем их с инфраструктурой заказчика.' },
  { icon: 'settings', title: 'Пусконаладка и тестирование', text: 'Настраиваем и проверяем решение в рабочих условиях.' },
  { icon: 'headset', title: 'Сервисное обслуживание', text: 'Обеспечиваем регламентное обслуживание и техническую поддержку.' },
  { icon: 'chart', title: 'Поддержка и развитие', text: 'Помогаем масштабировать и развивать систему вместе с вашими задачами.' },
];

export interface SeedService { id: string; icon: IconName; image: string; title: Localized; description: Localized }
export const services: SeedService[] = [
  {
    id: 'mobile-complexes', icon: 'truck', image: '/images/svc-mobile.webp',
    title: { ru: 'Командно-штабные машины и мобильные комплексы связи', kk: 'Қолбасшылық-штабтық машиналар', en: 'Command vehicles and mobile communication units' },
    description: { ru: 'Вездеходное шасси 6х6, до 10 рабочих мест, автономное питание и развёртывание за 10–30 минут.', kk: '6х6 жолсыз шасси, 10 жұмыс орнына дейін, автономды қуат.', en: '6x6 off-road chassis, up to 10 workstations, autonomous power, deployment in 10–30 minutes.' },
  },
  {
    id: 'radio-communication', icon: 'radio', image: '/images/svc-radio.webp',
    title: { ru: 'Профессиональные системы радиосвязи', kk: 'Кәсіби радиобайланыс жүйелері', en: 'Professional radio systems' },
    description: { ru: 'DMR, TETRA, APCO-25, NXDN, КВ/УКВ и диспетчерские системы для промышленности и экстренных служб.', kk: 'DMR, TETRA, APCO-25, NXDN, КВ/УКВ және диспетчерлік жүйелер.', en: 'DMR, TETRA, APCO-25, NXDN, HF/VHF and dispatch systems for industry and emergency services.' },
  },
  {
    id: 'situation-centers', icon: 'monitor', image: '/images/svc-situation.webp',
    title: { ru: 'Ситуационные центры и центры оперативного управления', kk: 'Жағдаяттық орталықтар', en: 'Situation and operations centers' },
    description: { ru: 'Видеостены, рабочие места операторов и единое информационное пространство для принятия решений.', kk: 'Бейнеқабырғалар, оператор орындары, бірыңғай ақпараттық кеңістік.', en: 'Video walls, operator workstations and a unified information space for decision-making.' },
  },
  {
    id: 'data-centers', icon: 'server', image: '/images/dc-container.webp',
    title: { ru: 'Центры обработки данных (ЦОД)', kk: 'Деректерді өңдеу орталықтары (ДӨО)', en: 'Data centers' },
    description: { ru: 'Модульные, контейнерные, стационарные и микро-ЦОД: от проекта до сервисной поддержки.', kk: 'Модульдік, контейнерлік, стационарлық және микро-ДӨО.', en: 'Modular, containerized, stationary and micro data centers, from design to service.' },
  },
  {
    id: 'cyber-security', icon: 'shield', image: '/images/svc-security.webp',
    title: { ru: 'Информационная безопасность', kk: 'Ақпараттық қауіпсіздік', en: 'Information security' },
    description: { ru: 'Защита сети, SOC и SIEM, защита конечных точек, управление доступом и данными.', kk: 'Желі қорғанысы, SOC/SIEM, соңғы нүктелерді қорғау.', en: 'Network security, SOC and SIEM, endpoint protection, identity and data protection.' },
  },
  {
    id: 'c-uav-systems', icon: 'radar', image: '/images/svc-cuav.webp',
    title: { ru: 'Системы обнаружения и противодействия БПЛА', kk: 'Ұшқышсыз аппараттарға қарсы жүйелер', en: 'Counter-UAV detection and defeat systems' },
    description: { ru: 'Радары и RF-сенсоры TERJIN, безопасный перехват управления D-Fend Solutions.', kk: 'TERJIN радарлары және D-Fend басқаруды қауіпсіз ұстау.', en: 'TERJIN radars and RF sensors, D-Fend Solutions safe takeover of drone control.' },
  },
];

/**
 * ДЕМО-ДАННЫЕ: новости и записи истории написаны для примера.
 * Замените на реальные события компании (на этапе 2 они придут из БД/админ-панели).
 */
export const news: NewsItem[] = [
  { id: 1, year: 2025, date: '2025-09-12', image: '/images/kshm-main.webp', showInHistory: true,
    title: { ru: 'Поставлен комплект командно-штабных машин для экстренных служб', en: 'Command vehicle fleet delivered to emergency services' },
    text: { ru: 'Завершили поставку и пусконаладку мобильных комплексов связи на вездеходном шасси 6х6 с автономным питанием и климат-контролем.', en: 'We completed delivery and commissioning of 6x6 mobile communication units.' } },
  { id: 2, year: 2025, date: '2025-07-03', image: '/images/svc-radio.webp', showInHistory: false,
    title: { ru: 'Запущена сеть DMR для промышленного предприятия', en: 'DMR network launched for an industrial site' },
    text: { ru: 'Цифровая радиосвязь с диспетчерской консолью, записью переговоров и интеграцией с системами предприятия.', en: 'Digital radio with a dispatch console and call recording.' } },
  { id: 3, year: 2024, date: '2024-11-20', image: '/images/cuav-operator.webp', showInHistory: true,
    title: { ru: 'Представили комплексное решение против БПЛА', en: 'Counter-UAV solution presented' },
    text: { ru: 'Совместная система TERJIN и D-Fend Solutions: обнаружение, идентификация, перехват и нейтрализация для защиты критически важных объектов.', en: 'A joint TERJIN and D-Fend Solutions system for critical facilities.' } },
  { id: 4, year: 2024, date: '2024-05-14', image: '/images/dc-container.webp', showInHistory: false,
    title: { ru: 'Введён в эксплуатацию контейнерный ЦОД', en: 'Containerized data center commissioned' },
    text: { ru: 'Быстрое развёртывание ИТ-инфраструктуры на удалённой площадке: мобильное решение для любых условий и локаций.', en: 'Rapid IT infrastructure deployment at a remote site.' } },
  { id: 5, year: 2022, date: '2022-10-05', image: '/images/svc-situation.webp', showInHistory: true,
    title: { ru: 'Открыт ситуационный центр для государственного заказчика', en: 'Situation center opened for a government customer' },
    text: { ru: 'Видеостена, рабочие места операторов и единое информационное пространство для оперативного управления.', en: 'Video wall, operator workstations and a unified information space.' } },
  { id: 6, year: 2019, date: '2019-06-18', image: '/images/svc-security.webp', showInHistory: true,
    title: { ru: 'Запущен центр мониторинга информационной безопасности', en: 'Security monitoring center launched' },
    text: { ru: 'Мониторинг событий 24/7, корреляция и выявление инцидентов, реагирование на угрозы.', en: '24/7 event monitoring and incident response.' } },
  { id: 7, year: 2015, date: '2015-04-22', image: '/images/dc-stationary.webp', showInHistory: true,
    title: { ru: 'Построен стационарный ЦОД для крупного предприятия', en: 'Stationary data center built for a large enterprise' },
    text: { ru: 'Капитальное решение для размещения критически важной ИТ-инфраструктуры с резервированием систем.', en: 'A capital facility for critical IT infrastructure.' } },
  { id: 8, year: 2008, date: '2008-03-10', image: '/images/about-building.webp', showInHistory: true,
    title: { ru: 'Открыт офис в Алматы', en: 'Almaty office opened' },
    text: { ru: 'Расширили присутствие компании и начали работу с заказчиками по всей стране.', en: 'We expanded our presence and started working with customers across the country.' } },
];

type P = [id: string, name: string, cat: PartnerCategory, ru?: string];
const defaults: Record<PartnerCategory, string> = {
  radio: 'Профессиональная радиосвязь',
  security: 'Решения для кибер- и информационной безопасности',
  servers: 'Серверы, инфраструктура и ЦОД',
  video: 'Видеоаналитика, видеостены и системы визуализации',
  cuav: 'Системы противодействия БПЛА',
};
const list: P[] = [
  ['hytera', 'Hytera', 'radio'], ['motorola-solutions', 'Motorola Solutions', 'radio'], ['icom', 'ICOM', 'radio'], ['hycomms', 'Hycomms', 'radio'], ['sepura', 'Sepura', 'radio'],
  ['paloalto', 'Palo Alto Networks', 'security'], ['fortinet', 'Fortinet', 'security'], ['check-point', 'Check Point', 'security'], ['cisco-secure', 'Cisco Secure', 'security'],
  ['crowdstrike', 'CrowdStrike', 'security'], ['microsoft-security', 'Microsoft Security', 'security'], ['splunk', 'Splunk', 'security'], ['ibm-security', 'IBM Security', 'security'],
  ['trend-micro', 'Trend Micro', 'security'], ['sentinelone', 'SentinelOne', 'security'], ['cyberark', 'CyberArk', 'security'], ['veeam', 'Veeam', 'security', 'Резервное копирование и восстановление данных'],
  ['huawei', 'Huawei', 'servers', 'ЦОД, контейнерные решения, серверы; решения для ситуационных центров и видеостен'], ['schneider', 'Schneider Electric', 'servers'], ['vertiv', 'Vertiv', 'servers'], ['eaton', 'Eaton', 'servers'],
  ['dell', 'Dell Technologies', 'servers', 'Серверные и вычислительные решения для надежной работы центров обработки данных'], ['hpe', 'Hewlett Packard Enterprise', 'servers'],
  ['cisco', 'Cisco', 'servers', 'Сетевые решения для передачи данных, безопасности и интеграции всех систем'], ['nutanix', 'Nutanix', 'servers'], ['lenovo', 'Lenovo', 'servers'], ['netapp', 'NetApp', 'servers'], ['ibm', 'IBM', 'servers'], ['fujitsu', 'Fujitsu', 'servers'],
  ['milestone', 'Milestone', 'video', 'Платформа видеонаблюдения (VMS) для интеграции и управления видеонаблюдением'], ['barco', 'Barco', 'video', 'Профессиональные видеостены, контроллеры, системы визуализации и управления контентом'],
  ['samsung', 'Samsung', 'video', 'Профессиональные дисплеи и видеостены с безупречным качеством изображения'], ['crestron', 'Crestron', 'video', 'Системы управления и автоматизации для ситуационных центров'],
  ['eizo', 'EIZO', 'video', 'Профессиональные мониторы для операторских рабочих мест'], ['legrand', 'Legrand', 'video', 'Инфраструктурные решения для ситуационных центров и систем управления'],
  ['avaya', 'Avaya', 'video', 'Коммуникационные платформы и решения для совместной работы и оповещения'],
  ['terjin', 'TERJIN', 'cuav', 'Радары, RF-сенсоры и оптико-электронные системы обнаружения БПЛА; подавление каналов управления'],
  ['d-fend', 'D-Fend Solutions', 'cuav', 'RF Cyber Takeover: безопасный перехват управления БПЛА'],
];
const FEATURED = ['huawei', 'cisco', 'motorola-solutions', 'hytera', 'd-fend', 'terjin', 'dell', 'fortinet'];
export const partners: Partner[] = list.map(([id, name, category, ru]) => ({
  id, name, category, logo: `/partners/${id}.png`, description: { ru: ru ?? defaults[category] }, featured: FEATURED.includes(id),
}));
