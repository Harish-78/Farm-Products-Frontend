import * as React from 'react';
import { cva } from 'class-variance-authority';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils'; // fix: was `'cn'`

const ConfirmDialogVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center p-4'
);

const ConfirmDialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute inset-0 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=open]:fade-in',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out',
      className
    )}
    {...props}
  />
));
ConfirmDialogOverlay.displayName = 'ConfirmDialogOverlay';

const ConfirmDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative z-10 w-full max-w-md p-6',
      'bg-card text-card-foreground rounded-xl shadow-2xl',
      'border border-border ring-1 ring-black/5',
      'animate-in fade-in zoom-in-95 duration-150',
      className
    )}
    {...props}
  />
));
ConfirmDialogContent.displayName = 'ConfirmDialogContent';

const ConfirmDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-2 pr-8', className)} {...props} />
));
ConfirmDialogHeader.displayName = 'ConfirmDialogHeader';

const ConfirmDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-lg font-semibold leading-tight', className)} {...props} />
));
ConfirmDialogTitle.displayName = 'ConfirmDialogTitle';

const ConfirmDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
ConfirmDialogDescription.displayName = 'ConfirmDialogDescription';

const ConfirmDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-row-reverse gap-2 mt-6', className)}
    {...props}
  />
));
ConfirmDialogFooter.displayName = 'ConfirmDialogFooter';

// `ButtonHTMLAttributes` (not `HTMLAttributes`) so `onClick`, `disabled`, etc. are typed correctly.
const ConfirmDialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="icon"
    type="button"
    aria-label="Close"
    className={cn(
      'absolute right-3 top-3 h-8 w-8 shrink-0',
      'text-muted-foreground hover:text-foreground',
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </Button>
));
ConfirmDialogClose.displayName = 'ConfirmDialogClose';

type ButtonVariant = React.ComponentProps<typeof Button>['variant'];

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Button variant for the confirm action. Defaults to "destructive". */
  variant?: ButtonVariant;
  /** Optional icon override. Pass `null` to hide the icon. */
  icon?: React.ReactNode | null;
  className?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'destructive',
  icon,
  className,
}: ConfirmDialogProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Save/restore focus and focus the confirm button on open.
  React.useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const first = contentRef.current?.querySelector<HTMLElement>(
        '[data-autofocus], button:not([aria-label="Close"])'
      );
      first?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // ESC to close + basic focus trap.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isConfirming) {
      e.stopPropagation();
      onOpenChange(false);
      return;
    }
    if (e.key !== 'Tab' || !contentRef.current) return;
    const focusables = contentRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!open) return null;

  const showIcon = icon !== null;
  const iconNode =
    icon === undefined ? (
      <div
        className={cn(
          'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
          'bg-destructive/10 text-destructive',
          'sm:mx-0'
        )}
        aria-hidden="true"
      >
        <AlertTriangle className="h-6 w-6" />
      </div>
    ) : (
      icon
    );

  return (
    <div
      className={ConfirmDialogVariants()}
      role="presentation"
      onKeyDown={handleKeyDown}
    >
      <ConfirmDialogOverlay
        data-state="open"
        onClick={() => !isConfirming && onOpenChange(false)}
      />
      <ConfirmDialogContent
        ref={contentRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={className}
      >
        <ConfirmDialogClose
          onClick={() => !isConfirming && onOpenChange(false)}
          disabled={isConfirming}
        />
        <ConfirmDialogHeader>
          {showIcon && iconNode && <div className="mb-1">{iconNode}</div>}
          <ConfirmDialogTitle id={titleId}>{title}</ConfirmDialogTitle>
          {description && (
            <ConfirmDialogDescription id={descriptionId}>
              {description}
            </ConfirmDialogDescription>
          )}
        </ConfirmDialogHeader>
        <ConfirmDialogFooter>
          <Button
            variant={variant}
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirming}
            data-autofocus
          >
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
        </ConfirmDialogFooter>
      </ConfirmDialogContent>
    </div>
  );
}