import { api } from './api';
export const clone = <T,>(o: T): T => (o == null ? o : JSON.parse(JSON.stringify(o)));
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const nowISO = () => new Date().toISOString();

const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ә: 'a', ғ: 'g', қ: 'k', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i' };
/** Адрес страницы из названия: «Радиосвязь» → radiosvyaz */
export function slugify(s: string): string {
  const out = [...String(s || '').toLowerCase()].map((c) => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return out || uid('item');
}
export const norm = (s: string) => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"'().,;:!?/\\]+/g, ' ').replace(/\s+/g, ' ').trim();
export const digits = (s: string) => String(s || '').replace(/\D+/g, '');

export function fmtDate(iso?: string, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(+d)) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}${withTime ? ` ${p(d.getHours())}:${p(d.getMinutes())}` : ''}`;
}
export function fmtSize(b?: number): string {
  if (b == null) return '';
  if (b < 1024) return `${b} Б`;
  if (b < 1048576) return `${Math.round(b / 1024)} КБ`;
  return `${(b / 1048576).toFixed(1).replace('.', ',')} МБ`;
}
export function plural(n: number, f: [string, string, string]) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? f[0] : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? f[1] : f[2];
}

export async function sha256(text: string): Promise<string> {
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* небезопасный контекст (http без localhost) */ }
  return `plain:${text}`;
}

export function download(name: string, text: string, type = 'application/octet-stream') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------------- Загрузка изображений: уменьшение и конвертация в WebP в браузере, затем отправка на сервер ---------------- */
export interface UploadedImage { src: string; type: string; width: number; height: number; size: number; originalSize: number }
const MAX_SIDE = 1920, QUALITY = 0.85;

export async function processImage(file: File): Promise<UploadedImage> {
  if (!file.type.startsWith('image/')) throw new Error(`«${file.name}» — не изображение.`);
  if (file.size > 25 * 1048576) throw new Error(`«${file.name}» больше 25 МБ. Уменьшите файл и повторите.`);
  const readAsDataURL = (f: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('Не удалось прочитать файл.')); r.readAsDataURL(f); });
  // SVG и GIF не перерисовываем — иначе потеряем векторность/анимацию. GIF уходит на сервер как есть;
  // SVG на сервер не принимаем (в нём может быть скрипт), поэтому он остаётся встроенным в данные.
  if (file.type === 'image/svg+xml') {
    const src = await readAsDataURL(file);
    return { src, type: file.type, width: 0, height: 0, size: file.size, originalSize: file.size };
  }
  if (file.type === 'image/gif') {
    const { url } = await api<{ url: string }>('POST', '/admin/upload', undefined, { raw: file, contentType: 'image/gif' });
    return { src: url, type: file.type, width: 0, height: 0, size: file.size, originalSize: file.size };
  }
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`Не удалось открыть «${file.name}».`)); i.src = bitmapUrl; });
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => c.toBlob(res, 'image/webp', QUALITY));
    const out = blob && blob.type === 'image/webp' ? blob : await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', QUALITY));
    if (!out) throw new Error('Не удалось сжать изображение.');
    const { url } = await api<{ url: string }>('POST', '/admin/upload', undefined, { raw: out, contentType: out.type });
    return { src: url, type: out.type, width: w, height: h, size: out.size, originalSize: file.size };
  } finally { URL.revokeObjectURL(bitmapUrl); }
}
