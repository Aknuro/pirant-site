import {
  Activity, Ambulance, Antenna, Award, BadgeCheck, BarChart3, BatteryCharging, BedDouble, Bell, Box, Boxes, Briefcase, Building2, Bus, Cable,
  Camera, Check, Cloud, ClipboardList, Cog, Container, Cpu, Crosshair, Database, DoorOpen, Droplets, Eye, Factory, Fingerprint, Flame, FileText,
  Fuel, Gauge, Globe, Hammer, Handshake, HardDrive, Headset, KeyRound, Landmark, Laptop, Layers, Lock, Megaphone, Monitor, MapPin, Mail, Network,
  Package, PencilRuler, Phone, Plane, Plug, Radar, Radio, RadioTower, RefreshCw, Route, Satellite, SatelliteDish, Server, Settings, Share2,
  ShieldCheck, Siren, Snowflake, Star, Target, Thermometer, Timer, Truck, Users, Video, Warehouse, Wifi, Wrench, Zap, type LucideProps,
} from 'lucide-react';

/** Набор иконок для сайта и панели управления. Ключ хранится в данных, подпись — для выбора в панели. */
const registry = {
  activity: [Activity, 'Активность / мониторинг'], ambulance: [Ambulance, 'Скорая / экстренные службы'], antenna: [Antenna, 'Антенна'],
  award: [Award, 'Награда'], badge: [BadgeCheck, 'Сертификат'], chart: [BarChart3, 'График'], battery: [BatteryCharging, 'Питание / ИБП'],
  bed: [BedDouble, 'Спальное место'], bell: [Bell, 'Оповещение'], box: [Box, 'Коробка / поставка'], boxes: [Boxes, 'Модули'],
  briefcase: [Briefcase, 'Портфель / проекты'], building: [Building2, 'Здание'], bus: [Bus, 'Транспорт'], cable: [Cable, 'Кабель'],
  camera: [Camera, 'Камера'], check: [Check, 'Галочка'], cloud: [Cloud, 'Облако'], clipboard: [ClipboardList, 'Список / анализ'], cog: [Cog, 'Шестерня'],
  container: [Container, 'Контейнер'], cpu: [Cpu, 'Процессор'], crosshair: [Crosshair, 'Прицел'], database: [Database, 'База данных'],
  door: [DoorOpen, 'Дверь / коридор'], drop: [Droplets, 'Нефть и газ'], eye: [Eye, 'Наблюдение'], factory: [Factory, 'Промышленность'],
  fingerprint: [Fingerprint, 'Идентификация'], flame: [Flame, 'Огонь'], file: [FileText, 'Документ'], fuel: [Fuel, 'Топливо / ДГУ'], gauge: [Gauge, 'Прибор'],
  globe: [Globe, 'Глобус'], hammer: [Hammer, 'Монтаж'], handshake: [Handshake, 'Партнёры'], disk: [HardDrive, 'Хранение данных'], headset: [Headset, 'Поддержка'],
  key: [KeyRound, 'Ключ'], landmark: [Landmark, 'Госучреждение'], laptop: [Laptop, 'АРМ / ноутбук'], layers: [Layers, 'Слои'], lock: [Lock, 'Замок'],
  megaphone: [Megaphone, 'Громкоговоритель'], monitor: [Monitor, 'Монитор'], pin: [MapPin, 'Адрес'], mail: [Mail, 'Почта'], network: [Network, 'Сеть'],
  package: [Package, 'Пакет'], ruler: [PencilRuler, 'Проектирование'], phone: [Phone, 'Телефон'], plane: [Plane, 'Авиация'], plug: [Plug, 'Подключение'],
  radar: [Radar, 'Радар'], radio: [Radio, 'Радиостанция'], tower: [RadioTower, 'Мачта / вышка'], refresh: [RefreshCw, 'Ретранслятор / обновление'],
  route: [Route, 'Маршрут / запас хода'], satellite: [Satellite, 'Спутник'], dish: [SatelliteDish, 'Спутниковая антенна'], server: [Server, 'Сервер'],
  settings: [Settings, 'Настройка'], share: [Share2, 'Интеграция'], shield: [ShieldCheck, 'Защита'], siren: [Siren, 'Сирена'], snow: [Snowflake, 'Охлаждение'],
  star: [Star, 'Звезда'], target: [Target, 'Цель'], thermometer: [Thermometer, 'Климат'], timer: [Timer, 'Время'], truck: [Truck, 'Грузовик / шасси'],
  users: [Users, 'Люди'], video: [Video, 'Видео'], warehouse: [Warehouse, 'Склад / ЦОД'], wifi: [Wifi, 'Беспроводная связь'], wrench: [Wrench, 'Ключ гаечный'], zap: [Zap, 'Энергия'],
} as const;

export type IconName = keyof typeof registry;
export const iconList = (Object.keys(registry) as IconName[]).map((name) => ({ name, label: registry[name][1] as string }))
  .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

export default function Icon({ name, ...p }: { name: IconName | string } & LucideProps) {
  const entry = (registry as Record<string, readonly [React.ComponentType<LucideProps>, string]>)[name] ?? registry.check;
  const C = entry[0];
  return <C {...p} />;
}
