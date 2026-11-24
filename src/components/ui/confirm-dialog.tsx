import * as React from 'react';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from 'cn';

const ConfirmDialogVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center'
);

const ConfirmDialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('bg-black/60 backdrop-blur-sm transition-opacity', className)}
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
      'w-full max-w-md p-6 bg-card text-card-foreground rounded-xl shadow-lg border border-border animate-in fade-in slide-in-from-top-4',
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
  <div ref={ref} className={cn('flex flex-col space-y-2', className)} {...props} />
));
ConfirmDialogHeader.displayName = 'ConfirmDialogHeader';

const ConfirmDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
ConfirmDialogTitle.displayName = 'ConfirmDialogTitle';

const ConfirmDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
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

const ConfirmDialogClose = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    size="sm"
    className={cn('h-8 w-8 shrink-0', className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </Button>
));
ConfirmDialogClose.displayName = 'ConfirmDialogClose';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant,
}: ConfirmDialogProps) {
  return (
    <div
      className={cn(ConfirmDialogVariants(), variant)}
      style={{ visibility: open ? 'visible' : 'hidden' }}
    >
      {open && (
        <>
          <ConfirmDialogOverlay onClick={() => onOpenChange(false)} />
          <ConfirmDialogContent>
            <ConfirmDialogHeader>
              <ConfirmDialogTitle>{title}</ConfirmDialogTitle>
              <ConfirmDialogDescription>{description}</ConfirmDialogDescription>
            </ConfirmDialogHeader>
            <ConfirmDialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                {confirmLabel}
              </Button>
            </ConfirmDialogFooter>
            <ConfirmDialogClose onClick={() => onOpenChange(false)} />
          </ConfirmDialogContent>
        </>
      )}
    </div>
  );
}
