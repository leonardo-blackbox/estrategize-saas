import type { ConsultancyTemplate } from '../../services/consultorias.api.ts';

export interface WizardState {
  template: ConsultancyTemplate | null;
  title: string;
  client_name: string;
  niche: string;
  instagram: string;
  ticket: string;        // user digita número como string; wizard converte antes de enviar
  start_date: string;    // formato ISO date string 'YYYY-MM-DD' ou vazio
  problem: string;
  tried: string;
  goal90: string;
  current_stage: string;
  has_team: boolean;
  has_website: boolean;
}

export const WIZARD_INITIAL: WizardState = {
  template: null,
  title: '',
  client_name: '',
  niche: '',
  instagram: '',
  ticket: '',
  start_date: '',
  problem: '',
  tried: '',
  goal90: '',
  current_stage: '',
  has_team: false,
  has_website: false,
};
