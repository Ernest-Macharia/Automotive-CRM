import { WebFormFieldDefinition } from '@/services/webFormsService';

export interface BuilderEditableField extends WebFormFieldDefinition {
  _advancedJson: string;
}
