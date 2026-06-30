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
  { key: 'hdl_cholesterol', display: 'HDL Cholesterol', fullName: 'High-Density Lipoprotein Cholesterol', synonyms: ['hdl', 'hdl-c', 'hdl cholesterol', 'hdl chol'] },
  { key: 'ldl_cholesterol', display: 'LDL Cholesterol', fullName: 'Low-Density Lipoprotein Cholesterol', synonyms: ['ldl', 'ldl-c', 'ldl cholesterol', 'ldl chol', 'ldl calc', 'ldl calculated', 'ldl chol calc', 'ldl chol calc nih', 'ldl-cholesterol'] },
  { key: 'vldl_cholesterol', display: 'VLDL Cholesterol', fullName: 'Very-Low-Density Lipoprotein Cholesterol', synonyms: ['vldl', 'vldl-c', 'vldl cholesterol', 'vldl chol calc'] },
  { key: 'triglycerides', display: 'Triglycerides', synonyms: ['triglycerides', 'triglyceride', 'trig', 'trigs', 'tg'] },
  { key: 'non_hdl_cholesterol', display: 'Non-HDL Cholesterol', synonyms: ['non hdl cholesterol', 'non-hdl cholesterol', 'non hdl chol'] },
  { key: 'chol_hdl_ratio', display: 'Cholesterol/HDL Ratio', synonyms: ['chol/hdlc ratio', 'chol/hdl ratio', 'cholesterol/hdl ratio', 'tc/hdl', 't chol/hdl ratio', 't. chol/hdl ratio'] },

  // Iron / TIBC
  { key: 'iron_serum', display: 'Iron', synonyms: ['iron', 'iron serum', 'iron, serum', 'iron, srm', 'iron srm', 'fe'] },
  { key: 'tibc', display: 'TIBC', fullName: 'Total Iron-Binding Capacity', synonyms: ['tibc', 'iron binding capacity', 'iron bind cap', 'iron bind cap tibc', 'total iron binding capacity'] },
  { key: 'uibc', display: 'UIBC', fullName: 'Unsaturated Iron-Binding Capacity', synonyms: ['uibc', 'unsat iron binding capacity', 'unsaturated iron binding capacity'] },
  { key: 'iron_saturation', display: 'Iron Saturation', synonyms: ['iron saturation', 'iron sat', 'transferrin saturation', 'transferrin sat', 'percent saturation', '% saturation', 'tsat'] },
  { key: 'ferritin', display: 'Ferritin', synonyms: ['ferritin', 'ferritin serum'] },
  { key: 'transferrin', display: 'Transferrin', synonyms: ['transferrin'] },

  // CBC
  { key: 'wbc', display: 'WBC', fullName: 'White Blood Cell Count', synonyms: ['wbc', 'white blood cell count', 'white blood cells', 'leukocytes'] },
  { key: 'rbc', display: 'RBC', fullName: 'Red Blood Cell Count', synonyms: ['rbc', 'red blood cell count', 'red blood cells', 'erythrocytes'] },
  { key: 'hemoglobin', display: 'Hemoglobin', synonyms: ['hemoglobin', 'hgb', 'hb'] },
  { key: 'hematocrit', display: 'Hematocrit', synonyms: ['hematocrit', 'hct'] },
  { key: 'mcv', display: 'MCV', fullName: 'Mean Corpuscular Volume', synonyms: ['mcv', 'mean corpuscular volume'] },
  { key: 'mch', display: 'MCH', fullName: 'Mean Corpuscular Hemoglobin', synonyms: ['mch', 'mean corpuscular hemoglobin'] },
  { key: 'mchc', display: 'MCHC', fullName: 'Mean Corpuscular Hemoglobin Concentration', synonyms: ['mchc', 'mean corpuscular hemoglobin concentration'] },
  { key: 'rdw', display: 'RDW', fullName: 'Red Cell Distribution Width', synonyms: ['rdw', 'rdw-cv', 'red cell distribution width'] },
  { key: 'platelets', display: 'Platelets', synonyms: ['platelets', 'platelet count', 'plt'] },
  { key: 'mpv', display: 'MPV', fullName: 'Mean Platelet Volume', synonyms: ['mpv', 'mean platelet volume'] },
  { key: 'neutrophils_pct', display: 'Neutrophils %', synonyms: ['neutrophils', 'neutrophils %', '% neutrophils', 'neutrophil percent', 'neut %', 'neut', 'neutrophils percent'] },
  { key: 'lymphocytes_pct', display: 'Lymphocytes %', synonyms: ['lymphocytes', 'lymphocytes %', '% lymphocytes', 'lymph %', 'lymphs %', 'lymphs', 'lymphocyte percent'] },
  { key: 'monocytes_pct', display: 'Monocytes %', synonyms: ['monocytes', 'monocytes %', '% monocytes', 'mono %'] },
  { key: 'eosinophils_pct', display: 'Eosinophils %', synonyms: ['eosinophils', 'eosinophils %', '% eosinophils', 'eos %', 'eos'] },
  { key: 'basophils_pct', display: 'Basophils %', synonyms: ['basophils', 'basophils %', '% basophils', 'baso %', 'basos'] },
  { key: 'neutrophils_abs', display: 'Neutrophils (Absolute)', synonyms: ['neutrophils absolute', 'absolute neutrophils', 'neut abs', 'anc'] },
  { key: 'lymphocytes_abs', display: 'Lymphocytes (Absolute)', synonyms: ['lymphocytes absolute', 'absolute lymphocytes', 'lymph abs', 'lymphs absolute', 'absolute lymphocyte count'] },
  { key: 'monocytes_abs', display: 'Monocytes (Absolute)', synonyms: ['monocytes absolute', 'absolute monocytes'] },
  { key: 'eosinophils_abs', display: 'Eosinophils (Absolute)', synonyms: ['eosinophils absolute', 'absolute eosinophils', 'eos absolute', 'absolute eosinophil count'] },
  { key: 'basophils_abs', display: 'Basophils (Absolute)', synonyms: ['basophils absolute', 'absolute basophils', 'baso absolute'] },

  // Metabolic / CMP
  { key: 'glucose', display: 'Glucose', synonyms: ['glucose', 'glucose serum', 'fasting glucose', 'blood glucose'] },
  { key: 'bun', display: 'BUN', fullName: 'Blood Urea Nitrogen', synonyms: ['bun', 'blood urea nitrogen', 'urea nitrogen'] },
  { key: 'creatinine', display: 'Creatinine', synonyms: ['creatinine', 'creatinine serum'] },
  { key: 'egfr', display: 'eGFR', fullName: 'Estimated Glomerular Filtration Rate', synonyms: ['egfr', 'gfr', 'estimated gfr', 'estimated glomerular filtration rate', 'egfr by ckd-epi 2021', 'egfr ckd-epi', 'egfr ckd epi'] },
  { key: 'bun_creatinine_ratio', display: 'BUN/Creatinine Ratio', synonyms: ['bun/creatinine ratio', 'bun creatinine ratio'] },
  { key: 'sodium', display: 'Sodium', synonyms: ['sodium', 'na'] },
  { key: 'potassium', display: 'Potassium', synonyms: ['potassium', 'k'] },
  { key: 'chloride', display: 'Chloride', synonyms: ['chloride', 'cl'] },
  { key: 'co2', display: 'CO2', fullName: 'Carbon Dioxide (Bicarbonate)', synonyms: ['co2', 'carbon dioxide', 'carbon dioxide total', 'carbon dioxide, total', 'bicarbonate', 'hco3'] },
  { key: 'calcium', display: 'Calcium', synonyms: ['calcium', 'ca'] },
  { key: 'magnesium', display: 'Magnesium', synonyms: ['magnesium', 'mg'] },
  { key: 'phosphorus', display: 'Phosphorus', synonyms: ['phosphorus', 'phosphate'] },
  { key: 'protein_total', display: 'Total Protein', synonyms: ['total protein', 'protein total', 'total protein beckman'] },
  { key: 'albumin', display: 'Albumin', synonyms: ['albumin'] },
  { key: 'globulin', display: 'Globulin', synonyms: ['globulin', 'globulin total'] },
  { key: 'albumin_globulin_ratio', display: 'A/G Ratio', fullName: 'Albumin/Globulin Ratio', synonyms: ['a/g ratio', 'albumin/globulin ratio', 'albumin globulin ratio'] },
  { key: 'bilirubin_total', display: 'Bilirubin (Total)', synonyms: ['bilirubin total', 'total bilirubin', 'total bilirubin beckman'] },
  { key: 'bilirubin_direct', display: 'Bilirubin (Direct)', synonyms: ['bilirubin direct', 'direct bilirubin', 'direct bilirubin beckman'] },
  { key: 'alp', display: 'Alkaline Phosphatase', fullName: 'Alkaline Phosphatase', synonyms: ['alkaline phosphatase', 'alkaline phosphatase total', 'alp', 'alk phos'] },
  { key: 'ast', display: 'AST', fullName: 'Aspartate Aminotransferase', synonyms: ['ast', 'aspartate aminotransferase', 'sgot', 'ast sgot', 'ast beckman'] },
  { key: 'alt', display: 'ALT', fullName: 'Alanine Aminotransferase', synonyms: ['alt', 'alanine aminotransferase', 'sgpt', 'alt sgpt', 'alt beckman'] },
  { key: 'ggt', display: 'GGT', fullName: 'Gamma-Glutamyl Transferase', synonyms: ['ggt', 'gamma-glutamyl transferase', 'gamma glutamyl transferase'] },

  // Diabetes / HbA1c
  { key: 'hba1c', display: 'Hemoglobin A1c', fullName: 'Hemoglobin A1c (Glycated)', synonyms: ['hba1c', 'hemoglobin a1c', 'a1c', 'hgb a1c'] },
  { key: 'insulin', display: 'Insulin', synonyms: ['insulin', 'fasting insulin'] },
  { key: 'homa_ir', display: 'HOMA-IR', fullName: 'Homeostatic Model Assessment of Insulin Resistance', synonyms: ['homa-ir', 'homa ir'] },

  // Thyroid
  { key: 'tsh', display: 'TSH', fullName: 'Thyroid-Stimulating Hormone', synonyms: ['tsh', 'thyroid stimulating hormone', 'thyrotropin'] },
  { key: 'free_t4', display: 'Free T4', fullName: 'Free Thyroxine', synonyms: ['free t4', 'ft4', 't4 free'] },
  { key: 'free_t3', display: 'Free T3', fullName: 'Free Triiodothyronine', synonyms: ['free t3', 'ft3', 't3 free'] },
  { key: 'total_t4', display: 'Total T4', fullName: 'Thyroxine', synonyms: ['t4', 'total t4', 'thyroxine'] },
  { key: 'total_t3', display: 'Total T3', fullName: 'Triiodothyronine', synonyms: ['t3', 'total t3', 'triiodothyronine'] },

  // Vitamins / hormones
  { key: 'vitamin_d', display: 'Vitamin D (25-OH)', synonyms: ['vitamin d', 'vitamin d 25 hydroxy', '25-hydroxy vitamin d', '25(oh)d', 'vitamin d 25-oh'] },
  { key: 'vitamin_b12', display: 'Vitamin B12', synonyms: ['vitamin b12', 'b12', 'cobalamin'] },
  { key: 'folate', display: 'Folate', synonyms: ['folate', 'folate srm', 'folate, srm', 'folic acid'] },
  { key: 'testosterone_total', display: 'Testosterone (Total)', synonyms: ['testosterone', 'testosterone total', 'total testosterone'] },
  { key: 'testosterone_free', display: 'Testosterone (Free)', synonyms: ['testosterone free', 'free testosterone'] },
  { key: 'estradiol', display: 'Estradiol', synonyms: ['estradiol', 'e2'] },
  { key: 'cortisol', display: 'Cortisol', synonyms: ['cortisol'] },
  { key: 'dhea_s', display: 'DHEA-S', fullName: 'Dehydroepiandrosterone Sulfate', synonyms: ['dhea-s', 'dhea s', 'dhea sulfate'] },
  { key: 'shbg', display: 'SHBG', fullName: 'Sex Hormone-Binding Globulin', synonyms: ['shbg', 'sex hormone binding globulin'] },
  { key: 'prolactin', display: 'Prolactin', synonyms: ['prolactin'] },

  // Inflammation
  { key: 'crp_hs', display: 'hs-CRP', fullName: 'High-Sensitivity C-Reactive Protein', synonyms: ['hs-crp', 'hs crp', 'high sensitivity crp', 'c-reactive protein, cardiac'] },
  { key: 'crp', display: 'CRP', fullName: 'C-Reactive Protein', synonyms: ['crp', 'c-reactive protein', 'c reactive protein'] },
  { key: 'esr', display: 'ESR', fullName: 'Erythrocyte Sedimentation Rate', synonyms: ['esr', 'sed rate', 'sedimentation rate', 'erythrocyte sedimentation rate'] },
  { key: 'homocysteine', display: 'Homocysteine', synonyms: ['homocysteine'] },
  { key: 'uric_acid', display: 'Uric Acid', synonyms: ['uric acid'] },

  // At-home dried-blood / capillary tests — kept SEPARATE from venous lab series.
  // These finger-prick card tests can read systematically differently from venous
  // serum draws, so they get their own canonical identity instead of merging.
  { key: 'total_cholesterol_db', display: 'Total Cholesterol (Dried Blood)', synonyms: ['cholesterol total dried bld', 'cholesterol, total, dried bld', 'cholesterol total dried blood', 'cholesterol dried blood', 'total cholesterol dried blood'] },
  { key: 'hdl_cholesterol_db', display: 'HDL Cholesterol (Dried Blood)', synonyms: ['hdl cholesterol dried blood', 'hdl cholesterol, dried blood', 'hdl dried blood'] },
  { key: 'ldl_cholesterol_db', display: 'LDL Cholesterol (Dried Blood)', synonyms: ['ldl chol cal nih db', 'ldl chol cal(nih),db', 'ldl cholesterol dried blood', 'ldl dried blood'] },
  { key: 'triglycerides_db', display: 'Triglycerides (Dried Blood)', synonyms: ['triglyceride dried blood', 'triglyceride, dried blood', 'triglycerides dried blood'] },
  { key: 'hba1c_db', display: 'Hemoglobin A1c (Dried Blood)', synonyms: ['hemoglobin a1c dried blood', 'hemoglobin a1c, dried blood', 'a1c dried blood', 'hba1c dried blood'] },
  { key: 'eag_db', display: 'Est. Average Glucose (Dried Blood)', synonyms: ['est avg glu eag db', 'est avg glu (eag),db', 'estimated average glucose dried blood', 'eag db'] },
];

