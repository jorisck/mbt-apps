/**
 * EstimateForm — replaced by DemandeForm (D23: removed Math.random() price simulation).
 * This module re-exports DemandeForm so any existing import of EstimateForm
 * continues to work while rendering the real booking form.
 */
export { DemandeForm as EstimateForm } from "./DemandeForm";
