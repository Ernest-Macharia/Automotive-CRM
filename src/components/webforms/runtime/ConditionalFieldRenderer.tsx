'use client';

import { Plus, Trash2 } from 'lucide-react';
import { WebFormFieldDefinition } from '@/services/webFormsService';

interface RepeaterColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  options?: Array<{ label: string; value: string }>;
}

interface ConditionalFieldRendererProps {
  field: WebFormFieldDefinition;
  identity: string;
  value: any;
  required: boolean;
  error?: string;
  onChange: (value: any) => void;
}

const normalizeFieldType = (rawType: string | undefined): string => {
  const type = String(rawType || 'text').toLowerCase();
  if (type === 'long_text') return 'textarea';
  if (type === 'multiselect') return 'multi-select';
  return type;
};

const getFieldOptions = (field: WebFormFieldDefinition): Array<{ label: string; value: string }> => {
  const base = Array.isArray(field.options) ? field.options : [];
  return base
    .map((option) => ({
      label: String((option as any)?.label ?? (option as any)?.value ?? '').trim(),
      value: String((option as any)?.value ?? (option as any)?.label ?? '').trim(),
    }))
    .filter((option) => option.value);
};

const getRepeaterColumns = (fieldType: string): RepeaterColumn[] => {
  switch (fieldType) {
    case 'parts_repeater':
      return [
        { key: 'partName', label: 'Part Name' },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'unitPrice', label: 'Unit Price', type: 'number' },
      ];
    case 'labor_repeater':
      return [
        { key: 'description', label: 'Task Description', type: 'textarea' },
        { key: 'hours', label: 'Hours', type: 'number' },
        { key: 'rate', label: 'Rate', type: 'number' },
      ];
    case 'inspection_checklist':
      return [
        { key: 'item', label: 'Inspection Item' },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'OK', value: 'ok' },
            { label: 'Fault', value: 'fault' },
            { label: 'N/A', value: 'n/a' },
          ],
        },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ];
    case 'photo_capture_block':
      return [
        { key: 'url', label: 'Image URL' },
        { key: 'caption', label: 'Caption' },
      ];
    default:
      return [];
  }
};

const createEmptyRepeaterRow = (columns: RepeaterColumn[]): Record<string, any> => {
  const row: Record<string, any> = {};
  columns.forEach((column) => {
    row[column.key] = column.type === 'number' ? 0 : '';
  });
  return row;
};

