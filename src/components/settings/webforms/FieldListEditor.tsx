'use client';

import { Plus } from 'lucide-react';
import { BuilderEditableField } from './types';
import FieldSettingsPanel from './FieldSettingsPanel';

interface FieldListEditorProps {
  fields: BuilderEditableField[];
  isDraft: boolean;
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<BuilderEditableField>) => void;
  onRemove: (index: number) => void;
}

export default function FieldListEditor({
  fields,
  isDraft,
  onAdd,
  onUpdate,
  onRemove,
}: FieldListEditorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Fields</h3>
        {isDraft && (
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Field
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No fields yet. Add your first field to start building this form.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <FieldSettingsPanel
              key={`${field.key || field.name || 'field'}-${index}`}
              field={field}
              index={index}
              isDraft={isDraft}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
