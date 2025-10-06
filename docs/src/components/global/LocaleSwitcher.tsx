'use client'
import { useTranslation } from 'react-i18next'
import i18nConfig from '@/i18n/i18nConfig'
import { usePathname, useRouter } from '@/lib/navigation'
import { useTransition, useState, useRef, useEffect } from 'react'
import { getRoutingContext, buildUrl } from '@/lib/utils/routing'

type Locale = { code: string; name: string; direction?: string; flag?: string };
type LocaleSwitcherProps = {
  locales: Locale[];
  site: string;
  translations: Array<{ languages_code: string; permalink: string }>;
  currentLang: string;
};

const flagMap: Record<string, string> = {
  en: '🇬🇧',
  vi: '🇻🇳',
  fr: '🇫🇷',
  ja: '🇯🇵',
  zh: '🇨🇳',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹',
  ru: '🇷🇺',
  th: '🇹🇭',
  // ... thêm các code khác nếu cần
};
const getFlag = (code: string) => flagMap[code?.slice(0,2)] || '🌐';

export default function LocaleSwitcher({ locales = [], site, translations = [], currentLang }: LocaleSwitcherProps) {
  const { i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const currentPathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài (luôn luôn gọi hook này)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  console.log('[LocaleSwitcher] Debug props:', {
    locales,
    site,
    translations,
    currentLang,
    localesLength: locales?.length,
    isArray: Array.isArray(locales)
  });

  if (!Array.isArray(locales) || locales.length < 2) {
    console.log('[LocaleSwitcher] Not showing - insufficient locales:', { locales, length: locales?.length });
    return null;
  }
  
  // Lọc bỏ các phần tử null/undefined hoặc không có code
  const safeLocales = locales.filter(l => l && typeof l.code === 'string' && l.code.length > 0);
  if (safeLocales.length < 2) {
    console.log('[LocaleSwitcher] Not showing - insufficient safe locales:', { safeLocales, length: safeLocales.length });
    return null;
  }

  console.log('[LocaleSwitcher] Will render with locales:', safeLocales);

  const currentLocale = (i18n?.language || 'en').slice(0, 2);

  console.log('LocaleSwitcher props:', {
    locales: i18nConfig.locales,
    site: site,
    translations,
    currentLang: currentLang,
  });

  const setLang = (langItem: string) => {
    console.log('translations:', translations);
    console.log('langItem:', langItem);
    const translation = translations.find(t => {
      const translationCode = (t.languages_code || '').slice(0, 2);
      const targetCode = langItem.slice(0, 2);
      return translationCode === targetCode;
    });
    console.log('matched translation:', translation);
    
    // Khi chuyển đổi ngôn ngữ, luôn sử dụng permalink rỗng để về homepage của ngôn ngữ đó
    // Không sử dụng permalink từ translation vì có thể gây ra URL sai
    const permalink = '';

    // Build URL using utility function with current pathname
    const newUrl = buildUrl(langItem, permalink, undefined, currentPathname);

    console.log('[LocaleSwitcher] Switching to:', newUrl);

    startTransition(() => {
      router.push(newUrl);
      router.refresh();
    });
    setOpen(false);
  };

  const currentLangObj = safeLocales.find(l => {
    const localeCode = l.code.slice(0,2);
    const currentCode = currentLang.slice(0,2);
    return localeCode === currentCode;
  });
  if (!currentLangObj) {
    console.warn('LocaleSwitcher: currentLangObj not found', { currentLang, safeLocales });
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        tabIndex={0}
        className="px-2 py-2 rounded-full shadow-sm hover:bg-[var(--color-primary)] text-gray-800 flex items-center text-3xl"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLangObj.flag || getFlag(currentLangObj.code)}
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 w-40 rounded-lg bg-white border border-gray-200 shadow-lg py-2 z-50" style={{minWidth: '120px'}}>
          {safeLocales
            .filter(l => {
              const localeCode = l.code.slice(0,2);
              const currentCode = currentLang.slice(0,2);
              return localeCode !== currentCode;
            })
            .map((l) => (
              <li key={l.code}>
                <button
                  disabled={isPending}
                  className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 text-gray-800"
                  onClick={() => setLang(l.code.slice(0,2))}
                >
                  <span className="text-lg">{l.flag || getFlag(l.code)}</span>
                  <span>{l.name}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
