'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Archive,
  ExternalLink,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { WebFormDefinition, WebFormFieldDefinition, webFormsService } from '@/services/webFormsService';

type BuilderTab =
  | 'fields'
  | 'rules'
  | 'mappings'
  | 'layout'
  | 'theme'
  | 'policy'
  | 'assignment'
  | 'spamProtection';

interface EditableField extends WebFormFieldDefinition {
  _advancedJson: string;
}

const FIELD_TYPE_OPTIONS = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'datetime',
  'time',
  'select',
  'multi-select',
  'radio',
  'checkbox',
  'checkbox-group',
  'url',
  'file',
  'signature',
  'vin',
];

const BUILDER_TABS: Array<{ id: BuilderTab; label: string }> = [
  { id: 'fields', label: 'Fields' },
  { id: 'rules', label: 'Rules' },
  { id: 'mappings', label: 'Mappings' },
  { id: 'layout', label: 'Layout' },
  { id: 'theme', label: 'Theme' },
  { id: 'policy', label: 'Policy' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'spamProtection', label: 'Spam Protection' },
];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const prettyJson = (value: any, fallback: string) => {
  try {
    return JSON.stringify(value ?? JSON.parse(fallback), null, 2);
  } catch {
    return fallback;
  }
};

const parseJson = (value: string, fallback: any) => {
  if (!value.trim()) return fallback;
  return JSON.parse(value);
};

const toEditableField = (field: WebFormFieldDefinition, index: number): EditableField => {
  const advanced = {
    options: field.options ?? [],
    validation: field.validation ?? {},
    visibleWhen: field.visibleWhen ?? null,
    requiredWhen: field.requiredWhen ?? null,
    layout: field.layout ?? {},
    theme: field.theme ?? {},
    policy: field.policy ?? {},
    metadata: field.metadata ?? {},
  };

  return {
    ...field,
    key: field.key || field.name || `field_${index + 1}`,
    _advancedJson: JSON.stringify(advanced, null, 2),
  };
};

const fromEditableField = (field: EditableField): WebFormFieldDefinition => {
  const parsedAdvanced = parseJson(field._advancedJson || '{}', {});
  const { _advancedJson, ...rest } = field;
  return {
    ...rest,
    options: Array.isArray(parsedAdvanced?.options) ? parsedAdvanced.options : [],
    validation: parsedAdvanced?.validation && typeof parsedAdvanced.validation === 'object' ? parsedAdvanced.validation : {},
    visibleWhen: parsedAdvanced?.visibleWhen ?? null,
    requiredWhen: parsedAdvanced?.requiredWhen ?? null,
    layout: parsedAdvanced?.layout && typeof parsedAdvanced.layout === 'object' ? parsedAdvanced.layout : {},
    theme: parsedAdvanced?.theme && typeof parsedAdvanced.theme === 'object' ? parsedAdvanced.theme : {},
    policy: parsedAdvanced?.policy && typeof parsedAdvanced.policy === 'object' ? parsedAdvanced.policy : {},
    metadata: parsedAdvanced?.metadata && typeof parsedAdvanced.metadata === 'object' ? parsedAdvanced.metadata : {},
  };
};

