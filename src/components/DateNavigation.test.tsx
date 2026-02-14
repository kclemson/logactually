import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateNavigation } from './DateNavigation';

// Mock the UI components to keep tests focused
vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="calendar" />,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

const baseProps = {
  calendarOpen: false,
  onCalendarOpenChange: vi.fn(),
  calendarMonth: new Date(2025, 0, 15),
  onCalendarMonthChange: vi.fn(),
  onPreviousDay: vi.fn(),
  onNextDay: vi.fn(),
  onDateSelect: vi.fn(),
  onGoToToday: vi.fn(),
  datesWithData: [],
  highlightClassName: 'text-blue-600 font-semibold',
};

describe('DateNavigation', () => {
  it('renders "Today" format when isTodaySelected is true', () => {
    render(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date()}
        isTodaySelected={true}
      />
    );
    expect(screen.getByText(/Today,/)).toBeInTheDocument();
  });

  it('renders weekday format for past dates', () => {
    render(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date(2025, 0, 6)} // Monday Jan 6
        isTodaySelected={false}
      />
    );
    expect(screen.getByText(/Mon, Jan 6/)).toBeInTheDocument();
  });

  it('disables next-day button when on today', () => {
    render(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date()}
        isTodaySelected={true}
      />
    );
    const nextButton = screen.getByLabelText('Next day');
    expect(nextButton).toBeDisabled();
  });

  it('shows "Go to today" link only when not on today', () => {
    const { rerender } = render(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date()}
        isTodaySelected={true}
      />
    );
    expect(screen.queryByText('Go to today')).not.toBeInTheDocument();

    rerender(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date(2025, 0, 6)}
        isTodaySelected={false}
      />
    );
    expect(screen.getByText('Go to today')).toBeInTheDocument();
  });

  it('calls onPreviousDay on click', async () => {
    const onPreviousDay = vi.fn();
    render(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date(2025, 0, 6)}
        isTodaySelected={false}
        onPreviousDay={onPreviousDay}
      />
    );
    await userEvent.click(screen.getByLabelText('Previous day'));
    expect(onPreviousDay).toHaveBeenCalledOnce();
  });

  it('calls onGoToToday when external link is clicked', async () => {
    const onGoToToday = vi.fn();
    render(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date(2025, 0, 6)}
        isTodaySelected={false}
        onGoToToday={onGoToToday}
      />
    );
    await userEvent.click(screen.getByText('Go to today'));
    expect(onGoToToday).toHaveBeenCalledOnce();
  });

  it('"Go to today" elements use foreground color, not accent', () => {
    render(
      <DateNavigation
        {...baseProps}
        selectedDate={new Date(2025, 0, 6)}
        isTodaySelected={false}
      />
    );
    const goToTodayLink = screen.getByText('Go to today');
    expect(goToTodayLink.className).toContain('text-foreground');
    expect(goToTodayLink.className).not.toContain('text-primary');
    expect(goToTodayLink.className).not.toContain('text-blue');
    expect(goToTodayLink.className).not.toContain('text-teal');
  });
});

