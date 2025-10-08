const LANGUAGE_KEYWORDS = {
  en: ['en', 'english', 'english (us)', 'anglais'],
  fr: ['fr', 'french', 'français', 'francais'],
  es: ['es', 'spanish', 'español', 'espanol'],
  ar: ['ar', 'arabic', 'العربية'],
  zh: ['zh', 'chinese', '中文', 'mandarin'],
  de: ['de', 'german', 'deutsch'],
  it: ['it', 'italian', 'italiano'],
  pt: ['pt', 'portuguese', 'português', 'portugues'],
  vi: ['vi', 'vietnamese', 'tiếng việt', 'tieng viet'],
  hi: ['hi', 'hindi', 'हिन्दी'],
  pl: ['pl', 'polish', 'polski'],
  tr: ['tr', 'turkish', 'türkçe', 'turkce']
};

export function normalizeLanguageCode(value) {
  if (value === null || value === undefined) return null;

  const raw = value.toString().trim().toLowerCase();
  for (const [code, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (keywords.includes(raw)) {
      return code;
    }
  }

  return raw || null;
}

export function languageLabelFromCode(code) {
  const normalized = normalizeLanguageCode(code);
  switch (normalized) {
    case 'en':
      return 'English';
    case 'fr':
      return 'French';
    case 'es':
      return 'Spanish';
    case 'ar':
      return 'Arabic';
    case 'zh':
      return 'Chinese';
    case 'de':
      return 'German';
    case 'it':
      return 'Italian';
    case 'pt':
      return 'Portuguese';
    case 'vi':
      return 'Vietnamese';
    case 'hi':
      return 'Hindi';
    case 'pl':
      return 'Polish';
    case 'tr':
      return 'Turkish';
    default:
      if (!normalized) return null;
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
