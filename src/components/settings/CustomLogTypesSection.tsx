import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { CustomLogTypeRow } from '@/components/CustomLogTypeRow';
import { LogTemplatePickerDialog } from '@/components/LogTemplatePickerDialog';
import { CreateLogTypeDialog } from '@/components/CreateLogTypeDialog';
import { CreateMedicationDialog } from '@/components/CreateMedicationDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomLogTypes, type ValueType } from '@/hooks/useCustomLogTypes';
import { useUserSettings } from '@/hooks/useUserSettings';
import { resolveFocusedTypeId, FOCUSED_NONE } from '@/lib/focused-type';

interface CustomLogTypesSectionProps {
  isReadOnly: boolean;
}

export function CustomLogTypesSection({ isReadOnly }: CustomLogTypesSectionProps) {
  const { logTypes, isLoading: logTypesLoading, createType, updateType, deleteType } = useCustomLogTypes();
  const { settings, updateSettings } = useUserSettings();
  const [openLogTypePopoverId, setOpenLogTypePopoverId] = useState<string | null>(null);
  const [createLogTypeDialogOpen, setCreateLogTypeDialogOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [createMedicationOpen, setCreateMedicationOpen] = useState(false);

  // The select reflects the effective featured type (derived when unset) so the
  // user always sees what's currently featured; 'none' means explicitly off.
  const focusedSelectValue = resolveFocusedTypeId(settings.defaultFocusedTypeId, logTypes) ?? FOCUSED_NONE;

  return (
    <>
      <CollapsibleSection title="Custom Log Types" icon={ClipboardList} storageKey="settings-custom-types" iconClassName="text-teal-500 dark:text-teal-400">
        {!isReadOnly && (
          <button
            onClick={() => setTemplatePickerOpen(true)}
            className="w-full text-left py-2 hover:bg-accent/50 transition-colors flex items-center gap-2 text-sm text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Log Type</span>
          </button>
        )}
        {logTypesLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !logTypes.length ? (
          !isReadOnly ? null : <p className="text-sm text-muted-foreground">No custom types yet</p>
        ) : (
          <ul className="space-y-0">
            {logTypes.map((lt) => (
              <CustomLogTypeRow
                key={lt.id}
                type={lt}
                onRename={(id, name) => updateType.mutate({ id, name })}
                onUpdateUnit={(id, unit) => updateType.mutate({ id, unit })}
                onUpdateDescription={(id, description) => updateType.mutate({ id, description })}
                onUpdateMedication={(id, params) => updateType.mutate({ id, ...params })}
                onDelete={(id) => deleteType.mutate(id)}
                openDeletePopoverId={openLogTypePopoverId}
                setOpenDeletePopoverId={setOpenLogTypePopoverId}
                existingNames={logTypes.map(t => t.name)}
              />
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {templatePickerOpen && (
        <LogTemplatePickerDialog
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          onSelectTemplate={(template) => {
            createType.mutate({ name: template.name, value_type: template.value_type as ValueType, unit: template.unit ?? undefined }, {
              onSuccess: () => setTemplatePickerOpen(false),
            });
          }}
          onSelectTemplates={(items) => {
            const createNext = (index: number) => {
              if (index >= items.length) {
                setTemplatePickerOpen(false);
                return;
              }
              const p = items[index];
              createType.mutate({ name: p.name, value_type: p.value_type as ValueType, unit: p.unit ?? undefined }, {
                onSuccess: () => createNext(index + 1),
              });
            };
            createNext(0);
          }}
          onCreateCustom={() => {
            setTemplatePickerOpen(false);
            setCreateLogTypeDialogOpen(true);
          }}
          onSelectMedication={() => {
            setTemplatePickerOpen(false);
            setCreateMedicationOpen(true);
          }}
          isLoading={createType.isPending}
          existingNames={logTypes.map(t => t.name)}
        />
      )}

      {createLogTypeDialogOpen && (
        <CreateLogTypeDialog
          open={createLogTypeDialogOpen}
          onOpenChange={setCreateLogTypeDialogOpen}
          onSubmit={(name, valueType) => {
            createType.mutate({ name, value_type: valueType }, {
              onSuccess: () => setCreateLogTypeDialogOpen(false),
            });
          }}
          isLoading={createType.isPending}
          existingNames={logTypes.map(t => t.name)}
        />
      )}

      {createMedicationOpen && (
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
            onSuccess: () => setCreateMedicationOpen(false),
          });
        }}
          isLoading={createType.isPending}
          existingNames={logTypes.map(t => t.name)}
        />
      )}
    </>
  );
}
