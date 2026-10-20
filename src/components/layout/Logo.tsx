import { Link } from 'react-router-dom';

interface Props {
  /** 'lockup' — глобус + надпись в ряд (шапка), 'full' — вертикальный логотип (футер) */
  variant?: 'lockup' | 'full';
  /** белая версия для тёмного фона */
  light?: boolean;
  className?: string;
}

export default function Logo({ variant = 'lockup', light = false, className = '' }: Props) {
  const tone = light ? 'brightness-0 invert' : '';
  return (
    <Link to="/" aria-label="PIRANT Kazakhstan" className={`inline-flex items-center gap-2 lg:gap-3 ${className}`}>
      {variant === 'full' ? (
        <img src="/logo.svg" alt="PIRANT Kazakhstan" className={`h-28 w-auto ${tone}`} />
      ) : (
        <>
          <img src="/logo-mark.svg" alt="" aria-hidden className={`h-9 w-auto lg:h-12 ${tone}`} />
          <img src="/logo-wordmark.svg" alt="PIRANT Kazakhstan" className={`h-6 w-auto lg:h-9 ${tone}`} />
        </>
      )}
    </Link>
  );
}
