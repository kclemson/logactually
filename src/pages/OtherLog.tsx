import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSearchParams } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { useCustomLogDatesWithData } from '@/hooks/useDatesWithData';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateNavigation } from '@/components/DateNavigation';
import { useDateNavigation } from '@/hooks/useDateNavigation';
import { useCustomLogTypes } from '@/hooks/useCustomLogTypes';
import { useCustomLogEntries } from '@/hooks/useCustomLogEntries';
import { useCustomLogEntriesForType } from '@/hooks/useCustomLogEntriesForType';
import { CreateLogTypeDialog } from '@/components/CreateLogTypeDialog';
import { CreateMedicationDialog } from '@/components/CreateMedicationDialog';
import { LogTemplatePickerDialog } from '@/components/LogTemplatePickerDialog';
import { LogEntryInput } from '@/components/LogEntryInput';
import { MedicationEntryInput } from '@/components/MedicationEntryInput';
import { CustomLogEntryRow } from '@/components/CustomLogEntryRow';
import { CustomLogTypeView } from '@/components/CustomLogTypeView';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { getStoredDate, setStoredDate } from '@/lib/selected-date';
import { LOG_TEMPLATES, MEASUREMENT_TEMPLATES, getTemplateUnit } from '@/lib/log-templates';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Button } from '@/components/ui/button';

// Wrapper: extracts date from URL, forces remount via key
const OtherLog = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateKey = dateParam || getStoredDate() || format(new Date(), 'yyyy-MM-dd');
  return <OtherLogContent key={dateKey} initialDate={dateKey} />;
};

export default OtherLog;

type ViewMode = 'date' | 'type';

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('custom-log-view-mode');
    if (stored === 'date' || stored === 'type') return stored;
  } catch {}
  return 'date';
}

