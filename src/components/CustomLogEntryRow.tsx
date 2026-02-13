import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

interface CustomLogEntryRowProps {
  entry: CustomLogEntry;
  typeName: string;
  valueType: string;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

export function CustomLogEntryRow({ entry, typeName, valueType, onDelete, isReadOnly }: CustomLogEntryRowProps) {
  const formatValue = () => {
    if (valueType === 'numeric') {
      return `${entry.numeric_value}${entry.unit ? ` ${entry.unit}` : ''}`;
    }
    if (valueType === 'text_numeric') {
      return `${entry.text_value}: ${entry.numeric_value}${entry.unit ? ` ${entry.unit}` : ''}`;
    }
    return entry.text_value || '';
  };

  return (
    <div className="flex items-center justify-between py-2 group">
      <span className="text-sm text-muted-foreground">{typeName}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm">{formatValue()}</span>
        {!isReadOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
