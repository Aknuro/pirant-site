import type { LucideProps } from 'lucide-react';
import Icon from './Icon';

/** Иконка направления: имя берётся из данных (редактируется в панели управления) */
export default function ServiceIcon({ name, ...props }: { name: string } & LucideProps) {
  return <Icon name={name} {...props} />;
}
