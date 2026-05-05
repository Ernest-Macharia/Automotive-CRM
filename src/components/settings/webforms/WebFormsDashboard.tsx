'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Pencil,
  GitBranch,
  Archive,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import TemplatePicker from '@/components/settings/webforms/TemplatePicker';
import {
  getWebFormErrorMessage,
  WebFormDefinition,
  WebFormTemplateDetail,
  WebFormTemplateSummary,
  webFormsService,
} from '@/services/webFormsService';

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getFormLabel = (form: WebFormDefinition): string =>
  form.title || form.name || form.formKey || form.publicKey || 'Untitled form';

const getFormStateBadge = (state?: string): string => {
  switch (state) {
    case 'published':
      return 'bg-emerald-100 text-emerald-700';
    case 'archived':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

export default function WebFormsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forms, setForms] = useState<WebFormDefinition[]>([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<WebFormTemplateSummary[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WebFormTemplateDetail | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    name: '',
    description: '',
    formKey: '',
    publicKey: '',
  });
  const [createFromTemplateData, setCreateFromTemplateData] = useState({
    name: '',
    description: '',
    formKey: '',
    publicKey: '',
    publish: false,
    primaryColor: '',
    headerText: '',
  });

  const loadForms = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const list = await webFormsService.getAllForms();
      const sorted = [...list].sort((a, b) => {
        const right = new Date(String(b.updatedAt || b.createdAt || 0)).getTime();
        const left = new Date(String(a.updatedAt || a.createdAt || 0)).getTime();
        return right - left;
      });
      setForms(sorted);
    } catch (error) {
      console.error('Failed to load web forms:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to load forms'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const loadTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const list = await webFormsService.getTemplates();
      setTemplates(list);
    } catch (error) {
      console.error('Failed to load webform templates:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to load templates'), 'error');
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadForms();
    loadTemplates();
  }, [loadForms, loadTemplates]);

  const filteredForms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return forms;

    return forms.filter((form) => {
      const haystack = [
        form.title,
        form.name,
        form.formKey,
        form.publicKey,
        form.description,
        form.state,
      ]
        .map((item) => String(item || '').toLowerCase())
        .join(' ');
      return haystack.includes(normalizedSearch);
    });
  }, [forms, search]);

  const createForm = async (event: FormEvent) => {
    event.preventDefault();

    const fallbackSlug = toSlug(createFormData.title || createFormData.name);
    if (!fallbackSlug) {
      showToast('Form title is required', 'warning');
      return;
    }

    const publicKey = createFormData.publicKey.trim() || `${fallbackSlug}-${Date.now().toString().slice(-5)}`;
    const formKey = createFormData.formKey.trim() || publicKey;

    try {
      setCreating(true);
      const created = await webFormsService.createForm({
        title: createFormData.title.trim() || createFormData.name.trim(),
        name: createFormData.name.trim() || createFormData.title.trim(),
        description: createFormData.description.trim(),
        formKey,
        publicKey,
        fields: [],
        rules: [],
        mappings: {},
        layout: {},
        theme: {},
        policy: {},
        assignment: {},
        spamProtection: {},
      });

      showToast('Draft form created', 'success');
      setShowCreateModal(false);
      setCreateFormData({
        title: '',
        name: '',
        description: '',
        formKey: '',
        publicKey: '',
      });
      router.push(`/settings/webforms/${created._id}`);
    } catch (error: any) {
      console.error('Failed to create form:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to create form'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const openTemplateFlow = async (template: WebFormTemplateSummary) => {
    try {
      setCreatingFromTemplate(true);
      const details = await webFormsService.getTemplateByKey(template.templateKey);
      const seedName = details.title || details.name || template.templateKey;
      const slug = toSlug(seedName);
      setSelectedTemplate(details);
      setCreateFromTemplateData({
        name: seedName,
        description: details.description || '',
        formKey: slug,
        publicKey: slug,
        publish: false,
        primaryColor: String((details.theme as any)?.primaryColor || ''),
        headerText: String((details.theme as any)?.headerText || ''),
      });
      setShowTemplateModal(true);
    } catch (error) {
      console.error('Failed to load template details:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to open template'), 'error');
    } finally {
      setCreatingFromTemplate(false);
    }
  };

  const createFromTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTemplate) return;

    const normalizedName = createFromTemplateData.name.trim();
    if (!normalizedName) {
      showToast('Form name is required', 'warning');
      return;
    }

    try {
      setCreatingFromTemplate(true);
      const created = await webFormsService.createFromTemplate(selectedTemplate.templateKey, {
        name: normalizedName,
        description: createFromTemplateData.description.trim() || undefined,
        formKey: createFromTemplateData.formKey.trim() || toSlug(normalizedName),
        publicKey: createFromTemplateData.publicKey.trim() || toSlug(normalizedName),
        publish: createFromTemplateData.publish,
        theme: {
          ...(selectedTemplate.theme || {}),
          ...(createFromTemplateData.primaryColor.trim()
            ? { primaryColor: createFromTemplateData.primaryColor.trim() }
            : {}),
          ...(createFromTemplateData.headerText.trim()
            ? { headerText: createFromTemplateData.headerText.trim() }
            : {}),
        },
      });

      showToast(
        createFromTemplateData.publish
          ? 'Template created and published'
          : 'Template draft created',
        'success'
      );
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      await loadForms(true);
      router.push(`/settings/webforms/${created._id}`);
    } catch (error) {
      console.error('Failed to create from template:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to create from template'), 'error');
    } finally {
      setCreatingFromTemplate(false);
    }
  };

  const publishForm = async (form: WebFormDefinition) => {
    try {
      await webFormsService.publishForm(form._id);
      showToast('Form published', 'success');
      await loadForms(true);
    } catch (error: any) {
      console.error('Failed to publish form:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to publish form'), 'error');
    }
  };

  const archiveForm = async (form: WebFormDefinition) => {
    try {
      await webFormsService.archiveForm(form._id);
      showToast('Form archived', 'success');
      await loadForms(true);
    } catch (error: any) {
      console.error('Failed to archive form:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to archive form'), 'error');
    }
  };

  const createNextVersion = async (form: WebFormDefinition) => {
    try {
      const versions = await webFormsService.getFormVersions(form._id);
      const existingDraft = versions.find((version) => {
        const versionId = String(version._id || version.id || version.versionId || '').trim();
        return version.state === 'draft' && versionId && versionId !== form._id;
      });

      if (existingDraft) {
        const draftId = String(existingDraft._id || existingDraft.id || existingDraft.versionId || '').trim();
        if (draftId) {
          showToast('A draft version already exists. Opening that draft.', 'warning');
          router.push(`/settings/webforms/${draftId}`);
          return;
        }
      }

      const next = await webFormsService.createNextVersion(form._id);
      showToast('New draft version created', 'success');
      router.push(`/settings/webforms/${next._id}`);
    } catch (error: any) {
      console.error('Failed to create next version:', error);
      showToast(getWebFormErrorMessage(error, 'Failed to create next draft version'), 'error');
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Web Form Builder</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create draft versions, publish safely, and render forms by stable public keys.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadForms(true)}
              disabled={refreshing || loading}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTemplate(null);
                setShowTemplateModal(true);
              }}
              className="px-3 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 inline-flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Use Template
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Form
            </button>
          </div>
        </div>

        <div className="mt-4 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, key, state..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <TemplatePicker
        templates={templates}
        loading={templatesLoading}
        onRefresh={loadTemplates}
        onUseTemplate={openTemplateFlow}
      />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading forms...
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No forms found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Form</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Public Key</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Version</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">State</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Updated</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map((form) => (
                  <tr key={form._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{getFormLabel(form)}</p>
                      <p className="text-xs text-gray-500 mt-1">{form.description || form.formKey || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{form.publicKey || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">v{form.versionNumber || 1}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getFormStateBadge(
                          form.state
                        )}`}
                      >
                        {form.state || 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(String(form.updatedAt || form.createdAt || Date.now())).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/settings/webforms/${form._id}`}
                          className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Builder
                        </Link>
                        {form.publicKey && (
                          <Link
                            href={`/forms/${encodeURIComponent(form.publicKey)}`}
                            target="_blank"
                            className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Runtime
                          </Link>
                        )}
                        {form.state === 'draft' && (
                          <button
                            type="button"
                            onClick={() => publishForm(form)}
                            className="px-2.5 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-md text-xs hover:bg-emerald-100 inline-flex items-center gap-1.5"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Publish
                          </button>
                        )}
                        {form.state !== 'draft' && (
                          <button
                            type="button"
                            onClick={() => createNextVersion(form)}
                            className="px-2.5 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-md text-xs hover:bg-indigo-100 inline-flex items-center gap-1.5"
                          >
                            <GitBranch className="h-3.5 w-3.5" />
                            New Draft
                          </button>
                        )}
                        {form.state !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => archiveForm(form)}
                            className="px-2.5 py-1.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-md text-xs hover:bg-amber-100 inline-flex items-center gap-1.5"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={createForm}
            className="w-full max-w-xl bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Form Draft</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-gray-700">
                Title
                <input
                  required
                  value={createFormData.title}
                  onChange={(event) =>
                    setCreateFormData((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </label>
              <label className="text-sm text-gray-700">
                Internal Name
                <input
                  value={createFormData.name}
                  onChange={(event) =>
                    setCreateFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </label>
            </div>

            <label className="text-sm text-gray-700 block">
              Description
              <textarea
                rows={3}
                value={createFormData.description}
                onChange={(event) =>
                  setCreateFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-gray-700">
                Form Key
                <input
                  value={createFormData.formKey}
                  onChange={(event) =>
                    setCreateFormData((prev) => ({ ...prev, formKey: event.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="service-intake"
                />
              </label>
              <label className="text-sm text-gray-700">
                Public Key
                <input
                  value={createFormData.publicKey}
                  onChange={(event) =>
                    setCreateFormData((prev) => ({ ...prev, publicKey: event.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="service-intake-public"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTemplate ? 'Create Form From Template' : 'Choose a Template'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            {!selectedTemplate ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Pick a starter template to begin your draft faster.
                </p>
                {templatesLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No templates available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {templates.map((template) => (
                      <button
                        key={template.templateKey}
                        type="button"
                        onClick={() => openTemplateFlow(template)}
                        disabled={creatingFromTemplate}
                        className="text-left border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 disabled:opacity-60"
                      >
                        <p className="font-medium text-gray-900">
                          {template.title || template.name || template.templateKey}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {template.templateKey}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {template.description || 'Automotive-ready starter template.'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={createFromTemplate} className="space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                  <p className="text-sm text-blue-900 font-medium">
                    Template: {selectedTemplate.title || selectedTemplate.name}
                  </p>
                  <p className="text-xs text-blue-700 font-mono mt-1">
                    {selectedTemplate.templateKey}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-700">
                    Form Name
                    <input
                      required
                      value={createFromTemplateData.name}
                      onChange={(event) =>
                        setCreateFromTemplateData((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                    />
                  </label>
                  <label className="text-sm text-gray-700">
                    Form Key
                    <input
                      value={createFromTemplateData.formKey}
                      onChange={(event) =>
                        setCreateFromTemplateData((prev) => ({ ...prev, formKey: event.target.value }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                    />
                  </label>
                  <label className="text-sm text-gray-700">
                    Public Key
                    <input
                      value={createFromTemplateData.publicKey}
                      onChange={(event) =>
                        setCreateFromTemplateData((prev) => ({ ...prev, publicKey: event.target.value }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                    />
                  </label>
                  <label className="text-sm text-gray-700">
                    Primary Color
                    <input
                      value={createFromTemplateData.primaryColor}
                      onChange={(event) =>
                        setCreateFromTemplateData((prev) => ({ ...prev, primaryColor: event.target.value }))
                      }
                      placeholder="#0f766e"
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                    />
                  </label>
                </div>

                <label className="text-sm text-gray-700 block">
                  Header Text
                  <input
                    value={createFromTemplateData.headerText}
                    onChange={(event) =>
                      setCreateFromTemplateData((prev) => ({ ...prev, headerText: event.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </label>

                <label className="text-sm text-gray-700 block">
                  Description
                  <textarea
                    rows={3}
                    value={createFromTemplateData.description}
                    onChange={(event) =>
                      setCreateFromTemplateData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </label>

                <label className="text-sm text-gray-700 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createFromTemplateData.publish}
                    onChange={(event) =>
                      setCreateFromTemplateData((prev) => ({ ...prev, publish: event.target.checked }))
                    }
                  />
                  Publish immediately after creation
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFromTemplate}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {creatingFromTemplate && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create From Template
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