export function normalize(s: string): string {
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

// CBC differential percent <-> absolute siblings. The same printed label
// (e.g. "Neutrophils %") can mean a relative percentage on one lab report
// and an absolute count on another — only the UNIT disambiguates them.
const DIFFERENTIAL_SIBLINGS: Record<string, string> = {
  neutrophils_pct: 'neutrophils_abs',
  neutrophils_abs: 'neutrophils_pct',
  lymphocytes_pct: 'lymphocytes_abs',
  lymphocytes_abs: 'lymphocytes_pct',
  monocytes_pct: 'monocytes_abs',
  monocytes_abs: 'monocytes_pct',
  eosinophils_pct: 'eosinophils_abs',
  eosinophils_abs: 'eosinophils_pct',
  basophils_pct: 'basophils_abs',
  basophils_abs: 'basophils_pct',
};

const KEY_INDEX = new Map<string, CanonicalAnalyte>(
  BLOODWORK_CANONICAL.map((a) => [a.key, a]),
);

// Classify a unit string as a percentage or an absolute concentration.
// Absolute CBC counts use cells-per-volume units (e.g. 10*3/uL, x10E3/uL, K/uL).
export function classifyUnit(unit?: string | null): 'pct' | 'abs' | null {
  if (!unit) return null;
  const u = unit.trim();
  if (!u) return null;
  if (/(uL|10\*3|10\*9|10e3|10e9|k\/|\/l|cells)/i.test(u)) return 'abs';
  if (u === '%' || /percent/i.test(u)) return 'pct';
  return null;
}

export function canonicalize(
  rawName: string,
  unit?: string | null,
): { canonical_key: string; display_name: string } {
  const norm = normalize(rawName);
  const hit = SYNONYM_INDEX.get(norm);
  if (hit) {
    // Unit-aware disambiguation for CBC differential pct/abs pairs: if the
    // name resolved to one side but the unit says the other, switch siblings.
    const siblingKey = DIFFERENTIAL_SIBLINGS[hit.key];
    if (siblingKey) {
      const uClass = classifyUnit(unit);
      const hitIsPct = hit.key.endsWith('_pct');
      if ((hitIsPct && uClass === 'abs') || (!hitIsPct && uClass === 'pct')) {
        const sibling = KEY_INDEX.get(siblingKey);
        if (sibling) return { canonical_key: sibling.key, display_name: sibling.display };
      }
    }
    return { canonical_key: hit.key, display_name: hit.display };
  }
  // Fallback: slug of raw name, keep raw as display.
  return { canonical_key: slugify(rawName), display_name: rawName.trim() };
}

