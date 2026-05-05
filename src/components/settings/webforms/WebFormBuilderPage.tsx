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
  RefreshCw,
  Save,
  Send,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  getWebFormErrorMessage,
  WebFormDefinition,
  WebFormFieldDefinition,
  webFormsService,
} from '@/services/webFormsService';
import FieldListEditor from '@/components/settings/webforms/FieldListEditor';
import VersionTimeline from '@/components/settings/webforms/VersionTimeline';
import WebformBuilderShell from '@/components/settings/webforms/WebformBuilderShell';
import { BuilderEditableField } from '@/components/settings/webforms/types';

type BuilderTab =
  | 'structure'
  | 'fields'
  | 'mappings'
  | 'theme'
  | 'policies'
  | 'versions';

const BUILDER_TABS: Array<{ id: BuilderTab; label: string }> = [
  { id: 'structure', label: 'Structure' },
  { id: 'fields', label: 'Fields' },
  { id: 'mappings', label: 'Mappings' },
  { id: 'theme', label: 'Theme' },
  { id: 'policies', label: 'Policies' },
  { id: 'versions', label: 'Versions' },
];

const TARGET_MODULE_OPTIONS = [
  { value: 'submissions', label: 'Submissions Only' },
  { value: 'opportunities', label: 'Create Opportunity' },
  { value: 'contacts', label: 'Create Contact' },
];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const parseJsonSafe = (value: string, fallback: any) => {
  if (!value.trim()) return fallback;
  return JSON.parse(value);
};

