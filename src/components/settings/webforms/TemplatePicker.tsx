'use client';

import { FileText, Loader2, RefreshCw } from 'lucide-react';
import { WebFormTemplateSummary } from '@/services/webFormsService';

interface TemplatePickerProps {
  templates: WebFormTemplateSummary[];
  loading: boolean;
  onRefresh: () => void;
  onUseTemplate: (template: WebFormTemplateSummary) => void;
}

const getTemplateTitle = (template: WebFormTemplateSummary): string =>
  template.title || template.name || template.templateKey || 'Template';

export default function TemplatePicker({
  templates,
  loading,
  onRefresh,
  onUseTemplate,
}: TemplatePickerProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Starter Templates</h3>
          <p className="text-sm text-gray-600 mt-1">
            Start from built-in automotive templates, then customize and publish.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
          Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          No templates available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.templateKey}
              className="border border-gray-200 rounded-xl p-4 flex flex-col"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {getTemplateTitle(template)}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                    {template.templateKey}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-3 flex-1">
                {template.description || 'Automotive-ready starter form.'}
              </p>

              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{template.fieldsCount || 0} fields</span>
                <span className="uppercase tracking-wide">
                  {template.category || 'general'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUseTemplate(template)}
                className="mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
