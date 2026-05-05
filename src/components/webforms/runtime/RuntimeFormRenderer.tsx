'use client';

import { WebFormFieldDefinition } from '@/services/webFormsService';
import ConditionalFieldRenderer from './ConditionalFieldRenderer';

export interface RuntimeLayoutSection {
  id: string;
  title?: string;
  description?: string;
  columns?: number;
  fields: Array<{
    field: WebFormFieldDefinition;
    identity: string;
  }>;
}

interface RuntimeFormRendererProps {
  sections: RuntimeLayoutSection[];
  values: Record<string, any>;
  fieldErrors: Record<string, string>;
  isFieldRequired: (field: WebFormFieldDefinition) => boolean;
  onFieldChange: (field: WebFormFieldDefinition, identity: string, nextValue: any) => void;
}

export default function RuntimeFormRenderer({
  sections,
  values,
  fieldErrors,
  isFieldRequired,
  onFieldChange,
}: RuntimeFormRendererProps) {
  const safeSections =
    Array.isArray(sections) && sections.length > 0
      ? sections
      : [{ id: 'default', fields: [], columns: 1 }];

  return (
    <div className="space-y-6">
      {safeSections.map((section) => {
        const columns =
          section.columns && Number(section.columns) >= 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';

        return (
          <section key={section.id} className="space-y-3">
            {(section.title || section.description) && (
              <div>
                {section.title && (
                  <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                )}
                {section.description && (
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                )}
              </div>
            )}

            <div className={`grid grid-cols-1 ${columns} gap-4`}>
              {section.fields.map(({ field, identity }) => (
                <ConditionalFieldRenderer
                  key={identity}
                  field={field}
                  identity={identity}
                  value={values[identity]}
                  required={isFieldRequired(field)}
                  error={fieldErrors[identity]}
                  onChange={(nextValue) => onFieldChange(field, identity, nextValue)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
