import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSearchParams } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { useCustomLogDatesWithData } from '@/hooks/useDatesWithData';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateNavigation } from '@/components/DateNavigation';
import { useDateNavigation } from '@/hooks/useDateNavigation';
import { useCustomLogTypes } from '@/hooks/useCustomLogTypes';
import { useCustomLogEntries } from '@/hooks/useCustomLogEntries';
import { useCustomLogEntriesForType } from '@/hooks/useCustomLogEntriesForType';
import { useAllMedicationEntries } from '@/hooks/useAllMedicationEntries';
import { CreateLogTypeDialog } from '@/components/CreateLogTypeDialog';
import { CreateMedicationDialog } from '@/components/CreateMedicationDialog';
import { LogTemplatePickerDialog } from '@/components/LogTemplatePickerDialog';
import { LogEntryInput } from '@/components/LogEntryInput';
import { MedicationEntryInput } from '@/components/MedicationEntryInput';
import { CustomLogEntryRow } from '@/components/CustomLogEntryRow';
import { CustomLogTypeView } from '@/components/CustomLogTypeView';
import { AllMedicationsView } from '@/components/AllMedicationsView';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { getStoredDate } from '@/lib/selected-date';
import { LOG_TEMPLATES, getTemplateUnit } from '@/lib/log-templates';
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

type ViewMode = 'date' | 'type' | 'medication';

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('custom-log-view-mode');
    if (stored === 'date' || stored === 'type' || stored === 'medication') return stored;
  } catch {}
  return 'date';
}