export default function WebFormBuilderPage({ id }: { id: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [activeTab, setActiveTab] = useState<BuilderTab>('fields');
  const [form, setForm] = useState<WebFormDefinition | null>(null);
  const [versions, setVersions] = useState<WebFormDefinition[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    name: '',
    description: '',
    formKey: '',
    publicKey: '',
  });
  const [fields, setFields] = useState<EditableField[]>([]);
  const [sections, setSections] = useState<Record<BuilderTab, string>>({
    fields: '[]',
    rules: '[]',
    mappings: '{}',
    layout: '{}',
    theme: '{}',
    policy: '{}',
    assignment: '{}',
    spamProtection: '{}',
  });

  const isDraft = (form?.state || 'draft') === 'draft';

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedForm, fetchedVersions] = await Promise.all([
        webFormsService.getFormById(id),
        webFormsService.getFormVersions(id).catch(() => []),
      ]);

      setForm(fetchedForm);
      setVersions(fetchedVersions);
      setMetadata({
        title: String(fetchedForm.title || '').trim(),
        name: String(fetchedForm.name || '').trim(),
        description: String(fetchedForm.description || '').trim(),
        formKey: String(fetchedForm.formKey || '').trim(),
        publicKey: String(fetchedForm.publicKey || '').trim(),
      });
      setFields(
        (Array.isArray(fetchedForm.fields) ? fetchedForm.fields : []).map((field, index) =>
          toEditableField(field, index)
        )
      );
      setSections({
        fields: JSON.stringify(fetchedForm.fields || [], null, 2),
        rules: JSON.stringify(fetchedForm.rules || [], null, 2),
        mappings: JSON.stringify(fetchedForm.mappings || {}, null, 2),
        layout: JSON.stringify(fetchedForm.layout || {}, null, 2),
        theme: JSON.stringify(fetchedForm.theme || {}, null, 2),
        policy: JSON.stringify(fetchedForm.policy || {}, null, 2),
        assignment: JSON.stringify(fetchedForm.assignment || {}, null, 2),
        spamProtection: JSON.stringify(fetchedForm.spamProtection || {}, null, 2),
      });
    } catch (error) {
      console.error('Failed to load form:', error);
      showToast('Failed to load form builder data', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  useEffect(() => {
    setSections((prev) => ({
      ...prev,
      fields: prettyJson(
        fields.map((field) => {
          try {
            return fromEditableField(field);
          } catch {
            return field;
          }
        }),
        prev.fields
      ),
    }));
  }, [fields]);

  const runtimeUrl = useMemo(() => {
    if (!metadata.publicKey) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/forms/${encodeURIComponent(metadata.publicKey)}`;
    }
    return `/forms/${encodeURIComponent(metadata.publicKey)}`;
  }, [metadata.publicKey]);

  const addField = () => {
    const nextIndex = fields.length + 1;
    setFields((prev) => [
      ...prev,
      {
        key: `field_${nextIndex}`,
        name: `field_${nextIndex}`,
        label: `Field ${nextIndex}`,
        type: 'text',
        required: false,
        placeholder: '',
        helpText: '',
        defaultValue: '',
        sensitivityClass: 'public',
        targetField: '',
        _advancedJson: JSON.stringify(
          {
            options: [],
            validation: {},
            visibleWhen: null,
            requiredWhen: null,
            layout: {},
            theme: {},
            policy: {},
            metadata: {},
          },
          null,
          2
        ),
      },
    ]);
  };

  const updateField = (index: number, patch: Partial<EditableField>) => {
    setFields((prev) => prev.map((field, idx) => (idx === index ? { ...field, ...patch } : field)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const buildUpdatePayload = () => {
    const parsedFields = fields.map((field) => fromEditableField(field));

    return {
      title: metadata.title.trim(),
      name: metadata.name.trim() || metadata.title.trim(),
      description: metadata.description.trim(),
      formKey: metadata.formKey.trim() || slugify(metadata.title || metadata.name),
      publicKey: metadata.publicKey.trim() || slugify(metadata.title || metadata.name),
      fields: parsedFields,
      rules: parseJson(sections.rules, []),
      mappings: parseJson(sections.mappings, {}),
      layout: parseJson(sections.layout, {}),
      theme: parseJson(sections.theme, {}),
      policy: parseJson(sections.policy, {}),
      assignment: parseJson(sections.assignment, {}),
      spamProtection: parseJson(sections.spamProtection, {}),
    };
  };

  const saveDraft = async () => {
    if (!form) return;
    if (!isDraft) {
      showToast('Published/archived versions are immutable. Create a new draft version first.', 'warning');
      return;
    }

    try {
      setSaving(true);
      const payload = buildUpdatePayload();
      const updated = await webFormsService.updateForm(form._id, payload);
      setForm(updated);
      showToast('Draft saved', 'success');
      await loadFormData();
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      showToast(error?.message || 'Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!form) return;
    if (!isDraft) {
      showToast('Only draft versions can be published', 'warning');
      return;
    }

    try {
      setPublishing(true);
      await saveDraft();
      const published = await webFormsService.publishForm(form._id);
      setForm(published);
      showToast('Form published', 'success');
      await loadFormData();
    } catch (error: any) {
      console.error('Failed to publish form:', error);
      showToast(error?.message || 'Failed to publish form', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const archive = async () => {
    if (!form) return;
    try {
      setArchiving(true);
      const archived = await webFormsService.archiveForm(form._id);
      setForm(archived);
      showToast('Form archived', 'success');
      await loadFormData();
    } catch (error: any) {
      console.error('Failed to archive form:', error);
      showToast(error?.message || 'Failed to archive form', 'error');
    } finally {
      setArchiving(false);
    }
  };

  const createNextDraft = async () => {
    if (!form) return;
    try {
      setCreatingVersion(true);
      const next = await webFormsService.createNextVersion(form._id);
      showToast('New draft version created', 'success');
      router.push(`/settings/webforms/${next._id}`);
    } catch (error: any) {
      console.error('Failed to create draft version:', error);
      showToast(error?.message || 'Failed to create draft version', 'error');
    } finally {
      setCreatingVersion(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
        Loading form builder...
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-red-200 text-red-700 rounded-xl p-4">
          Unable to load this form definition.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {metadata.title || metadata.name || form.formKey || 'Untitled Form'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Public key: <span className="font-mono">{metadata.publicKey || '-'}</span> | Form key:{' '}
              <span className="font-mono">{metadata.formKey || '-'}</span> | Version v{form.versionNumber || 1}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadFormData}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </button>
            {runtimeUrl && (
              <Link
                href={runtimeUrl}
                target="_blank"
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Runtime
              </Link>
            )}
            {!isDraft && (
              <button
                type="button"
                onClick={createNextDraft}
                disabled={creatingVersion}
                className="px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 inline-flex items-center gap-2 disabled:opacity-60"
              >
                {creatingVersion ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                New Draft Version
              </button>
            )}
            {isDraft && (
              <>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  className="px-3 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={publish}
                  disabled={publishing}
                  className="px-3 py-2 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publish
                </button>
              </>
            )}
            {form.state !== 'archived' && (
              <button
                type="button"
                onClick={archive}
                disabled={archiving}
                className="px-3 py-2 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 inline-flex items-center gap-2 disabled:opacity-60"
              >
                {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                Archive
              </button>
            )}
          </div>
        </div>

        {!isDraft && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <p>
              This version is <strong>{form.state}</strong> and immutable. Create a new draft version to make changes.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm text-gray-700">
            Title
            <input
              value={metadata.title}
              disabled={!isDraft}
              onChange={(event) => setMetadata((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm text-gray-700">
            Internal Name
            <input
              value={metadata.name}
              disabled={!isDraft}
              onChange={(event) => setMetadata((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm text-gray-700">
            Form Key
            <input
              value={metadata.formKey}
              disabled={!isDraft}
              onChange={(event) => setMetadata((prev) => ({ ...prev, formKey: event.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm text-gray-700">
            Public Key
            <input
              value={metadata.publicKey}
              disabled={!isDraft}
              onChange={(event) => setMetadata((prev) => ({ ...prev, publicKey: event.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
            />
          </label>
        </div>
        <label className="text-sm text-gray-700 block">
          Description
          <textarea
            rows={3}
            value={metadata.description}
            disabled={!isDraft}
            onChange={(event) => setMetadata((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          />
        </label>
        {runtimeUrl && (
          <p className="text-xs text-gray-500">
            Runtime URL: <span className="font-mono">{runtimeUrl}</span>
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {BUILDER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'fields' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Fields</h3>
            {isDraft && (
              <button
                type="button"
                onClick={addField}
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
                <div key={`${field.key || field.name || 'field'}-${index}`} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Field {index + 1}: {field.label || field.key || 'Untitled'}
                    </h4>
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
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
                        onChange={(event) => updateField(index, { label: event.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Field Key
                      <input
                        value={field.key || ''}
                        disabled={!isDraft}
                        onChange={(event) => updateField(index, { key: event.target.value, name: event.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Type
                      <select
                        value={field.type || 'text'}
                        disabled={!isDraft}
                        onChange={(event) => updateField(index, { type: event.target.value })}
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
                        onChange={(event) => updateField(index, { targetField: event.target.value })}
                        placeholder="customer.name"
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Placeholder
                      <input
                        value={field.placeholder || ''}
                        disabled={!isDraft}
                        onChange={(event) => updateField(index, { placeholder: event.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Default Value
                      <input
                        value={field.defaultValue ?? ''}
                        disabled={!isDraft}
                        onChange={(event) => updateField(index, { defaultValue: event.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Sensitivity Class
                      <select
                        value={field.sensitivityClass || 'public'}
                        disabled={!isDraft}
                        onChange={(event) =>
                          updateField(index, {
                            sensitivityClass: event.target.value as EditableField['sensitivityClass'],
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
                        onChange={(event) => updateField(index, { required: event.target.checked })}
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
                      onChange={(event) => updateField(index, { helpText: event.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
                    />
                  </label>

                  <label className="text-sm text-gray-700 block mt-3">
                    Advanced JSON (options, validation, visibleWhen, requiredWhen, layout, theme, policy, metadata)
                    <textarea
                      rows={10}
                      value={field._advancedJson}
                      disabled={!isDraft}
                      onChange={(event) => updateField(index, { _advancedJson: event.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab !== 'fields' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">{activeTab}</h3>
          <p className="text-sm text-gray-600">
            This section maps directly to backend <code>{activeTab}</code> object.
          </p>
          <textarea
            rows={18}
            value={sections[activeTab]}
            disabled={!isDraft}
            onChange={(event) =>
              setSections((prev) => ({
                ...prev,
                [activeTab]: event.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Version History</h3>
        {versions.length === 0 ? (
          <p className="text-sm text-gray-500">No version history returned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">Version</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">State</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">Updated</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">Open</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version, index) => {
                  const versionId = String(version._id || version.id || version.versionId || '').trim();
                  return (
                    <tr key={`${versionId || 'version'}-${index}`} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-sm text-gray-800">v{version.versionNumber || index + 1}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">{version.state || 'draft'}</td>
                      <td className="px-3 py-2 text-sm text-gray-800">
                        {new Date(String(version.updatedAt || version.createdAt || Date.now())).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-800">
                        {versionId ? (
                          <Link
                            href={`/settings/webforms/${versionId}`}
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            Open
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
