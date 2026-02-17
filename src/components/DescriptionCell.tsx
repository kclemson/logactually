import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DescriptionCellProps {
  value: string;
  onSave: (newValue: string) => void;
  readOnly?: boolean;
  onReadOnlyAttempt?: () => void;
  className?: string;
  title?: string;
  validate?: (newValue: string) => boolean;
  onValidationFail?: () => void;
  children?: ReactNode;
}

export function DescriptionCell({
  value,
  onSave,
  readOnly = false,
  onReadOnlyAttempt,
  className,
  title,
  validate,
  onValidationFail,
  children,
}: DescriptionCellProps) {
  const originalRef = useRef(value);

  return (
    <>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        spellCheck={false}
        title={title}
        ref={(el) => {
          if (el && el.textContent !== value && document.activeElement !== el) {
            el.textContent = value;
          }
        }}
        onFocus={() => {
          originalRef.current = value;
        }}
        onBlur={(e) => {
          if (readOnly) {
            e.currentTarget.textContent = originalRef.current;
            return;
          }
          const newValue = (e.currentTarget.textContent || '').trim();
          if (!newValue) {
            e.currentTarget.textContent = originalRef.current;
            return;
          }
          if (newValue === originalRef.current) return;
          if (validate && !validate(newValue)) {
            e.currentTarget.textContent = originalRef.current;
            onValidationFail?.();
            return;
          }
          onSave(newValue);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (readOnly) {
              onReadOnlyAttempt?.();
              e.currentTarget.textContent = originalRef.current;
              (e.target as HTMLElement).blur();
              return;
            }
            (e.target as HTMLElement).blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.currentTarget.textContent = originalRef.current;
            (e.target as HTMLElement).blur();
          }
        }}
        className={cn(
          "border-0 bg-transparent focus:outline-none cursor-text hover:bg-muted/50",
          className
        )}
      />
      {children}
    </>
  );
}