const toEditableField = (
  field: WebFormFieldDefinition,
  index: number
): BuilderEditableField => {
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

const fromEditableField = (field: BuilderEditableField): WebFormFieldDefinition => {
  const parsedAdvanced = parseJsonSafe(field._advancedJson || '{}', {});
  const { _advancedJson, ...rest } = field;
  return {
    ...rest,
    options: Array.isArray(parsedAdvanced?.options) ? parsedAdvanced.options : [],
    validation:
      parsedAdvanced?.validation && typeof parsedAdvanced.validation === 'object'
        ? parsedAdvanced.validation
        : {},
    visibleWhen: parsedAdvanced?.visibleWhen ?? null,
    requiredWhen: parsedAdvanced?.requiredWhen ?? null,
    layout:
      parsedAdvanced?.layout && typeof parsedAdvanced.layout === 'object'
        ? parsedAdvanced.layout
        : {},
    theme:
      parsedAdvanced?.theme && typeof parsedAdvanced.theme === 'object'
        ? parsedAdvanced.theme
        : {},
    policy:
      parsedAdvanced?.policy && typeof parsedAdvanced.policy === 'object'
        ? parsedAdvanced.policy
        : {},
    metadata:
      parsedAdvanced?.metadata && typeof parsedAdvanced.metadata === 'object'
        ? parsedAdvanced.metadata
        : {},
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
  const [activeTab, setActiveTab] = useState<BuilderTab>('structure');
  const [form, setForm] = useState<WebFormDefinition | null>(null);
  const [versions, setVersions] = useState<WebFormDefinition[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    name: '',
    description: '',
    formKey: '',
    publicKey: '',
  });
  const [targetModule, setTargetModule] = useState('submissions');
  const [fields, setFields] = useState<BuilderEditableField[]>([]);
  const [sections, setSections] = useState({
    rules: '[]',
    mappings: '{}',
    layout: '{}',
    theme: '{}',
    policy: '{}',
    assignment: '{}',
    spamProtection: '{}',
  });

  const isDraft = (form?.state || 'draft') === 'draft';
  const currentVersionId = String(form?._id || form?.id || form?.versionId || '').trim();

  const existingDraftVersion = useMemo(() => {
    return versions.find((version) => {
      const versionId = String(version._id || version.id || version.versionId || '').trim();
      return version.state === 'draft' && versionId && versionId !== currentVersionId;
    });
  }, [versions, currentVersionId]);

  const runtimeUrl = useMemo(() => {
    if (!metadata.publicKey) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/forms/${encodeURIComponent(metadata.publicKey)}`;
    }
    return `/forms/${encodeURIComponent(metadata.publicKey)}`;
  }, [metadata.publicKey]);

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedForm, fetchedVersions] = await Promise.all([
        webFormsService.getFormById(id),
        webFormsService.getFormVersions(id).catch(() => []),
      ]);

      const mappings =
        fetchedForm.mappings && typeof fetchedForm.mappings === 'object'
          ? fetchedForm.mappings
          : {};

      setForm(fetchedForm);
      setVersions(fetchedVersions);
      setMetadata({
        title: String(fetchedForm.title || '').trim(),
        name: String(fetchedForm.name || '').trim(),
        description: String(fetchedForm.description || '').trim(),
        formKey: String(fetchedForm.formKey || '').trim(),
        publicKey: String(fetchedForm.publicKey || '').trim(),
      });
      setTargetModule(
        String((mappings as any).targetModule || (fetchedForm as any).targetModule || 'submissions')
      );
      setFields(
        (Array.isArray(fetchedForm.fields) ? fetchedForm.fields : []).map((field, index) =>
          toEditableField(field, index)
        )
      );
      setSections({
        rules: JSON.stringify(fetchedForm.rules || [], null, 2),
        mappings: JSON.stringify(mappings, null, 2),
        layout: JSON.stringify(fetchedForm.layout || {}, null, 2),
        theme: JSON.stringify(fetchedForm.theme || {}, null, 2),
        policy: JSON.stringify(fetchedForm.policy || {}, null, 2),
        assignment: JSON.stringify(fetchedForm.assignment || {}, null, 2),
        spamProtection: JSON.stringify(fetchedForm.spamProtection || {}, null, 2),
      });
    } catch (error) {
      console.error('Failed to load form:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to load form builder data'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

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

  const updateField = (index: number, patch: Partial<BuilderEditableField>) => {
    setFields((prev) => prev.map((field, idx) => (idx === index ? { ...field, ...patch } : field)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const buildUpdatePayload = () => {
    const parsedFields = fields.map((field) => fromEditableField(field));
    const parsedMappings = parseJsonSafe(sections.mappings, {});
    const normalizedMappings =
      parsedMappings && typeof parsedMappings === 'object' ? parsedMappings : {};

    return {
      title: metadata.title.trim(),
      name: metadata.name.trim() || metadata.title.trim(),
      description: metadata.description.trim(),
      formKey: metadata.formKey.trim() || slugify(metadata.title || metadata.name),
      publicKey: metadata.publicKey.trim() || slugify(metadata.title || metadata.name),
      fields: parsedFields,
      rules: parseJsonSafe(sections.rules, []),
      mappings: {
        ...normalizedMappings,
        targetModule,
      },
      layout: parseJsonSafe(sections.layout, {}),
      theme: parseJsonSafe(sections.theme, {}),
      policy: parseJsonSafe(sections.policy, {}),
      assignment: parseJsonSafe(sections.assignment, {}),
      spamProtection: parseJsonSafe(sections.spamProtection, {}),
    };
  };

  const saveDraft = async (): Promise<boolean> => {
    if (!form) return false;
    if (!isDraft) {
      showToast(
        'Published/archived versions are immutable. Create a new draft version first.',
        'warning'
      );
      return false;
    }

    try {
      setSaving(true);
      const payload = buildUpdatePayload();
      const updated = await webFormsService.updateForm(form._id, payload);
      setForm(updated);
      showToast('Draft saved', 'success');
      await loadFormData();
      return true;
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      const message = error instanceof SyntaxError
        ? 'Invalid JSON in one of the sections. Fix formatting and try again.'
        : getWebFormErrorMessage(error, 'Failed to save draft');
      showToast(message, 'error');
      return false;
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
      const saved = await saveDraft();
      if (!saved) return;

      const published = await webFormsService.publishForm(form._id);
      setForm(published);
      showToast('Form published', 'success');
      await loadFormData();
    } catch (error: any) {
      console.error('Failed to publish form:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to publish form'), 'error');
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
      showToast(getWebFormErrorMessage(error, 'Failed to archive form'), 'error');
    } finally {
      setArchiving(false);
    }
  };

  const createNextDraft = async () => {
    if (!form) return;
    if (existingDraftVersion) {
      const existingDraftId = String(
        existingDraftVersion._id ||
          existingDraftVersion.id ||
          existingDraftVersion.versionId ||
          ''
      ).trim();
      if (existingDraftId) {
        showToast('A draft version already exists. Opening that draft.', 'warning');
        router.push(`/settings/webforms/${existingDraftId}`);
        return;
      }
    }

    try {
      setCreatingVersion(true);
      const next = await webFormsService.createNextVersion(form._id);
      showToast('New draft version created', 'success');
      router.push(`/settings/webforms/${next._id}`);
    } catch (error: any) {
      console.error('Failed to create draft version:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to create draft version'), 'error');
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

  const builderActions = (
    <>
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
      {!isDraft &&
        (existingDraftVersion ? (
          <Link
            href={`/settings/webforms/${String(
              existingDraftVersion._id ||
                existingDraftVersion.id ||
                existingDraftVersion.versionId ||
                ''
            ).trim()}`}
            className="px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 inline-flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Open Draft
          </Link>
        ) : (
          <button
            type="button"
            onClick={createNextDraft}
            disabled={creatingVersion}
            className="px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 inline-flex items-center gap-2 disabled:opacity-60"
          >
            {creatingVersion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitBranch className="h-4 w-4" />
            )}
            Create Draft Version
          </button>
        ))}
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
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
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
          {archiving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          Archive
        </button>
      )}
    </>
  );

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <WebformBuilderShell
        title={metadata.title || metadata.name || form.formKey || 'Untitled Form'}
        subtitle={`Public key: ${metadata.publicKey || '-'} | Form key: ${
          metadata.formKey || '-'
        } | Version v${form.versionNumber || 1} (${form.state || 'draft'})`}
        tabs={BUILDER_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as BuilderTab)}
        actions={builderActions}
      />

      {!isDraft && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <p>
            This version is <strong>{form.state}</strong> and immutable. Create a draft version
            before editing.
          </p>
        </div>
      )}

      {existingDraftVersion && !isDraft && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
          A draft already exists for this form. Open it from the action bar to continue editing.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
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
              onChange={(event) =>
                setMetadata((prev) => ({ ...prev, formKey: event.target.value }))
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm text-gray-700">
            Public Key
            <input
              value={metadata.publicKey}
              disabled={!isDraft}
              onChange={(event) =>
                setMetadata((prev) => ({ ...prev, publicKey: event.target.value }))
              }
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
            onChange={(event) =>
              setMetadata((prev) => ({ ...prev, description: event.target.value }))
            }
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
          />
        </label>
        {runtimeUrl && (
          <p className="text-xs text-gray-500">
            Runtime URL: <span className="font-mono">{runtimeUrl}</span>
          </p>
        )}
      </div>

      {activeTab === 'structure' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Structure</h3>
          <p className="text-sm text-gray-600">
            Top-level <code>rules</code> are stored and returned by the backend, and can guide UI,
            but backend execution is metadata-only for now.
          </p>
          <label className="text-sm text-gray-700 block">
            Rules JSON
            <textarea
              rows={8}
              value={sections.rules}
              disabled={!isDraft}
              onChange={(event) =>
                setSections((prev) => ({ ...prev, rules: event.target.value }))
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm text-gray-700 block">
            Layout JSON
            <textarea
              rows={10}
              value={sections.layout}
              disabled={!isDraft}
              onChange={(event) =>
                setSections((prev) => ({ ...prev, layout: event.target.value }))
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
            />
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700 block">
              Assignment JSON
              <textarea
                rows={8}
                value={sections.assignment}
                disabled={!isDraft}
                onChange={(event) =>
                  setSections((prev) => ({ ...prev, assignment: event.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
              />
            </label>
            <label className="text-sm text-gray-700 block">
              Spam Protection JSON
              <textarea
                rows={8}
                value={sections.spamProtection}
                disabled={!isDraft}
                onChange={(event) =>
                  setSections((prev) => ({ ...prev, spamProtection: event.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
              />
            </label>
          </div>
        </div>
      )}

      {activeTab === 'fields' && (
        <FieldListEditor
          fields={fields}
          isDraft={isDraft}
          onAdd={addField}
          onUpdate={updateField}
          onRemove={removeField}
        />
      )}

      {activeTab === 'mappings' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Mappings</h3>
          <p className="text-sm text-gray-600">
            Use <code>targetField</code> for exact write paths like{' '}
            <code>customer.name</code> or <code>vehicle.vin</code>. Choose target module for
            record creation flow.
          </p>
          <label className="text-sm text-gray-700 block max-w-md">
            Target Module
            <select
              value={targetModule}
              disabled={!isDraft}
              onChange={(event) => setTargetModule(event.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
            >
              {TARGET_MODULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-700 block">
            Mappings JSON
            <textarea
              rows={16}
              value={sections.mappings}
              disabled={!isDraft}
              onChange={(event) =>
                setSections((prev) => ({ ...prev, mappings: event.target.value }))
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
            />
          </label>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Theme</h3>
          <p className="text-sm text-gray-600">
            Keep theme lightweight: colors, labels, and simple presentation metadata.
          </p>
          <textarea
            rows={18}
            value={sections.theme}
            disabled={!isDraft}
            onChange={(event) => setSections((prev) => ({ ...prev, theme: event.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
          />
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Policies</h3>
          <p className="text-sm text-gray-600">
            Configure submission policy behavior and renderer metadata.
          </p>
          <textarea
            rows={18}
            value={sections.policy}
            disabled={!isDraft}
            onChange={(event) =>
              setSections((prev) => ({ ...prev, policy: event.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-xs disabled:bg-gray-100"
          />
        </div>
      )}

      {activeTab === 'versions' && (
        <VersionTimeline versions={versions} currentVersionId={currentVersionId} />
      )}
    </div>
  );
}
