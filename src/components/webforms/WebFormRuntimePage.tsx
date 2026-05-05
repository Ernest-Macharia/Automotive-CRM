'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  getWebFormErrorDetails,
  getWebFormErrorMessage,
  webFormsService,
  WebFormCondition,
  WebFormFieldDefinition,
  WebFormRuntimeResponse,
} from '@/services/webFormsService';
import RuntimeFormRenderer, {
  RuntimeLayoutSection,
} from '@/components/webforms/runtime/RuntimeFormRenderer';

type RuntimeValue = string | number | boolean | string[] | Record<string, any>[] | null;

interface VisibleFieldEntry {
  field: WebFormFieldDefinition;
  identity: string;
}

const normalizeFieldType = (rawType: string | undefined): string => {
  const type = String(rawType || 'text').toLowerCase();
  if (type === 'long_text') return 'textarea';
  if (type === 'multiselect') return 'multi-select';
  return type;
};

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
      return Array.isArray(left)
        ? left.includes(right)
        : String(left || '').includes(String(right || ''));
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

const getDefaultValue = (field: WebFormFieldDefinition): RuntimeValue => {
  if (field.defaultValue !== undefined) return field.defaultValue as RuntimeValue;
  const fieldType = normalizeFieldType(field.type);
  if (fieldType === 'checkbox') return false;
  if (
    ['checkbox-group', 'multi-select', 'parts_repeater', 'labor_repeater', 'inspection_checklist', 'photo_capture_block'].includes(
      fieldType
    )
  ) {
    return [];
  }
  return '';
};

const validateField = (
  field: WebFormFieldDefinition,
  value: RuntimeValue,
  isRequired: boolean
): string | null => {
  const label = field.label || field.key || 'Field';
  const fieldType = normalizeFieldType(field.type);
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

  if (fieldType === 'email' && typeof normalized === 'string' && normalized) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) return `${label} must be a valid email`;
  }

  if (
    ['number', 'currency', 'percentage', 'rating', 'odometer'].includes(fieldType) &&
    normalized !== '' &&
    normalized !== null
  ) {
    const num = Number(normalized);
    if (!Number.isFinite(num)) return `${label} must be a number`;
    if (rules.min !== undefined && num < Number(rules.min)) return `${label} must be at least ${rules.min}`;
    if (rules.max !== undefined && num > Number(rules.max)) return `${label} must be at most ${rules.max}`;
  }

  return null;
};

const buildLayoutSections = (
  layout: Record<string, any> | undefined,
  visibleEntries: VisibleFieldEntry[]
): RuntimeLayoutSection[] => {
  const rawSections = Array.isArray((layout as any)?.sections) ? (layout as any).sections : [];
  const byKey = new Map<string, VisibleFieldEntry>();
  visibleEntries.forEach((entry) => {
    byKey.set(entry.identity, entry);
    if (entry.field.key) byKey.set(String(entry.field.key).trim(), entry);
    if (entry.field.name) byKey.set(String(entry.field.name).trim(), entry);
  });

  const usedIdentities = new Set<string>();
  const sections: RuntimeLayoutSection[] = [];

  rawSections.forEach((rawSection: any, index: number) => {
    const keyList = Array.isArray(rawSection?.fields)
      ? rawSection.fields
      : Array.isArray(rawSection?.fieldKeys)
      ? rawSection.fieldKeys
      : [];
    const entries = keyList
      .map((rawKey: any) => byKey.get(String(rawKey || '').trim()))
      .filter((item: VisibleFieldEntry | undefined): item is VisibleFieldEntry => Boolean(item));

    if (entries.length === 0) return;

    entries.forEach((entry) => usedIdentities.add(entry.identity));
    sections.push({
      id: String(rawSection?.id || rawSection?.key || `section_${index + 1}`),
      title: rawSection?.title ? String(rawSection.title) : undefined,
      description: rawSection?.description ? String(rawSection.description) : undefined,
      columns: Number(rawSection?.columns || rawSection?.columnCount || 1),
      fields: entries.map((entry) => ({ field: entry.field, identity: entry.identity })),
    });
  });

  const remaining = visibleEntries.filter((entry) => !usedIdentities.has(entry.identity));
  if (remaining.length > 0) {
    sections.push({
      id: 'remaining_fields',
      title: sections.length > 0 ? 'Additional Details' : undefined,
      fields: remaining.map((entry) => ({ field: entry.field, identity: entry.identity })),
      columns: 1,
    });
  }

  if (sections.length === 0) {
    return [
      {
        id: 'default',
        fields: visibleEntries.map((entry) => ({ field: entry.field, identity: entry.identity })),
        columns: 1,
      },
    ];
  }

  return sections;
};

