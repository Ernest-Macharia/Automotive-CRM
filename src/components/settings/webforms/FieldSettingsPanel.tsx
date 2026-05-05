'use client';

import { Trash2 } from 'lucide-react';
import { BuilderEditableField } from './types';

const FIELD_TYPE_OPTIONS = [
  'text',
  'long_text',
  'textarea',
  'email',
  'phone',
  'number',
  'currency',
  'percentage',
  'rating',
  'odometer',
  'date',
  'datetime',
  'time',
  'select',
  'multiselect',
  'multi-select',
  'radio',
  'checkbox',
  'checkbox-group',
  'url',
  'vin',
  'parts_repeater',
  'labor_repeater',
  'inspection_checklist',
  'photo_capture_block',
];

interface FieldSettingsPanelProps {
  field: BuilderEditableField;
  index: number;
  isDraft: boolean;
  onUpdate: (index: number, patch: Partial<BuilderEditableField>) => void;
  onRemove: (index: number) => void;
}

export default function FieldSettingsPanel({
  field,
  index,
  isDraft,
  onUpdate,
  onRemove,
}: FieldSettingsPanelProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">
          Field {index + 1}: {field.label || field.key || 'Untitled'}
        </h4>
        {isDraft && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="px-2 py-1 rounded-md text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm text-gray-700">
          Label
          <input
            value={field.label || ''}
            disabled={!isDraft}
            onChange={(event) => onUpdate(index, { label: event.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          />
        </label>
        <label className="text-sm text-gray-700">
          Field Key
          <input
            value={field.key || ''}
            disabled={!isDraft}
            onChange={(event) =>
              onUpdate(index, { key: event.target.value, name: event.target.value })
            }
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          />
        </label>
        <label className="text-sm text-gray-700">
          Type
          <select
            value={field.type || 'text'}
            disabled={!isDraft}
            onChange={(event) => onUpdate(index, { type: event.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          >
            {FIELD_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Target Field Path
          <input
            value={field.targetField || ''}
            disabled={!isDraft}
            onChange={(event) => onUpdate(index, { targetField: event.target.value })}
            placeholder="customer.name"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          />
        </label>
        <label className="text-sm text-gray-700">
          Placeholder
          <input
            value={field.placeholder || ''}
            disabled={!isDraft}
            onChange={(event) => onUpdate(index, { placeholder: event.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          />
        </label>
        <label className="text-sm text-gray-700">
          Default Value
          <input
            value={field.defaultValue ?? ''}
            disabled={!isDraft}
            onChange={(event) => onUpdate(index, { defaultValue: event.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          />
        </label>
        <label className="text-sm text-gray-700">
          Sensitivity Class
          <select
            value={field.sensitivityClass || 'public'}
            disabled={!isDraft}
            onChange={(event) =>
              onUpdate(index, {
                sensitivityClass: event.target.value as BuilderEditableField['sensitivityClass'],
              })
            }
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          >
            <option value="public">public</option>
            <option value="internal">internal</option>
            <option value="sensitive">sensitive</option>
            <option value="restricted">restricted</option>
          </select>
        </label>
        <label className="text-sm text-gray-700 flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            checked={Boolean(field.required)}
            disabled={!isDraft}
            onChange={(event) => onUpdate(index, { required: event.target.checked })}
          />
          Required by default
        </label>
      </div>

      <label className="text-sm text-gray-700 block mt-3">
        Help Text
        <textarea
          rows={2}
          value={field.helpText || ''}
          disabled={!isDraft}
          onChange={(event) => onUpdate(index, { helpText: event.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
        />
      </label>

      <label className="text-sm text-gray-700 block mt-3">
        Advanced JSON (options, validation, visibleWhen, requiredWhen, layout, theme, policy, metadata)
        <textarea
          rows={10}
          value={field._advancedJson}
          disabled={!isDraft}
          onChange={(event) => onUpdate(index, { _advancedJson: event.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
        />
      </label>
    </div>
  );
}
