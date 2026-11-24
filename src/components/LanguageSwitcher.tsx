import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const currentLang = i18n.language;
  const isTamil = currentLang === 'ta';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors">
          <Globe className="h-4 w-4" />
          <span>{isTamil ? t('common.tamil') : t('common.english')}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
          <span className="flex items-center gap-2">
            <span>🇬🇧</span>
            {t('common.english')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => i18n.changeLanguage('ta')}>
          <span className="flex items-center gap-2">
            <span>🇮🇳</span>
            {t('common.tamil')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}