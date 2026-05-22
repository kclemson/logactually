// Canonical analyte registry for bloodwork results.
// Each entry: canonical key (used as the trend identity) + display name + synonyms.
// Synonyms are normalized (lowercased, punctuation/space-stripped) before matching.

export interface CanonicalAnalyte {
  key: string;
  display: string;
  synonyms: string[];
}

export const BLOODWORK_CANONICAL: CanonicalAnalyte[] = [
  // Lipid panel
  { key: 'total_cholesterol', display: 'Total Cholesterol', synonyms: ['cholesterol', 'cholesterol total', 'total cholesterol', 'chol'] },
  { key: 'hdl_cholesterol', display: 'HDL Cholesterol', synonyms: ['hdl', 'hdl-c', 'hdl cholesterol', 'hdl chol'] },
  { key: 'ldl_cholesterol', display: 'LDL Cholesterol', synonyms: ['ldl', 'ldl-c', 'ldl cholesterol', 'ldl chol', 'ldl calc', 'ldl calculated', 'ldl chol calc', 'ldl-cholesterol'] },
  { key: 'vldl_cholesterol', display: 'VLDL Cholesterol', synonyms: ['vldl', 'vldl-c', 'vldl cholesterol', 'vldl chol calc'] },
  { key: 'triglycerides', display: 'Triglycerides', synonyms: ['triglycerides', 'trig', 'trigs', 'tg'] },
  { key: 'non_hdl_cholesterol', display: 'Non-HDL Cholesterol', synonyms: ['non hdl cholesterol', 'non-hdl cholesterol', 'non hdl chol'] },
  { key: 'chol_hdl_ratio', display: 'Cholesterol/HDL Ratio', synonyms: ['chol/hdlc ratio', 'chol/hdl ratio', 'cholesterol/hdl ratio', 'tc/hdl'] },

  // Iron / TIBC
  { key: 'iron_serum', display: 'Iron', synonyms: ['iron', 'iron serum', 'iron, serum', 'fe'] },
  { key: 'tibc', display: 'TIBC', synonyms: ['tibc', 'iron binding capacity', 'iron bind cap', 'iron bind cap tibc', 'total iron binding capacity'] },
  { key: 'uibc', display: 'UIBC', synonyms: ['uibc', 'unsat iron binding capacity', 'unsaturated iron binding capacity'] },
  { key: 'iron_saturation', display: 'Iron Saturation', synonyms: ['iron saturation', 'iron sat', 'transferrin saturation', 'transferrin sat', 'percent saturation', '% saturation', 'tsat'] },
  { key: 'ferritin', display: 'Ferritin', synonyms: ['ferritin', 'ferritin serum'] },
  { key: 'transferrin', display: 'Transferrin', synonyms: ['transferrin'] },

  // CBC
  { key: 'wbc', display: 'WBC', synonyms: ['wbc', 'white blood cell count', 'white blood cells', 'leukocytes'] },
  { key: 'rbc', display: 'RBC', synonyms: ['rbc', 'red blood cell count', 'red blood cells', 'erythrocytes'] },
  { key: 'hemoglobin', display: 'Hemoglobin', synonyms: ['hemoglobin', 'hgb', 'hb'] },
  { key: 'hematocrit', display: 'Hematocrit', synonyms: ['hematocrit', 'hct'] },
  { key: 'mcv', display: 'MCV', synonyms: ['mcv', 'mean corpuscular volume'] },
  { key: 'mch', display: 'MCH', synonyms: ['mch', 'mean corpuscular hemoglobin'] },
  { key: 'mchc', display: 'MCHC', synonyms: ['mchc', 'mean corpuscular hemoglobin concentration'] },
  { key: 'rdw', display: 'RDW', synonyms: ['rdw', 'red cell distribution width'] },
  { key: 'platelets', display: 'Platelets', synonyms: ['platelets', 'platelet count', 'plt'] },
  { key: 'mpv', display: 'MPV', synonyms: ['mpv', 'mean platelet volume'] },
  { key: 'neutrophils_pct', display: 'Neutrophils %', synonyms: ['neutrophils', 'neutrophils %', 'neutrophil percent', 'neut %', 'neutrophils percent'] },
  { key: 'lymphocytes_pct', display: 'Lymphocytes %', synonyms: ['lymphocytes', 'lymphocytes %', 'lymph %', 'lymphs %', 'lymphocyte percent'] },
  { key: 'monocytes_pct', display: 'Monocytes %', synonyms: ['monocytes', 'monocytes %', 'mono %'] },
  { key: 'eosinophils_pct', display: 'Eosinophils %', synonyms: ['eosinophils', 'eosinophils %', 'eos %'] },
  { key: 'basophils_pct', display: 'Basophils %', synonyms: ['basophils', 'basophils %', 'baso %'] },
  { key: 'neutrophils_abs', display: 'Neutrophils (Absolute)', synonyms: ['neutrophils absolute', 'absolute neutrophils', 'neut abs', 'anc'] },
  { key: 'lymphocytes_abs', display: 'Lymphocytes (Absolute)', synonyms: ['lymphocytes absolute', 'absolute lymphocytes', 'lymph abs'] },
  { key: 'monocytes_abs', display: 'Monocytes (Absolute)', synonyms: ['monocytes absolute', 'absolute monocytes'] },
  { key: 'eosinophils_abs', display: 'Eosinophils (Absolute)', synonyms: ['eosinophils absolute', 'absolute eosinophils'] },
  { key: 'basophils_abs', display: 'Basophils (Absolute)', synonyms: ['basophils absolute', 'absolute basophils'] },

  // Metabolic / CMP
  { key: 'glucose', display: 'Glucose', synonyms: ['glucose', 'glucose serum', 'fasting glucose', 'blood glucose'] },
  { key: 'bun', display: 'BUN', synonyms: ['bun', 'blood urea nitrogen', 'urea nitrogen'] },
  { key: 'creatinine', display: 'Creatinine', synonyms: ['creatinine', 'creatinine serum'] },
  { key: 'egfr', display: 'eGFR', synonyms: ['egfr', 'gfr', 'estimated gfr', 'estimated glomerular filtration rate'] },
  { key: 'bun_creatinine_ratio', display: 'BUN/Creatinine Ratio', synonyms: ['bun/creatinine ratio', 'bun creatinine ratio'] },
  { key: 'sodium', display: 'Sodium', synonyms: ['sodium', 'na'] },
  { key: 'potassium', display: 'Potassium', synonyms: ['potassium', 'k'] },
  { key: 'chloride', display: 'Chloride', synonyms: ['chloride', 'cl'] },
  { key: 'co2', display: 'CO2', synonyms: ['co2', 'carbon dioxide', 'bicarbonate', 'hco3'] },
  { key: 'calcium', display: 'Calcium', synonyms: ['calcium', 'ca'] },
  { key: 'magnesium', display: 'Magnesium', synonyms: ['magnesium', 'mg'] },
  { key: 'phosphorus', display: 'Phosphorus', synonyms: ['phosphorus', 'phosphate'] },
  { key: 'protein_total', display: 'Total Protein', synonyms: ['total protein', 'protein total'] },
  { key: 'albumin', display: 'Albumin', synonyms: ['albumin'] },
  { key: 'globulin', display: 'Globulin', synonyms: ['globulin', 'globulin total'] },
  { key: 'albumin_globulin_ratio', display: 'A/G Ratio', synonyms: ['a/g ratio', 'albumin/globulin ratio', 'albumin globulin ratio'] },
  { key: 'bilirubin_total', display: 'Bilirubin (Total)', synonyms: ['bilirubin total', 'total bilirubin'] },
  { key: 'bilirubin_direct', display: 'Bilirubin (Direct)', synonyms: ['bilirubin direct', 'direct bilirubin'] },
  { key: 'alp', display: 'Alkaline Phosphatase', synonyms: ['alkaline phosphatase', 'alp', 'alk phos'] },
  { key: 'ast', display: 'AST', synonyms: ['ast', 'aspartate aminotransferase', 'sgot', 'ast sgot'] },
  { key: 'alt', display: 'ALT', synonyms: ['alt', 'alanine aminotransferase', 'sgpt', 'alt sgpt'] },
  { key: 'ggt', display: 'GGT', synonyms: ['ggt', 'gamma-glutamyl transferase', 'gamma glutamyl transferase'] },

  // Diabetes / HbA1c
  { key: 'hba1c', display: 'Hemoglobin A1c', synonyms: ['hba1c', 'hemoglobin a1c', 'a1c', 'hgb a1c'] },
  { key: 'insulin', display: 'Insulin', synonyms: ['insulin', 'fasting insulin'] },
  { key: 'homa_ir', display: 'HOMA-IR', synonyms: ['homa-ir', 'homa ir'] },

  // Thyroid
  { key: 'tsh', display: 'TSH', synonyms: ['tsh', 'thyroid stimulating hormone', 'thyrotropin'] },
  { key: 'free_t4', display: 'Free T4', synonyms: ['free t4', 'ft4', 't4 free'] },
  { key: 'free_t3', display: 'Free T3', synonyms: ['free t3', 'ft3', 't3 free'] },
  { key: 'total_t4', display: 'Total T4', synonyms: ['t4', 'total t4', 'thyroxine'] },
  { key: 'total_t3', display: 'Total T3', synonyms: ['t3', 'total t3', 'triiodothyronine'] },

  // Vitamins / hormones
  { key: 'vitamin_d', display: 'Vitamin D (25-OH)', synonyms: ['vitamin d', 'vitamin d 25 hydroxy', '25-hydroxy vitamin d', '25(oh)d', 'vitamin d 25-oh'] },
  { key: 'vitamin_b12', display: 'Vitamin B12', synonyms: ['vitamin b12', 'b12', 'cobalamin'] },
  { key: 'folate', display: 'Folate', synonyms: ['folate', 'folic acid'] },
  { key: 'testosterone_total', display: 'Testosterone (Total)', synonyms: ['testosterone', 'testosterone total', 'total testosterone'] },
  { key: 'testosterone_free', display: 'Testosterone (Free)', synonyms: ['testosterone free', 'free testosterone'] },
  { key: 'estradiol', display: 'Estradiol', synonyms: ['estradiol', 'e2'] },
  { key: 'cortisol', display: 'Cortisol', synonyms: ['cortisol'] },
  { key: 'dhea_s', display: 'DHEA-S', synonyms: ['dhea-s', 'dhea s', 'dhea sulfate'] },
  { key: 'shbg', display: 'SHBG', synonyms: ['shbg', 'sex hormone binding globulin'] },
  { key: 'prolactin', display: 'Prolactin', synonyms: ['prolactin'] },

  // Inflammation
  { key: 'crp_hs', display: 'hs-CRP', synonyms: ['hs-crp', 'hs crp', 'high sensitivity crp', 'c-reactive protein, cardiac'] },
  { key: 'crp', display: 'CRP', synonyms: ['crp', 'c-reactive protein', 'c reactive protein'] },
  { key: 'esr', display: 'ESR', synonyms: ['esr', 'sed rate', 'sedimentation rate', 'erythrocyte sedimentation rate'] },
  { key: 'homocysteine', display: 'Homocysteine', synonyms: ['homocysteine'] },
  { key: 'uric_acid', display: 'Uric Acid', synonyms: ['uric acid'] },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9% ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'unknown';
}

// Build lookup once.
const SYNONYM_INDEX = new Map<string, CanonicalAnalyte>();
for (const a of BLOODWORK_CANONICAL) {
  for (const syn of a.synonyms) {
    SYNONYM_INDEX.set(normalize(syn), a);
  }
  SYNONYM_INDEX.set(normalize(a.display), a);
}

export function canonicalize(rawName: string): { canonical_key: string; display_name: string } {
  const norm = normalize(rawName);
  const hit = SYNONYM_INDEX.get(norm);
  if (hit) return { canonical_key: hit.key, display_name: hit.display };
  // Fallback: slug of raw name, keep raw as display.
  return { canonical_key: slugify(rawName), display_name: rawName.trim() };
}
