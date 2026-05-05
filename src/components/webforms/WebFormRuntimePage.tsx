'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { webFormsService, WebFormCondition, WebFormFieldDefinition, WebFormRuntimeResponse } from '@/services/webFormsService';

type RuntimeValue = string | number | boolean | string[] | null;

const getPathValue = (obj: Record<string, any>, path: string): any => {
  if (!path) return undefined;
  return path
    .split('.')
    .filter(Boolean)
    .reduce((acc: any, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
};

const setPathValue = (obj: Record<string, any>, path: string, value: any) => {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) return;
  let current = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
};

const toArray = (value: any): any[] => (Array.isArray(value) ? value : [value]);

const evaluateOperator = (left: any, operator: string, right: any): boolean => {
  switch (operator) {
    case 'not_equals':
      return left !== right;
    case 'contains':
      return Array.isArray(left) ? left.includes(right) : String(left || '').includes(String(right || ''));
    case 'in':
      return Array.isArray(right) ? right.includes(left) : false;
    case 'not_in':
      return Array.isArray(right) ? !right.includes(left) : true;
    case 'gt':
      return Number(left) > Number(right);
    case 'gte':
      return Number(left) >= Number(right);
    case 'lt':
      return Number(left) < Number(right);
    case 'lte':
      return Number(left) <= Number(right);
    case 'exists':
      return left !== undefined && left !== null && String(left).trim() !== '';
    case 'not_exists':
      return left === undefined || left === null || String(left).trim() === '';
    case 'truthy':
      return Boolean(left);
    case 'falsy':
      return !left;
    case 'equals':
    default:
      return left === right;
  }
};

const evaluateCondition = (condition: WebFormCondition, values: Record<string, any>): boolean => {
  if (!condition || typeof condition !== 'object') return true;
  if (Array.isArray(condition.all) && condition.all.length > 0) {
    return condition.all.every((item) => evaluateCondition(item, values));
  }
  if (Array.isArray(condition.any) && condition.any.length > 0) {
    return condition.any.some((item) => evaluateCondition(item, values));
  }
  if (condition.not) {
    return !evaluateCondition(condition.not, values);
  }

  const fieldPath = condition.field || condition.targetField || '';
  if (!fieldPath) return true;

  const left = getPathValue(values, fieldPath) ?? values[fieldPath];
  const operator = String(condition.operator || 'equals').toLowerCase();
  return evaluateOperator(left, operator, condition.value);
};

const evaluateConditionSet = (
  condition: WebFormCondition | WebFormCondition[] | null | undefined,
  values: Record<string, any>
): boolean => {
  if (!condition) return true;
  return toArray(condition).every((item) => evaluateCondition(item, values));
};

const getFieldIdentity = (field: WebFormFieldDefinition, index: number): string =>
  String(field.key || field.name || `field_${index}`).trim();

const getFieldOptions = (field: WebFormFieldDefinition): Array<{ label: string; value: string }> => {
  const base = Array.isArray(field.options) ? field.options : [];
  return base
    .map((option) => ({
      label: String((option as any)?.label ?? (option as any)?.value ?? '').trim(),
      value: String((option as any)?.value ?? (option as any)?.label ?? '').trim(),
    }))
    .filter((option) => option.value);
};

const getDefaultValue = (field: WebFormFieldDefinition): RuntimeValue => {
  if (field.defaultValue !== undefined) return field.defaultValue as RuntimeValue;
  if (field.type === 'checkbox') return false;
  if (field.type === 'checkbox-group' || field.type === 'multi-select') return [];
  return '';
};

const validateField = (
  field: WebFormFieldDefinition,
  value: RuntimeValue,
  isRequired: boolean
): string | null => {
  const label = field.label || field.key || 'Field';
  const normalized = typeof value === 'string' ? value.trim() : value;

  if (isRequired) {
    const empty =
      normalized === '' ||
      normalized === null ||
      normalized === undefined ||
      (Array.isArray(normalized) && normalized.length === 0) ||
      (typeof normalized === 'boolean' && normalized === false);
    if (empty) return `${label} is required`;
  }

  const rules = field.validation || {};
  if (typeof normalized === 'string') {
    if (rules.minLength && normalized.length < Number(rules.minLength)) {
      return `${label} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && normalized.length > Number(rules.maxLength)) {
      return `${label} must be at most ${rules.maxLength} characters`;
    }
    if (rules.pattern) {
      try {
        const regex = new RegExp(String(rules.pattern));
        if (!regex.test(normalized)) {
          return rules.message || `${label} has an invalid format`;
        }
      } catch {
        // Ignore invalid pattern setup from metadata.
      }
    }
  }

  if (field.type === 'email' && typeof normalized === 'string' && normalized) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) return `${label} must be a valid email`;
  }

  if (field.type === 'number' && normalized !== '' && normalized !== null) {
    const num = Number(normalized);
    if (!Number.isFinite(num)) return `${label} must be a number`;
    if (rules.min !== undefined && num < Number(rules.min)) return `${label} must be at least ${rules.min}`;
    if (rules.max !== undefined && num > Number(rules.max)) return `${label} must be at most ${rules.max}`;
  }

  return null;
};

export default function WebFormRuntimePage({ formKey }: { formKey: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<WebFormRuntimeResponse | null>(null);
  const [values, setValues] = useState<Record<string, RuntimeValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [honeypotValue, setHoneypotValue] = useState('');

  useEffect(() => {
    const loadRuntimeForm = async () => {
      try {
        setLoading(true);
        setError(null);
        const runtimeForm = await webFormsService.getRuntimeForm(formKey);
        setForm(runtimeForm);

        const nextValues: Record<string, RuntimeValue> = {};
        (runtimeForm.fields || []).forEach((field, index) => {
          const identity = getFieldIdentity(field, index);
          nextValues[identity] = getDefaultValue(field);
        });
        setValues(nextValues);
      } catch (runtimeError: any) {
        console.error('Failed to load runtime form:', runtimeError);
        setError(runtimeError?.message || 'Unable to load form');
      } finally {
        setLoading(false);
      }
    };

    loadRuntimeForm();
  }, [formKey]);

  const themeStyles = useMemo(() => {
    const theme = form?.theme || {};
    const primaryColor = String((theme as any).primaryColor || '#2563eb');
    const submitLabel = String((theme as any).submitLabel || 'Submit');
    return { primaryColor, submitLabel };
  }, [form]);

  const visibleFields = useMemo(() => {
    const source = Array.isArray(form?.fields) ? form?.fields : [];
    return source.filter((field) => evaluateConditionSet(field.visibleWhen, values));
  }, [form?.fields, values]);

  const onFieldChange = (field: WebFormFieldDefinition, index: number, nextValue: RuntimeValue) => {
    const identity = getFieldIdentity(field, index);
    setValues((prev) => ({ ...prev, [identity]: nextValue }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[identity];
      return next;
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    const nextErrors: Record<string, string> = {};

    visibleFields.forEach((field, index) => {
      const identity = getFieldIdentity(field, index);
      const required = Boolean(field.required) || evaluateConditionSet(field.requiredWhen, values);
      const validationError = validateField(field, values[identity], required);
      if (validationError) {
        nextErrors[identity] = validationError;
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    if (honeypotValue.trim()) {
      setError('Submission rejected');
      return;
    }

    const targetPayload: Record<string, any> = {};
    visibleFields.forEach((field, index) => {
      const identity = getFieldIdentity(field, index);
      const fieldValue = values[identity];
      if (field.targetField) {
        setPathValue(targetPayload, field.targetField, fieldValue);
      }
    });

    try {
      setSubmitting(true);
      setError(null);
      await webFormsService.submitRuntimeForm(formKey, {
        values,
        targetPayload,
        correlationId: `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
        metadata: {
          publicKey: form.publicKey,
          formKey: form.formKey,
          versionNumber: form.versionNumber,
        },
      });
      const policySuccessMessage = String((form.policy as any)?.successMessage || '').trim();
      setSuccessMessage(policySuccessMessage || 'Thank you. Your response has been submitted.');
    } catch (submitError: any) {
      console.error('Failed to submit runtime form:', submitError);
      setError(submitError?.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading form...
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg bg-white rounded-xl border border-red-200 p-6 text-red-700">
          {error || 'Form not found'}
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-xl bg-white rounded-2xl border border-emerald-200 p-8 text-center">
          <h1 className="text-2xl font-semibold text-emerald-700">Submission Received</h1>
          <p className="text-gray-700 mt-3">{successMessage}</p>
        </div>
      </div>
    );
  }

  const honeypotFieldName = String(
    (form.spamProtection as any)?.honeypotField ||
      (form.policy as any)?.honeypotField ||
      'company_website'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{form.title || form.name || 'Web Form'}</h1>
          {form.description && <p className="text-gray-600 mt-2">{form.description}</p>}
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="hidden" aria-hidden>
            <label htmlFor={honeypotFieldName}>Leave this field empty</label>
            <input
              id={honeypotFieldName}
              name={honeypotFieldName}
              value={honeypotValue}
              onChange={(event) => setHoneypotValue(event.target.value)}
              autoComplete="off"
              tabIndex={-1}
            />
          </div>

          {visibleFields.map((field, index) => {
            const identity = getFieldIdentity(field, index);
            const required = Boolean(field.required) || evaluateConditionSet(field.requiredWhen, values);
            const value = values[identity];
            const options = getFieldOptions(field);
            const sharedInputClass =
              'mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

            return (
              <div key={identity} className="space-y-1">
                <label className="text-sm font-medium text-gray-800 block" htmlFor={identity}>
                  {field.label || identity}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}

                {['text', 'email', 'phone', 'number', 'date', 'time', 'datetime', 'url'].includes(field.type) && (
                  <input
                    id={identity}
                    name={identity}
                    type={
                      field.type === 'phone'
                        ? 'tel'
                        : field.type === 'datetime'
                        ? 'datetime-local'
                        : field.type
                    }
                    value={String(value ?? '')}
                    placeholder={field.placeholder || ''}
                    onChange={(event) => onFieldChange(field, index, event.target.value)}
                    className={sharedInputClass}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    id={identity}
                    name={identity}
                    rows={4}
                    value={String(value ?? '')}
                    placeholder={field.placeholder || ''}
                    onChange={(event) => onFieldChange(field, index, event.target.value)}
                    className={sharedInputClass}
                  />
                )}

                {(field.type === 'select' || field.type === 'multi-select') && (
                  <select
                    id={identity}
                    name={identity}
                    multiple={field.type === 'multi-select'}
                    value={
                      field.type === 'multi-select'
                        ? (Array.isArray(value) ? value.map((item) => String(item)) : [])
                        : String(value ?? '')
                    }
                    onChange={(event) => {
                      if (field.type === 'multi-select') {
                        const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                        onFieldChange(field, index, selected);
                      } else {
                        onFieldChange(field, index, event.target.value);
                      }
                    }}
                    className={sharedInputClass}
                  >
                    {field.type === 'select' && <option value="">Select...</option>}
                    {options.map((option) => (
                      <option key={`${identity}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'radio' && (
                  <div className="space-y-2 mt-1">
                    {options.map((option) => (
                      <label key={`${identity}-${option.value}`} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={identity}
                          value={option.value}
                          checked={String(value ?? '') === option.value}
                          onChange={(event) => onFieldChange(field, index, event.target.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => onFieldChange(field, index, event.target.checked)}
                    />
                    {field.placeholder || 'Yes'}
                  </label>
                )}

                {field.type === 'checkbox-group' && (
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
                              } else {
                                const next = current.filter((item) => item !== option.value);
                                onFieldChange(field, index, next);
                                return;
                              }
                              onFieldChange(field, index, current);
                            }}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                )}

                {fieldErrors[identity] && <p className="text-xs text-red-600">{fieldErrors[identity]}</p>}
              </div>
            );
          })}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-60 inline-flex items-center gap-2"
              style={{ backgroundColor: themeStyles.primaryColor }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {themeStyles.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