const OtherLogContent = ({ initialDate }: { initialDate: string }) => {
  const [, setSearchParams] = useSearchParams();
  const dateNav = useDateNavigation(initialDate, setSearchParams);
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [createMedicationOpen, setCreateMedicationOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedMedTypeId, setSelectedMedTypeId] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [editingEntry, setEditingEntry] = useState<import('@/hooks/useCustomLogEntries').CustomLogEntry | null>(null);
  const createNewClickedRef = useRef(false);
  const queryClient = useQueryClient();

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

  // Medication types and By Meds eligibility
  const medicationTypes = useMemo(
    () => logTypes.filter((t) => t.value_type === 'medication'),
    [logTypes]
  );
  const showMedView = medicationTypes.length >= 2;

  // Active type ID for the dialog (unified for By Type and By Meds modes)
  // Guard: if med view no longer qualifies, treat as 'date' for active type resolution
  const effectiveViewMode = viewMode === 'medication' && !showMedView ? 'date' : viewMode;
  const activeTypeId =
    viewMode === 'type' ? effectiveTypeId
    : viewMode === 'medication' ? selectedMedTypeId
    : null;

  // Type/Meds view data
  const {
    entries: typeEntries,
    isLoading: typeEntriesLoading,
    createEntry: createTypeEntry,
    deleteEntry: deleteTypeEntry,
  } = useCustomLogEntriesForType(activeTypeId);

  // All meds view data
  const medTypeIds = useMemo(() => medicationTypes.map((t) => t.id), [medicationTypes]);
  const { entries: allMedEntries, isLoading: allMedEntriesLoading, deleteEntry: deleteAllMedEntry } = useAllMedicationEntries(
    effectiveViewMode === 'medication' ? medTypeIds : [],
    dateStr
  );

  // Update mutation for editing medication entries
  const updateMedEntry = useMutation({
    mutationFn: async ({ id, numeric_value, logged_time, entry_notes }: {
      id: string;
      numeric_value: number | null;
      logged_time: string | null;
      entry_notes: string | null;
    }) => {
      const { error } = await supabase
        .from('custom_log_entries')
        .update({ numeric_value, logged_time, entry_notes })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries-all-meds'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries-for-type'] });
      queryClient.invalidateQueries({ queryKey: ['custom-log-entries', dateStr] });
      setEditingEntry(null);
    },
  });

  const editingLogType = editingEntry ? logTypes.find(t => t.id === editingEntry.log_type_id) : null;

  // Dialog type: derived from active view mode
  const dialogType =
    effectiveViewMode === 'medication'
      ? logTypes.find((t) => t.id === selectedMedTypeId)
      : selectedType;

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    setShowInput(false);
    try { localStorage.setItem('custom-log-view-mode', mode); } catch {}
  }

  const handleCreateType = (name: string, valueType: 'numeric' | 'text' | 'dual_numeric', unit?: string) => {
    createType.mutate({ name, value_type: valueType, unit: unit || null }, {
      onSuccess: (newType) => {
        setCreateTypeOpen(false);
        setSelectedTypeId(newType.id);
      },
    });
  };

  const hasLogTypes = !isLoading && sortedLogTypes.length > 0;

  // Today's entries for the selected medication (used in dialog)
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const todayMedEntries = typeEntries.filter((e) => e.logged_date === todayDateStr);

  return (
    <div className="space-y-4">
      {/* Top section: matches LogInput height on Food/Exercise pages */}
      <section className="min-h-[148px] flex flex-col justify-center space-y-3">
        {!isReadOnly && (
          <div className="flex items-center justify-start gap-2">
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
                    {showMedView && (
                      <SelectItem value="medication" className="pl-3 [&>span:first-child]:hidden">By Meds</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Right side: varies by mode */}
                {effectiveViewMode === 'medication' ? (
                  /* By Meds: Log New dropdown for medications only */
                  <Select
                    value=""
                    onValueChange={(val) => {
                      setSelectedMedTypeId(val);
                      setShowInputDialog(true);
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm font-medium w-auto bg-teal-500 text-white border-teal-500 hover:bg-teal-600 shrink-0">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Plus className="h-3 w-3 shrink-0" />
                        Log New
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {medicationTypes.map((mt) => (
                        <SelectItem key={mt.id} value={mt.id} className="pl-3 [&>span:first-child]:hidden">
                          {mt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : effectiveViewMode === 'type' ? (
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
                  /* By Date: "Add custom log" dropdown */
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
        {showInput && effectiveViewMode === 'date' && effectiveTypeId && selectedType && !isReadOnly && (
          selectedType.value_type === 'medication' ? (
            (() => {
              const inlineTodayEntries = entries.filter(e => e.log_type_id === selectedType.id && e.logged_date === todayDateStr);
              return (
                <MedicationEntryInput
                  label={selectedType.name}
                  unit={selectedType.unit}
                  description={selectedType.description}
                  defaultDose={selectedType.default_dose}
                  dosesPerDay={selectedType.doses_per_day}
                  doseTimes={selectedType.dose_times}
                  todayEntryCount={inlineTodayEntries.length}
                  todayLoggedTimes={inlineTodayEntries.map(e => e.logged_time).filter(Boolean) as string[]}
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
              );
            })()
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

      {effectiveViewMode === 'medication' ? (
        /* By Meds view body */
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
          <AllMedicationsView
            entries={allMedEntries}
            logTypes={logTypes}
            isLoading={allMedEntriesLoading}
            onDelete={(id) => deleteAllMedEntry.mutate(id)}
            onEdit={(entry) => setEditingEntry(entry)}
            isReadOnly={isReadOnly}
          />
        </>
      ) : effectiveViewMode === 'type' && selectedType ? (
        /* Type view body */
        <CustomLogTypeView
          logType={selectedType}
          entries={typeEntries}
          isLoading={typeEntriesLoading}
          onDelete={(id) => deleteTypeEntry.mutate(id)}
          onEdit={(entry) => setEditingEntry(entry)}
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

      {/* Entry form as modal dialog — used by both By Type and By Meds modes */}
      {dialogType && !isReadOnly && (
        <Dialog open={showInputDialog} onOpenChange={(open) => { if (!open) setShowInputDialog(false); }}>
          <DialogContent className="max-w-sm p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:hidden">
            {dialogType.value_type === 'medication' ? (
              <MedicationEntryInput
                label={dialogType.name}
                unit={dialogType.unit}
                description={dialogType.description}
                defaultDose={dialogType.default_dose}
                dosesPerDay={dialogType.doses_per_day}
                doseTimes={dialogType.dose_times}
                todayEntryCount={todayMedEntries.length}
                todayLoggedTimes={todayMedEntries.map(e => e.logged_time).filter(Boolean) as string[]}
                onSubmit={(params) => {
                  createTypeEntry.mutate({
                    log_type_id: dialogType.id,
                    unit: dialogType.unit || null,
                    ...params,
                  }, {
                    onSuccess: () => {
                      setShowInputDialog(false);
                      if (viewMode === 'medication') setSelectedMedTypeId(null);
                    },
                  });
                }}
                onCancel={() => {
                  setShowInputDialog(false);
                  if (viewMode === 'medication') setSelectedMedTypeId(null);
                }}
                isLoading={createTypeEntry.isPending}
              />
            ) : (
              <div className="rounded-lg border border-border bg-card p-3">
                <LogEntryInput
                  valueType={dialogType.value_type}
                  label={dialogType.name}
                  unit={dialogType.unit}
                  onSubmit={(params) => {
                    createTypeEntry.mutate({
                      log_type_id: dialogType.id,
                      unit: dialogType.unit || null,
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

      {/* Edit dialog — reuses MedicationEntryInput pre-filled with existing entry data */}
      {editingEntry && editingLogType && !isReadOnly && (
        <Dialog open={!!editingEntry} onOpenChange={(open) => { if (!open) setEditingEntry(null); }}>
          <DialogContent className="max-w-sm p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:hidden">
            <MedicationEntryInput
              label={editingLogType.name}
              unit={editingLogType.unit}
              description={editingLogType.description}
              defaultDose={editingLogType.default_dose}
              dosesPerDay={editingLogType.doses_per_day}
              doseTimes={editingLogType.dose_times}
              initialDose={editingEntry.numeric_value}
              initialTime={editingEntry.logged_time}
              initialNotes={editingEntry.entry_notes}
              todayEntryCount={todayMedEntries.length}
              todayLoggedTimes={todayMedEntries.map(e => e.logged_time).filter(Boolean) as string[]}
              onSubmit={(params) => {
                updateMedEntry.mutate({ id: editingEntry.id, ...params });
              }}
              onCancel={() => setEditingEntry(null)}
              isLoading={updateMedEntry.isPending}
            />
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