export default function ConditionalFieldRenderer({
  field,
  identity,
  value,
  required,
  error,
  onChange,
}: ConditionalFieldRendererProps) {
  const fieldType = normalizeFieldType(field.type);
  const options = getFieldOptions(field);
  const sharedInputClass =
    'mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const validation = field.validation || {};

  const numberStep =
    fieldType === 'currency' || fieldType === 'percentage' || fieldType === 'rating'
      ? '0.01'
      : 'any';
  const numberMin =
    validation.min ??
    (fieldType === 'percentage' ? 0 : fieldType === 'rating' ? 0 : undefined);
  const numberMax =
    validation.max ??
    (fieldType === 'percentage' ? 100 : fieldType === 'rating' ? 5 : undefined);

  const isRepeater = [
    'parts_repeater',
    'labor_repeater',
    'inspection_checklist',
    'photo_capture_block',
  ].includes(fieldType);

  const renderRepeater = () => {
    const columns = getRepeaterColumns(fieldType);
    const rows = Array.isArray(value) ? value : [];

    const addRow = () => onChange([...rows, createEmptyRepeaterRow(columns)]);
    const removeRow = (rowIndex: number) =>
      onChange(rows.filter((_: any, index: number) => index !== rowIndex));
    const updateRowValue = (
      rowIndex: number,
      columnKey: string,
      nextValue: string | number
    ) => {
      const nextRows = rows.map((row: any, index: number) =>
        index === rowIndex ? { ...(row || {}), [columnKey]: nextValue } : row
      );
      onChange(nextRows);
    };

    return (
      <div className="mt-2 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            No rows yet.
          </div>
        ) : (
          rows.map((row: any, rowIndex: number) => (
            <div key={`${identity}-row-${rowIndex}`} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Row {rowIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(rowIndex)}
                  className="text-red-600 hover:bg-red-50 rounded-md px-2 py-1 inline-flex items-center gap-1 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {columns.map((column) => {
                  const rowValue = row?.[column.key] ?? '';
                  if (column.type === 'textarea') {
                    return (
                      <label key={`${identity}-${column.key}`} className="text-sm text-gray-700">
                        {column.label}
                        <textarea
                          value={String(rowValue)}
                          onChange={(event) =>
                            updateRowValue(rowIndex, column.key, event.target.value)
                          }
                          rows={3}
                          className={sharedInputClass}
                        />
                      </label>
                    );
                  }

                  if (column.type === 'select') {
                    return (
                      <label key={`${identity}-${column.key}`} className="text-sm text-gray-700">
                        {column.label}
                        <select
                          value={String(rowValue)}
                          onChange={(event) =>
                            updateRowValue(rowIndex, column.key, event.target.value)
                          }
                          className={sharedInputClass}
                        >
                          <option value="">Select...</option>
                          {(column.options || []).map((option) => (
                            <option key={`${column.key}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }

                  return (
                    <label key={`${identity}-${column.key}`} className="text-sm text-gray-700">
                      {column.label}
                      <input
                        type={column.type === 'number' ? 'number' : 'text'}
                        value={String(rowValue)}
                        onChange={(event) =>
                          updateRowValue(
                            rowIndex,
                            column.key,
                            column.type === 'number'
                              ? Number(event.target.value || 0)
                              : event.target.value
                          )
                        }
                        className={sharedInputClass}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={addRow}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-800 block" htmlFor={identity}>
        {field.label || identity}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}

      {['text', 'email', 'phone', 'date', 'time', 'datetime', 'url'].includes(fieldType) && (
        <input
          id={identity}
          name={identity}
          type={
            fieldType === 'phone'
              ? 'tel'
              : fieldType === 'datetime'
              ? 'datetime-local'
              : fieldType
          }
          value={String(value ?? '')}
          placeholder={field.placeholder || ''}
          onChange={(event) => onChange(event.target.value)}
          className={sharedInputClass}
        />
      )}

      {['number', 'currency', 'percentage', 'rating', 'odometer'].includes(fieldType) && (
        <input
          id={identity}
          name={identity}
          type="number"
          step={numberStep}
          min={numberMin}
          max={numberMax}
          value={String(value ?? '')}
          placeholder={field.placeholder || ''}
          onChange={(event) => onChange(event.target.value)}
          className={sharedInputClass}
        />
      )}

      {fieldType === 'textarea' && (
        <textarea
          id={identity}
          name={identity}
          rows={4}
          value={String(value ?? '')}
          placeholder={field.placeholder || ''}
          onChange={(event) => onChange(event.target.value)}
          className={sharedInputClass}
        />
      )}

      {(fieldType === 'select' || fieldType === 'multi-select') && (
        <select
          id={identity}
          name={identity}
          multiple={fieldType === 'multi-select'}
          value={
            fieldType === 'multi-select'
              ? (Array.isArray(value) ? value.map((item) => String(item)) : [])
              : String(value ?? '')
          }
          onChange={(event) => {
            if (fieldType === 'multi-select') {
              const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
              onChange(selected);
            } else {
              onChange(event.target.value);
            }
          }}
          className={sharedInputClass}
        >
          {fieldType === 'select' && <option value="">Select...</option>}
          {options.map((option) => (
            <option key={`${identity}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {fieldType === 'radio' && (
        <div className="space-y-2 mt-1">
          {options.map((option) => (
            <label key={`${identity}-${option.value}`} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={identity}
                value={option.value}
                checked={String(value ?? '') === option.value}
                onChange={(event) => onChange(event.target.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {fieldType === 'checkbox' && (
        <label className="flex items-center gap-2 text-sm text-gray-700 mt-1">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          {field.placeholder || 'Yes'}
        </label>
      )}

      {fieldType === 'checkbox-group' && (
        <div className="space-y-2 mt-1">
          {options.map((option) => {
            const checked = Array.isArray(value) ? value.includes(option.value) : false;
            return (
              <label key={`${identity}-${option.value}`} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const current = Array.isArray(value) ? [...value] : [];
                    if (event.target.checked) {
                      if (!current.includes(option.value)) current.push(option.value);
                      onChange(current);
                      return;
                    }
                    onChange(current.filter((item) => item !== option.value));
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      )}

      {isRepeater && renderRepeater()}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