const OtherLogContent = ({ initialDate }: { initialDate: string }) => {
  const [, setSearchParams] = useSearchParams();
  const dateNav = useDateNavigation(initialDate, setSearchParams);
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [createMedicationOpen, setCreateMedicationOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const createNewClickedRef = useRef(false);

  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);

  const { logTypes, isLoading, createType, recentUsage } = useCustomLogTypes();
  const { entries, createEntry, updateEntry, deleteEntry } = useCustomLogEntries(dateStr);
  const { data: datesWithData = [] } = useCustomLogDatesWithData(dateNav.calendarMonth);
  const { isReadOnly } = useReadOnlyContext();
  const { settings } = useUserSettings();

  // Sort log types by most recent usage (most recent first), then by creation order
  const sortedLogTypes = useMemo(() => {
    return [...logTypes].sort((a, b) => {
      const aRecent = recentUsage[a.id];
      const bRecent = recentUsage[b.id];
      if (aRecent && bRecent) return bRecent.localeCompare(aRecent);
      if (aRecent) return -1;
      if (bRecent) return 1;
      return a.created_at.localeCompare(b.created_at);
    });
  }, [logTypes, recentUsage]);

  const effectiveTypeId = selectedTypeId ?? sortedLogTypes[0]?.id ?? null;
  const selectedType = logTypes.find((t) => t.id === effectiveTypeId);

  // Type view data
  const {
    entries: typeEntries,
    isLoading: typeEntriesLoading,
    createEntry: createTypeEntry,
    deleteEntry: deleteTypeEntry,
  } = useCustomLogEntriesForType(viewMode === 'type' ? effectiveTypeId : null);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setShowInput(false);
    try { localStorage.setItem('custom-log-view-mode', mode); } catch {}
  };

  const handleCreateType = (name: string, valueType: 'numeric' | 'text' | 'dual_numeric', unit?: string) => {
    createType.mutate({ name, value_type: valueType, unit: unit || null }, {
      onSuccess: (newType) => {
        setCreateTypeOpen(false);
        setSelectedTypeId(newType.id);
      },
    });
  };

  const hasLogTypes = !isLoading && sortedLogTypes.length > 0;

  return (
    <div className="space-y-4">
      {/* Top section: matches LogInput height on Food/Exercise pages */}
      <section className="min-h-[148px] flex flex-col justify-center space-y-3">
        {!isReadOnly && (
          <div className="flex items-center justify-center gap-2">
            {!isLoading && sortedLogTypes.length === 0 ? (
              /* Onboarding: no log types yet */
              <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-2 w-full">
                  {LOG_TEMPLATES.filter(t => !t.group).map((t) => (
                    <button
                      key={t.name}
                      disabled={createType.isPending}
                      onClick={() => {
                        const unit = getTemplateUnit(t, settings.weightUnit);
                        createType.mutate({ name: t.name, value_type: t.valueType, unit }, {
                          onSuccess: (newType) => setSelectedTypeId(newType.id),
                        });
                      }}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50 text-left"
                    >
                      <span className="font-medium">{t.name}</span>
                    </button>
                  ))}
                  {/* Body Measurement group button */}
                  <button
                    disabled={createType.isPending}
                    onClick={() => setTemplatePickerOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50 text-left"
                  >
                    <span className="font-medium">Body Measurement</span>
                  </button>
                </div>
                <button
                  onClick={() => setCreateTypeOpen(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create your own
                </button>
              </div>
            ) : (
              /* Has log types: stable view-mode select + mode-specific controls */
              <>
                {/* Always-stable view-mode select — never unmounts on mode switch */}
                <Select value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)}>
                  <SelectTrigger className="h-8 text-sm px-2 w-[90px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date" className="pl-3 [&>span:first-child]:hidden">By Date</SelectItem>
                    <SelectItem value="type" className="pl-3 [&>span:first-child]:hidden">By Type</SelectItem>
                  </SelectContent>
                </Select>

                {/* Right side: varies by mode */}
                {viewMode === 'type' ? (
                  <>
                    <Select
                      value={effectiveTypeId || ''}
                      onValueChange={(val) => {
                        setSelectedTypeId(val);
                        setShowInput(false);
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm px-2 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedLogTypes.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id} className="pl-3 [&>span:first-child]:hidden">
                            {lt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedType && (
                      <Button
                        size="sm"
                        className="h-8 bg-teal-500 hover:bg-teal-600 text-white border-teal-500 gap-1"
                        onClick={() => setShowInputDialog(true)}
                      >
                        <Plus className="h-3 w-3" />
                        Log New
                      </Button>
                    )}
                  </>
                ) : (
                  <Select
                    value={effectiveTypeId || ''}
                    onValueChange={(val) => {
                      if (val === '__create_new__') {
                        createNewClickedRef.current = true;
                        setTemplatePickerOpen(true);
                      } else {
                        setSelectedTypeId(val);
                      }
                    }}
                    onOpenChange={(open) => {
                      if (!open && effectiveTypeId && !createNewClickedRef.current) {
                        setShowInput(true);
                      }
                      createNewClickedRef.current = false;
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm font-medium w-auto min-w-[140px] bg-teal-500 text-white border-teal-500 hover:bg-teal-600">
                      <span>Add custom log</span>
                    </SelectTrigger>
                    <SelectContent>
                      {sortedLogTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id} className="pl-3 [&>span:first-child]:hidden">
                          Log {lt.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__create_new__" className="pl-3 [&>span:first-child]:hidden text-primary">
                        <span className="flex items-center gap-1.5">
                          <Plus className="h-3 w-3" />
                          New Custom Log Type
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </div>
        )}

        {/* Inline input form — By Date mode only */}
        {showInput && viewMode === 'date' && effectiveTypeId && selectedType && !isReadOnly && (
          selectedType.value_type === 'medication' ? (
            <MedicationEntryInput
              label={selectedType.name}
              unit={selectedType.unit}
              description={selectedType.description}
              defaultDose={selectedType.default_dose}
              dosesPerDay={selectedType.doses_per_day}
              doseTimes={selectedType.dose_times}
              todayEntryCount={entries.filter(e => e.log_type_id === selectedType.id).length}
              onSubmit={(params) => {
                createEntry.mutate({
                  log_type_id: selectedType.id,
                  logged_date: dateStr,
                  unit: selectedType.unit || null,
                  ...params,
                }, {
                  onSuccess: () => setShowInput(false),
                });
              }}
              onCancel={() => setShowInput(false)}
              isLoading={createEntry.isPending}
            />
          ) : (
            <LogEntryInput
              valueType={selectedType.value_type}
              label={selectedType.name}
              unit={selectedType.unit}
              onSubmit={(params) => {
                createEntry.mutate({
                  log_type_id: selectedType.id,
                  logged_date: dateStr,
                  unit: selectedType.unit || null,
                  ...params,
                }, {
                  onSuccess: () => setShowInput(false),
                });
              }}
              onCancel={() => setShowInput(false)}
              isLoading={createEntry.isPending}
            />
          )
        )}
      </section>

      {viewMode === 'type' && selectedType ? (
        /* Type view body */
        <CustomLogTypeView
          logType={selectedType}
          entries={typeEntries}
          isLoading={typeEntriesLoading}
          onDelete={(id) => deleteTypeEntry.mutate(id)}
          isReadOnly={isReadOnly}
        />
      ) : (
        /* Date view body */
        <>
          <DateNavigation
            selectedDate={selectedDate}
            isTodaySelected={isTodaySelected}
            calendarOpen={dateNav.calendarOpen}
            onCalendarOpenChange={dateNav.setCalendarOpen}
            calendarMonth={dateNav.calendarMonth}
            onCalendarMonthChange={dateNav.setCalendarMonth}
            onPreviousDay={dateNav.goToPreviousDay}
            onNextDay={dateNav.goToNextDay}
            onDateSelect={dateNav.handleDateSelect}
            onGoToToday={dateNav.goToToday}
            datesWithData={datesWithData}
            highlightClassName="text-teal-600 dark:text-teal-400 font-semibold"
            weekStartDay={settings.weekStartDay}
          />

          {/* Entries grouped by log type */}
          <div className="space-y-3">
            {entries.length > 0 ? (
              (() => {
                const groups: { typeId: string; items: typeof entries }[] = [];
                const seen = new Map<string, number>();
                for (const entry of entries) {
                  const idx = seen.get(entry.log_type_id);
                  if (idx !== undefined) {
                    groups[idx].items.push(entry);
                  } else {
                    seen.set(entry.log_type_id, groups.length);
                    groups.push({ typeId: entry.log_type_id, items: [entry] });
                  }
                }
                return groups.map((group) => {
                  const logType = logTypes.find((t) => t.id === group.typeId);
                  return (
                    <div key={group.typeId} className="space-y-0">
                      <div className="text-center py-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {logType?.name || 'Unknown'}
                        </span>
                      </div>
                      {group.items.map((entry) => (
                        <CustomLogEntryRow
                          key={entry.id}
                          entry={entry}
                          typeName={logType?.name || ''}
                          valueType={logType?.value_type || 'text'}
                          typeUnit={logType?.unit}
                          onDelete={(id) => deleteEntry.mutate(id)}
                          onUpdate={(params) => updateEntry.mutate(params)}
                          isReadOnly={isReadOnly}
                        />
                      ))}
                    </div>
                  );
                });
              })()
            ) : (
              <div className="text-center text-muted-foreground py-8">No custom log items for this day</div>
            )}
          </div>
        </>
      )}

      {/* By Type: entry form as modal dialog */}
      {selectedType && !isReadOnly && (
        <Dialog open={showInputDialog} onOpenChange={(open) => { if (!open) setShowInputDialog(false); }}>
          <DialogContent className="max-w-sm p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:hidden">
            {selectedType.value_type === 'medication' ? (
              <MedicationEntryInput
                label={selectedType.name}
                unit={selectedType.unit}
                description={selectedType.description}
                defaultDose={selectedType.default_dose}
                dosesPerDay={selectedType.doses_per_day}
                doseTimes={selectedType.dose_times}
                todayEntryCount={typeEntries.filter(e => e.logged_date === format(new Date(), 'yyyy-MM-dd')).length}
                onSubmit={(params) => {
                  createTypeEntry.mutate({
                    log_type_id: selectedType.id,
                    unit: selectedType.unit || null,
                    ...params,
                  }, {
                    onSuccess: () => setShowInputDialog(false),
                  });
                }}
                onCancel={() => setShowInputDialog(false)}
                isLoading={createTypeEntry.isPending}
              />
            ) : (
              <div className="rounded-lg border border-border bg-card p-3">
                <LogEntryInput
                  valueType={selectedType.value_type}
                  label={selectedType.name}
                  unit={selectedType.unit}
                  onSubmit={(params) => {
                    createTypeEntry.mutate({
                      log_type_id: selectedType.id,
                      unit: selectedType.unit || null,
                      ...params,
                    }, {
                      onSuccess: () => setShowInputDialog(false),
                    });
                  }}
                  onCancel={() => setShowInputDialog(false)}
                  isLoading={createTypeEntry.isPending}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <CreateLogTypeDialog
        open={createTypeOpen}
        onOpenChange={setCreateTypeOpen}
        onSubmit={handleCreateType}
        isLoading={createType.isPending}
        existingNames={logTypes.map(t => t.name)}
      />
      <CreateMedicationDialog
        open={createMedicationOpen}
        onOpenChange={setCreateMedicationOpen}
        onSubmit={(params) => {
          createType.mutate({
            name: params.name,
            value_type: 'medication',
            unit: params.unit,
            default_dose: params.default_dose,
            doses_per_day: params.doses_per_day,
            dose_times: params.dose_times,
            description: params.description,
          }, {
            onSuccess: (newType) => {
              setCreateMedicationOpen(false);
              setSelectedTypeId(newType.id);
            },
          });
        }}
        isLoading={createType.isPending}
        existingNames={logTypes.map(t => t.name)}
      />
      <LogTemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelectTemplate={(params) => {
          createType.mutate({ name: params.name, value_type: params.value_type as any, unit: params.unit }, {
            onSuccess: (newType) => {
              setTemplatePickerOpen(false);
              setSelectedTypeId(newType.id);
            },
          });
        }}
        onSelectTemplates={(items) => {
          let lastId: string | null = null;
          const createNext = (index: number) => {
            if (index >= items.length) {
              setTemplatePickerOpen(false);
              if (lastId) setSelectedTypeId(lastId);
              return;
            }
            const p = items[index];
            createType.mutate({ name: p.name, value_type: p.value_type as any, unit: p.unit }, {
              onSuccess: (newType) => {
                lastId = newType.id;
                createNext(index + 1);
              },
            });
          };
          createNext(0);
        }}
        onCreateCustom={() => {
          setTemplatePickerOpen(false);
          setCreateTypeOpen(true);
        }}
        onSelectMedication={() => {
          setTemplatePickerOpen(false);
          setCreateMedicationOpen(true);
        }}
        isLoading={createType.isPending}
        existingNames={logTypes.map(t => t.name)}
      />
    </div>
  );
};
