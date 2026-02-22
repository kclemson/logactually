import { useState } from 'react';
import { format, addDays, subDays, parseISO, startOfMonth } from 'date-fns';
import { SetURLSearchParams } from 'react-router-dom';
import { setStoredDate } from '@/lib/selected-date';

export function useDateNavigation(initialDate: string, setSearchParams: SetURLSearchParams) {
  const selectedDate = parseISO(initialDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(selectedDate));

  const goToPreviousDay = () => {
    const prevDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
    setStoredDate(prevDate);
    setSearchParams({ date: prevDate }, { replace: true });
  };

  const goToNextDay = () => {
    const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setStoredDate(nextDate);
    if (nextDate === todayStr) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date: nextDate }, { replace: true });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const d = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setStoredDate(d);
    if (d === todayStr) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date: d }, { replace: true });
    }
    setCalendarOpen(false);
  };

  const goToToday = () => {
    setStoredDate(format(new Date(), 'yyyy-MM-dd'));
    setSearchParams({}, { replace: true });
  };

  return {
    calendarOpen,
    setCalendarOpen,
    calendarMonth,
    setCalendarMonth,
    goToPreviousDay,
    goToNextDay,
    handleDateSelect,
    goToToday,
  };
}
