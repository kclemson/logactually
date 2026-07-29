import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface LogDatePickerProps {
  date: string;
  onChange: (date: string) => void;
  label?: string;
}

export function LogDatePicker({ date, onChange, label }: LogDatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseISO(date);

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 justify-start text-left font-normal px-2"
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{format(parsed, 'MMM d, yyyy')}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsed}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, 'yyyy-MM-dd'));
                setOpen(false);
              }
            }}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
