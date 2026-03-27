import type { ConsultancyTemplate } from '../../services/consultorias.api.ts';

export interface WizardState {
  template: ConsultancyTemplate | null;
  title: string;
  client_name: string;
  niche: string;
  instagram: string;
  problem: string;
  tried: string;
  goal90: string;
}

export const WIZARD_INITIAL: WizardState = {
  template: null,
  title: '',
  client_name: '',
  niche: '',
  instagram: '',
  problem: '',
  tried: '',
  goal90: '',
};
