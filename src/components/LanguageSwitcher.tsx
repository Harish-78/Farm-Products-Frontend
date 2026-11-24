import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang.startsWith('ta') ? 'en' : 'ta';
    i18n.changeLanguage(nextLang);
  };

  const isTamil = currentLang.startsWith('ta');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="relative h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title={isTamil ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold leading-none px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
        {isTamil ? 'த' : 'EN'}
      </span>
    </Button>
  );
}