export default function WebFormRuntimePage({ formKey }: { formKey: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submissionCorrelationId, setSubmissionCorrelationId] = useState<string>('');
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
        setError(getWebFormErrorMessage(runtimeError, 'Unable to load form'));
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

  const visibleFieldEntries = useMemo(() => {
    const source = Array.isArray(form?.fields) ? form.fields : [];
    return source
      .map((field, index) => ({ field, identity: getFieldIdentity(field, index) }))
      .filter((entry) => evaluateConditionSet(entry.field.visibleWhen, values));
  }, [form?.fields, values]);

  const visibleFieldIdentitySet = useMemo(
    () => new Set(visibleFieldEntries.map((entry) => entry.identity)),
    [visibleFieldEntries]
  );

  const layoutSections = useMemo(
    () => buildLayoutSections(form?.layout, visibleFieldEntries),
    [form?.layout, visibleFieldEntries]
  );

  const isFieldRequired = useMemo(
    () => (field: WebFormFieldDefinition) =>
      Boolean(field.required) || evaluateConditionSet(field.requiredWhen, values),
    [values]
  );

  const onFieldChange = (field: WebFormFieldDefinition, identity: string, nextValue: RuntimeValue) => {
    setValues((prev) => ({ ...prev, [identity]: nextValue }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[identity];
      return next;
    });
  };

  const applyServerFieldErrors = (submitError: any) => {
    const details = getWebFormErrorDetails(submitError);
    if (!details || typeof details !== 'object') return;

    const rawFieldErrors =
      details.errors && typeof details.errors === 'object'
        ? details.errors
        : details.fieldErrors && typeof details.fieldErrors === 'object'
        ? details.fieldErrors
        : null;

    if (!rawFieldErrors) return;

    const mappedErrors: Record<string, string> = {};
    const visibleByAlias = new Map<string, string>();

    visibleFieldEntries.forEach((entry) => {
      visibleByAlias.set(entry.identity, entry.identity);
      if (entry.field.key) visibleByAlias.set(String(entry.field.key).trim(), entry.identity);
      if (entry.field.name) visibleByAlias.set(String(entry.field.name).trim(), entry.identity);
    });

    Object.entries(rawFieldErrors).forEach(([rawKey, rawValue]) => {
      const targetKey = visibleByAlias.get(String(rawKey).trim());
      if (!targetKey) return;
      const message =
        typeof rawValue === 'string'
          ? rawValue
          : Array.isArray(rawValue)
          ? rawValue.map((item) => String(item)).join(', ')
          : String((rawValue as any)?.message || rawValue || '');
      if (!message) return;
      mappedErrors[targetKey] = message;
    });

    if (Object.keys(mappedErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    const nextErrors: Record<string, string> = {};

    visibleFieldEntries.forEach(({ field, identity }) => {
      const required = isFieldRequired(field);
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
    visibleFieldEntries.forEach(({ field, identity }) => {
      const fieldValue = values[identity];
      if (field.targetField) {
        setPathValue(targetPayload, field.targetField, fieldValue);
      }
    });

    const generatedCorrelationId = `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

    try {
      setSubmitting(true);
      setError(null);
      setFieldErrors((prev) => {
        const next: Record<string, string> = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (!visibleFieldIdentitySet.has(key)) return;
          next[key] = value;
        });
        return next;
      });

      const response = await webFormsService.submitRuntimeForm(formKey, {
        values,
        targetPayload,
        correlationId: generatedCorrelationId,
        metadata: {
          publicKey: form.publicKey,
          formKey: form.formKey,
          versionNumber: form.versionNumber,
        },
      });

      const backendMessage = String(response?.message || '').trim();
      const policySuccessMessage = String((form.policy as any)?.successMessage || '').trim();
      const resolvedCorrelationId = String(
        response?.correlationId ||
          response?.submission?.correlationId ||
          generatedCorrelationId
      ).trim();

      setSubmissionCorrelationId(resolvedCorrelationId);
      setSuccessMessage(
        backendMessage || policySuccessMessage || 'Thank you. Your response has been submitted.'
      );
    } catch (submitError: any) {
      console.error('Failed to submit runtime form:', submitError);
      applyServerFieldErrors(submitError);
      setError(getWebFormErrorMessage(submitError, 'Failed to submit form'));
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
          {submissionCorrelationId && (
            <p className="text-xs text-gray-500 mt-3">
              Correlation ID: <span className="font-mono">{submissionCorrelationId}</span>
            </p>
          )}
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

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

          <RuntimeFormRenderer
            sections={layoutSections}
            values={values}
            fieldErrors={fieldErrors}
            isFieldRequired={(field) => isFieldRequired(field)}
            onFieldChange={onFieldChange}
          />

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
