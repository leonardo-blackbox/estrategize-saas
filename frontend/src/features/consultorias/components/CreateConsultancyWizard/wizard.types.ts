export interface WizardState {
  client_name: string;
  niche: string;
  instagram: string;
  start_date: string;    // formato ISO date string 'YYYY-MM-DD'
}

export const WIZARD_INITIAL: WizardState = {
  client_name: '',
  niche: '',
  instagram: '',
  start_date: '',
};

export interface BasicDataErrors {
  client_name?: string;
  niche?: string;
  start_date?: string;
}
