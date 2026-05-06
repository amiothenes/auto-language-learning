import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

import { db } from './index';
import {
  languages,
  series,
  texts,
  sentences,
  words,
  wordInstances,
  tags,
  posTags,
  textTags,
  users,
  settings,
} from './schema';
import { eq } from 'drizzle-orm';

// ========== LANGUAGE DATA ==========
const seedLanguages = [
  {
    id: 'lang_english',
    code: 'en',
    name: 'English',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/definition/{word}',
    translateURI: 'https://translate.google.com/?sl=en&tl=auto&text={word}',
    googleTTSCode: 'en-US',
    characterSubstitutions: {
      '\u2019': "'",
      '\u2018': "'",
      '\u201c': '"',
      '\u201d': '"',
    },
    sentenceSplitRegex: '[.!?]+',
  },
  {
    id: 'lang_spanish',
    code: 'es',
    name: 'Spanish',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/es/en/translation.asp?spen={word}',
    translateURI: 'https://translate.google.com/?sl=es&tl=en&text={word}',
    googleTTSCode: 'es-ES',
    characterSubstitutions: {
      '\u00e1': 'a',
      '\u00e9': 'e',
      '\u00ed': 'i',
      '\u00f3': 'o',
      '\u00fa': 'u',
      '\u00f1': 'n',
    },
    sentenceSplitRegex: '[.!?\u00bf\u00a1]+',
  },
  {
    id: 'lang_french',
    code: 'fr',
    name: 'French',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/fren/{word}',
    translateURI: 'https://translate.google.com/?sl=fr&tl=en&text={word}',
    googleTTSCode: 'fr-FR',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.!?]+',
  },
  {
    id: 'lang_german',
    code: 'de',
    name: 'German',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/deen/{word}',
    translateURI: 'https://translate.google.com/?sl=de&tl=en&text={word}',
    googleTTSCode: 'de-DE',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.!?]+',
  },
  {
    id: 'lang_chinese',
    code: 'zh',
    name: 'Chinese (Simplified)',
    isRTL: false,
    dictURI: 'https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb={word}',
    translateURI: 'https://translate.google.com/?sl=zh-CN&tl=en&text={word}',
    googleTTSCode: 'zh-CN',
    characterSubstitutions: {},
    sentenceSplitRegex: '[\u3002\uff01\uff1f]+',
  },
  {
    id: 'lang_japanese',
    code: 'ja',
    name: 'Japanese',
    isRTL: false,
    dictURI: 'https://jisho.org/search/{word}',
    translateURI: 'https://translate.google.com/?sl=ja&tl=en&text={word}',
    googleTTSCode: 'ja-JP',
    characterSubstitutions: {},
    sentenceSplitRegex: '[\u3002\uff01\uff1f]+',
  },
  {
    id: 'lang_arabic',
    code: 'ar',
    name: 'Arabic',
    isRTL: true,
    dictURI: 'https://www.almaany.com/en/dict/ar-en/{word}',
    translateURI: 'https://translate.google.com/?sl=ar&tl=en&text={word}',
    googleTTSCode: 'ar-SA',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.\u061f\u061b]+',
  },
  {
    id: 'lang_russian',
    code: 'ru',
    name: 'Russian',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/ruen/{word}',
    translateURI: 'https://translate.google.com/?sl=ru&tl=en&text={word}',
    googleTTSCode: 'ru-RU',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.!?]+',
  },
  {
    id: 'lang_korean',
    code: 'ko',
    name: 'Korean',
    isRTL: false,
    dictURI: 'https://krdict.korean.go.kr/eng/dicSearch/search?nation=eng&nationCode=6&ParaWordNo=&mainSearchWord={word}',
    translateURI: 'https://translate.google.com/?sl=ko&tl=en&text={word}',
    googleTTSCode: 'ko-KR',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.!?\u3002]+',
  },
];

// ========== SERIES DATA ==========
const seedSeries = [
  {
    id: 'series_spanish_news',
    name: 'Spanish News Articles',
    description: 'Collection of news articles from Spanish media',
    languageId: 'lang_spanish',
  },
  {
    id: 'series_french_lit',
    name: 'French Literature',
    description: 'Excerpts from classic French novels',
    languageId: 'lang_french',
  },
];

// ========== TEXT DATA ==========
const seedTexts = [
  {
    id: 'text_es_climate',
    title: 'El Cambio Climático',
    content:
      'El cambio climático es uno de los mayores desafíos que enfrenta la humanidad. Los científicos advierten que debemos actuar ahora para reducir las emisiones de carbono. Las temperaturas globales continúan aumentando cada año. Necesitamos soluciones sostenibles para proteger nuestro planeta.',
    languageId: 'lang_spanish',
    seriesId: 'series_spanish_news',
    sourceURI: 'https://example.com/climate',
  },
  {
    id: 'text_es_tech',
    title: 'La Tecnología Moderna',
    content:
      'La inteligencia artificial está transformando nuestra sociedad. Las computadoras pueden aprender y mejorar con el tiempo. Esta tecnología tiene muchas aplicaciones prácticas en medicina, educación y negocios. Sin embargo, también presenta desafíos éticos importantes.',
    languageId: 'lang_spanish',
    seriesId: 'series_spanish_news',
    sourceURI: 'https://example.com/tech',
  },
  {
    id: 'text_fr_culture',
    title: 'La Culture Française',
    content:
      "La France est célèbre pour sa culture riche et diversifiée. Paris, la capitale, attire des millions de touristes chaque année. Les musées français contiennent des œuvres d'art inestimables. La cuisine française est reconnue dans le monde entier.",
    languageId: 'lang_french',
    seriesId: 'series_french_lit',
    sourceURI: 'https://example.com/culture',
  },
  {
    id: 'text_es_education',
    title: 'La Educación del Futuro',
    content:
      'La educación está evolucionando rápidamente con nuevas tecnologías. Los estudiantes pueden acceder a recursos educativos desde cualquier lugar. Las plataformas digitales facilitan el aprendizaje personalizado. Los profesores adoptan métodos innovadores de enseñanza.',
    languageId: 'lang_spanish',
    seriesId: 'series_spanish_news',
  },
  {
    id: 'text_fr_histoire',
    title: "L'Histoire de France",
    content:
      "La Révolution française a transformé la société européenne. Les idées de liberté et égalité se sont répandues rapidement. Napoléon Bonaparte est devenu empereur et a conquis une grande partie de l'Europe. Cette période a profondément influencé l'histoire moderne.",
    languageId: 'lang_french',
    seriesId: 'series_french_lit',
  },
  {
    id: 'text_es_health',
    title: 'La Salud y el Bienestar',
    content:
      'Mantener una buena salud requiere hábitos saludables diarios. El ejercicio regular mejora la condición física y mental. Una alimentación equilibrada proporciona los nutrientes necesarios. El descanso adecuado es esencial para la recuperación del cuerpo.',
    languageId: 'lang_spanish',
    seriesId: 'series_spanish_news',
  },
];

// ========== WORDS DATA ==========
// Spanish words with status distribution: 20% NEWLY_SEEN, 30% FAMILIAR, 30% KNOWN, 15% WELL_KNOWN, 5% IGNORE
const seedWords = [
  // NEWLY_SEEN (20%) - 24 words
  { id: 'word_es_001', lemma: 'cambio', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'change', dictionaryFrequency: 85, userFrequency: 1 },
  { id: 'word_es_002', lemma: 'climático', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'climate', dictionaryFrequency: 45, userFrequency: 1 },
  { id: 'word_es_003', lemma: 'desafío', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'challenge', dictionaryFrequency: 60, userFrequency: 1 },
  { id: 'word_es_004', lemma: 'humanidad', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'humanity', dictionaryFrequency: 55, userFrequency: 1 },
  { id: 'word_es_005', lemma: 'advertir', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to warn', dictionaryFrequency: 65, userFrequency: 1 },
  { id: 'word_es_006', lemma: 'reducir', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to reduce', dictionaryFrequency: 70, userFrequency: 1 },
  { id: 'word_es_007', lemma: 'emisión', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'emission', dictionaryFrequency: 50, userFrequency: 1 },
  { id: 'word_es_008', lemma: 'carbono', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'carbon', dictionaryFrequency: 40, userFrequency: 1 },
  { id: 'word_es_009', lemma: 'temperatura', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'temperature', dictionaryFrequency: 68, userFrequency: 1 },
  { id: 'word_es_010', lemma: 'global', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'global', dictionaryFrequency: 82, userFrequency: 1 },
  { id: 'word_es_011', lemma: 'continuar', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to continue', dictionaryFrequency: 88, userFrequency: 1 },
  { id: 'word_es_012', lemma: 'aumentar', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to increase', dictionaryFrequency: 78, userFrequency: 1 },
  { id: 'word_es_013', lemma: 'sostenible', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'sustainable', dictionaryFrequency: 52, userFrequency: 1 },
  { id: 'word_es_014', lemma: 'proteger', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to protect', dictionaryFrequency: 72, userFrequency: 1 },
  { id: 'word_es_015', lemma: 'planeta', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'planet', dictionaryFrequency: 63, userFrequency: 1 },
  { id: 'word_es_016', lemma: 'inteligencia', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'intelligence', dictionaryFrequency: 70, userFrequency: 1 },
  { id: 'word_es_017', lemma: 'artificial', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'artificial', dictionaryFrequency: 58, userFrequency: 1 },
  { id: 'word_es_018', lemma: 'transformar', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to transform', dictionaryFrequency: 66, userFrequency: 1 },
  { id: 'word_es_019', lemma: 'sociedad', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'society', dictionaryFrequency: 85, userFrequency: 1 },
  { id: 'word_es_020', lemma: 'computadora', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'computer', dictionaryFrequency: 75, userFrequency: 1 },
  { id: 'word_es_021', lemma: 'aprender', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to learn', dictionaryFrequency: 90, userFrequency: 1 },
  { id: 'word_es_022', lemma: 'mejorar', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'to improve', dictionaryFrequency: 85, userFrequency: 1 },
  { id: 'word_es_023', lemma: 'aplicación', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'application', dictionaryFrequency: 80, userFrequency: 1 },
  { id: 'word_es_024', lemma: 'práctico', languageId: 'lang_spanish', status: 'NEWLY_SEEN', translation: 'practical', dictionaryFrequency: 77, userFrequency: 1 },

  // FAMILIAR (30%) - 36 words
  { id: 'word_es_025', lemma: 'medicina', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'medicine', dictionaryFrequency: 78, userFrequency: 3 },
  { id: 'word_es_026', lemma: 'educación', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'education', dictionaryFrequency: 88, userFrequency: 4 },
  { id: 'word_es_027', lemma: 'negocio', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'business', dictionaryFrequency: 82, userFrequency: 3 },
  { id: 'word_es_028', lemma: 'presentar', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'to present', dictionaryFrequency: 85, userFrequency: 2 },
  { id: 'word_es_029', lemma: 'ético', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'ethical', dictionaryFrequency: 55, userFrequency: 2 },
  { id: 'word_es_030', lemma: 'importante', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'important', dictionaryFrequency: 95, userFrequency: 5 },
  { id: 'word_es_031', lemma: 'evolucionar', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'to evolve', dictionaryFrequency: 60, userFrequency: 2 },
  { id: 'word_es_032', lemma: 'rápidamente', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'quickly', dictionaryFrequency: 80, userFrequency: 3 },
  { id: 'word_es_033', lemma: 'nuevo', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'new', dictionaryFrequency: 98, userFrequency: 8 },
  { id: 'word_es_034', lemma: 'tecnología', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'technology', dictionaryFrequency: 90, userFrequency: 6 },
  { id: 'word_es_035', lemma: 'estudiante', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'student', dictionaryFrequency: 85, userFrequency: 4 },
  { id: 'word_es_036', lemma: 'acceder', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'to access', dictionaryFrequency: 70, userFrequency: 2 },
  { id: 'word_es_037', lemma: 'recurso', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'resource', dictionaryFrequency: 75, userFrequency: 3 },
  { id: 'word_es_038', lemma: 'educativo', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'educational', dictionaryFrequency: 72, userFrequency: 3 },
  { id: 'word_es_039', lemma: 'cualquier', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'any', dictionaryFrequency: 92, userFrequency: 5 },
  { id: 'word_es_040', lemma: 'lugar', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'place', dictionaryFrequency: 94, userFrequency: 6 },
  { id: 'word_es_041', lemma: 'plataforma', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'platform', dictionaryFrequency: 68, userFrequency: 3 },
  { id: 'word_es_042', lemma: 'digital', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'digital', dictionaryFrequency: 80, userFrequency: 4 },
  { id: 'word_es_043', lemma: 'facilitar', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'to facilitate', dictionaryFrequency: 65, userFrequency: 2 },
  { id: 'word_es_044', lemma: 'aprendizaje', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'learning', dictionaryFrequency: 82, userFrequency: 4 },
  { id: 'word_es_045', lemma: 'personalizado', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'personalized', dictionaryFrequency: 58, userFrequency: 2 },
  { id: 'word_es_046', lemma: 'profesor', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'teacher', dictionaryFrequency: 88, userFrequency: 5 },
  { id: 'word_es_047', lemma: 'adoptar', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'to adopt', dictionaryFrequency: 70, userFrequency: 2 },
  { id: 'word_es_048', lemma: 'método', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'method', dictionaryFrequency: 83, userFrequency: 3 },
  { id: 'word_es_049', lemma: 'innovador', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'innovative', dictionaryFrequency: 62, userFrequency: 2 },
  { id: 'word_es_050', lemma: 'enseñanza', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'teaching', dictionaryFrequency: 80, userFrequency: 3 },
  { id: 'word_es_051', lemma: 'salud', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'health', dictionaryFrequency: 92, userFrequency: 5 },
  { id: 'word_es_052', lemma: 'bienestar', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'well-being', dictionaryFrequency: 70, userFrequency: 3 },
  { id: 'word_es_053', lemma: 'mantener', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'to maintain', dictionaryFrequency: 87, userFrequency: 4 },
  { id: 'word_es_054', lemma: 'bueno', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'good', dictionaryFrequency: 99, userFrequency: 12 },
  { id: 'word_es_055', lemma: 'requerir', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'to require', dictionaryFrequency: 78, userFrequency: 3 },
  { id: 'word_es_056', lemma: 'hábito', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'habit', dictionaryFrequency: 72, userFrequency: 3 },
  { id: 'word_es_057', lemma: 'saludable', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'healthy', dictionaryFrequency: 75, userFrequency: 4 },
  { id: 'word_es_058', lemma: 'diario', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'daily', dictionaryFrequency: 85, userFrequency: 4 },
  { id: 'word_es_059', lemma: 'ejercicio', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'exercise', dictionaryFrequency: 80, userFrequency: 4 },
  { id: 'word_es_060', lemma: 'regular', languageId: 'lang_spanish', status: 'FAMILIAR', translation: 'regular', dictionaryFrequency: 82, userFrequency: 3 },

  // KNOWN (30%) - 36 words
  { id: 'word_es_061', lemma: 'condición', languageId: 'lang_spanish', status: 'KNOWN', translation: 'condition', dictionaryFrequency: 85, userFrequency: 8 },
  { id: 'word_es_062', lemma: 'físico', languageId: 'lang_spanish', status: 'KNOWN', translation: 'physical', dictionaryFrequency: 88, userFrequency: 7 },
  { id: 'word_es_063', lemma: 'mental', languageId: 'lang_spanish', status: 'KNOWN', translation: 'mental', dictionaryFrequency: 82, userFrequency: 6 },
  { id: 'word_es_064', lemma: 'alimentación', languageId: 'lang_spanish', status: 'KNOWN', translation: 'nutrition', dictionaryFrequency: 75, userFrequency: 5 },
  { id: 'word_es_065', lemma: 'equilibrado', languageId: 'lang_spanish', status: 'KNOWN', translation: 'balanced', dictionaryFrequency: 68, userFrequency: 4 },
  { id: 'word_es_066', lemma: 'proporcionar', languageId: 'lang_spanish', status: 'KNOWN', translation: 'to provide', dictionaryFrequency: 80, userFrequency: 6 },
  { id: 'word_es_067', lemma: 'nutriente', languageId: 'lang_spanish', status: 'KNOWN', translation: 'nutrient', dictionaryFrequency: 62, userFrequency: 4 },
  { id: 'word_es_068', lemma: 'necesario', languageId: 'lang_spanish', status: 'KNOWN', translation: 'necessary', dictionaryFrequency: 92, userFrequency: 10 },
  { id: 'word_es_069', lemma: 'descanso', languageId: 'lang_spanish', status: 'KNOWN', translation: 'rest', dictionaryFrequency: 70, userFrequency: 5 },
  { id: 'word_es_070', lemma: 'adecuado', languageId: 'lang_spanish', status: 'KNOWN', translation: 'adequate', dictionaryFrequency: 78, userFrequency: 6 },
  { id: 'word_es_071', lemma: 'esencial', languageId: 'lang_spanish', status: 'KNOWN', translation: 'essential', dictionaryFrequency: 80, userFrequency: 7 },
  { id: 'word_es_072', lemma: 'recuperación', languageId: 'lang_spanish', status: 'KNOWN', translation: 'recovery', dictionaryFrequency: 72, userFrequency: 5 },
  { id: 'word_es_073', lemma: 'cuerpo', languageId: 'lang_spanish', status: 'KNOWN', translation: 'body', dictionaryFrequency: 90, userFrequency: 9 },
  { id: 'word_es_074', lemma: 'ser', languageId: 'lang_spanish', status: 'KNOWN', translation: 'to be', dictionaryFrequency: 100, userFrequency: 25 },
  { id: 'word_es_075', lemma: 'estar', languageId: 'lang_spanish', status: 'KNOWN', translation: 'to be (temporary)', dictionaryFrequency: 100, userFrequency: 22 },
  { id: 'word_es_076', lemma: 'poder', languageId: 'lang_spanish', status: 'KNOWN', translation: 'to be able to', dictionaryFrequency: 98, userFrequency: 18 },
  { id: 'word_es_077', lemma: 'deber', languageId: 'lang_spanish', status: 'KNOWN', translation: 'should/must', dictionaryFrequency: 95, userFrequency: 15 },
  { id: 'word_es_078', lemma: 'tener', languageId: 'lang_spanish', status: 'KNOWN', translation: 'to have', dictionaryFrequency: 99, userFrequency: 20 },
  { id: 'word_es_079', lemma: 'hacer', languageId: 'lang_spanish', status: 'KNOWN', translation: 'to do/make', dictionaryFrequency: 98, userFrequency: 19 },
  { id: 'word_es_080', lemma: 'tiempo', languageId: 'lang_spanish', status: 'KNOWN', translation: 'time', dictionaryFrequency: 95, userFrequency: 16 },
  { id: 'word_es_081', lemma: 'año', languageId: 'lang_spanish', status: 'KNOWN', translation: 'year', dictionaryFrequency: 96, userFrequency: 14 },
  { id: 'word_es_082', lemma: 'mundo', languageId: 'lang_spanish', status: 'KNOWN', translation: 'world', dictionaryFrequency: 93, userFrequency: 13 },
  { id: 'word_es_083', lemma: 'parte', languageId: 'lang_spanish', status: 'KNOWN', translation: 'part', dictionaryFrequency: 92, userFrequency: 12 },
  { id: 'word_es_084', lemma: 'forma', languageId: 'lang_spanish', status: 'KNOWN', translation: 'way/form', dictionaryFrequency: 90, userFrequency: 11 },
  { id: 'word_es_085', lemma: 'trabajo', languageId: 'lang_spanish', status: 'KNOWN', translation: 'work', dictionaryFrequency: 94, userFrequency: 10 },
  { id: 'word_es_086', lemma: 'vida', languageId: 'lang_spanish', status: 'KNOWN', translation: 'life', dictionaryFrequency: 95, userFrequency: 13 },
  { id: 'word_es_087', lemma: 'país', languageId: 'lang_spanish', status: 'KNOWN', translation: 'country', dictionaryFrequency: 91, userFrequency: 9 },
  { id: 'word_es_088', lemma: 'día', languageId: 'lang_spanish', status: 'KNOWN', translation: 'day', dictionaryFrequency: 97, userFrequency: 15 },
  { id: 'word_es_089', lemma: 'casa', languageId: 'lang_spanish', status: 'KNOWN', translation: 'house', dictionaryFrequency: 93, userFrequency: 11 },
  { id: 'word_es_090', lemma: 'persona', languageId: 'lang_spanish', status: 'KNOWN', translation: 'person', dictionaryFrequency: 94, userFrequency: 12 },
  { id: 'word_es_091', lemma: 'problema', languageId: 'lang_spanish', status: 'KNOWN', translation: 'problem', dictionaryFrequency: 88, userFrequency: 10 },
  { id: 'word_es_092', lemma: 'sistema', languageId: 'lang_spanish', status: 'KNOWN', translation: 'system', dictionaryFrequency: 87, userFrequency: 9 },
  { id: 'word_es_093', lemma: 'momento', languageId: 'lang_spanish', status: 'KNOWN', translation: 'moment', dictionaryFrequency: 89, userFrequency: 10 },
  { id: 'word_es_094', lemma: 'mano', languageId: 'lang_spanish', status: 'KNOWN', translation: 'hand', dictionaryFrequency: 86, userFrequency: 8 },
  { id: 'word_es_095', lemma: 'caso', languageId: 'lang_spanish', status: 'KNOWN', translation: 'case', dictionaryFrequency: 88, userFrequency: 9 },
  { id: 'word_es_096', lemma: 'grupo', languageId: 'lang_spanish', status: 'KNOWN', translation: 'group', dictionaryFrequency: 85, userFrequency: 8 },

  // WELL_KNOWN (15%) - 18 words
  { id: 'word_es_097', lemma: 'el', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'the (masculine)', dictionaryFrequency: 100, userFrequency: 50 },
  { id: 'word_es_098', lemma: 'la', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'the (feminine)', dictionaryFrequency: 100, userFrequency: 48 },
  { id: 'word_es_099', lemma: 'de', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'of/from', dictionaryFrequency: 100, userFrequency: 45 },
  { id: 'word_es_100', lemma: 'que', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'that/which', dictionaryFrequency: 100, userFrequency: 42 },
  { id: 'word_es_101', lemma: 'y', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'and', dictionaryFrequency: 100, userFrequency: 40 },
  { id: 'word_es_102', lemma: 'a', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'to/at', dictionaryFrequency: 100, userFrequency: 38 },
  { id: 'word_es_103', lemma: 'en', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'in/on', dictionaryFrequency: 100, userFrequency: 36 },
  { id: 'word_es_104', lemma: 'un', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'a/an (masculine)', dictionaryFrequency: 100, userFrequency: 35 },
  { id: 'word_es_105', lemma: 'una', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'a/an (feminine)', dictionaryFrequency: 100, userFrequency: 34 },
  { id: 'word_es_106', lemma: 'los', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'the (masculine plural)', dictionaryFrequency: 100, userFrequency: 32 },
  { id: 'word_es_107', lemma: 'las', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'the (feminine plural)', dictionaryFrequency: 100, userFrequency: 30 },
  { id: 'word_es_108', lemma: 'con', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'with', dictionaryFrequency: 99, userFrequency: 28 },
  { id: 'word_es_109', lemma: 'por', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'by/for', dictionaryFrequency: 99, userFrequency: 26 },
  { id: 'word_es_110', lemma: 'para', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'for/to', dictionaryFrequency: 99, userFrequency: 25 },
  { id: 'word_es_111', lemma: 'no', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'no/not', dictionaryFrequency: 100, userFrequency: 30 },
  { id: 'word_es_112', lemma: 'se', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'himself/herself (reflexive)', dictionaryFrequency: 98, userFrequency: 24 },
  { id: 'word_es_113', lemma: 'como', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'like/as', dictionaryFrequency: 97, userFrequency: 22 },
  { id: 'word_es_114', lemma: 'su', languageId: 'lang_spanish', status: 'WELL_KNOWN', translation: 'his/her/their', dictionaryFrequency: 98, userFrequency: 23 },

  // IGNORE (5%) - 6 words (numbers, proper nouns)
  { id: 'word_es_115', lemma: 'París', languageId: 'lang_spanish', status: 'IGNORE', translation: 'Paris', dictionaryFrequency: 0, userFrequency: 1 },
  { id: 'word_es_116', lemma: 'Francia', languageId: 'lang_spanish', status: 'IGNORE', translation: 'France', dictionaryFrequency: 0, userFrequency: 1 },
  { id: 'word_es_117', lemma: 'Europa', languageId: 'lang_spanish', status: 'IGNORE', translation: 'Europe', dictionaryFrequency: 0, userFrequency: 1 },
  { id: 'word_es_118', lemma: 'Napoleón', languageId: 'lang_spanish', status: 'IGNORE', translation: 'Napoleon', dictionaryFrequency: 0, userFrequency: 1 },
  { id: 'word_es_119', lemma: '2024', languageId: 'lang_spanish', status: 'IGNORE', translation: '2024', dictionaryFrequency: 0, userFrequency: 1 },
  { id: 'word_es_120', lemma: 'COVID-19', languageId: 'lang_spanish', status: 'IGNORE', translation: 'COVID-19', dictionaryFrequency: 0, userFrequency: 1 },

  // French words (10 basic words)
  { id: 'word_fr_001', lemma: 'le', languageId: 'lang_french', status: 'WELL_KNOWN', translation: 'the (masculine)', dictionaryFrequency: 100, userFrequency: 20 },
  { id: 'word_fr_002', lemma: 'la', languageId: 'lang_french', status: 'WELL_KNOWN', translation: 'the (feminine)', dictionaryFrequency: 100, userFrequency: 18 },
  { id: 'word_fr_003', lemma: 'de', languageId: 'lang_french', status: 'WELL_KNOWN', translation: 'of/from', dictionaryFrequency: 100, userFrequency: 16 },
  { id: 'word_fr_004', lemma: 'et', languageId: 'lang_french', status: 'WELL_KNOWN', translation: 'and', dictionaryFrequency: 100, userFrequency: 15 },
  { id: 'word_fr_005', lemma: 'être', languageId: 'lang_french', status: 'KNOWN', translation: 'to be', dictionaryFrequency: 100, userFrequency: 12 },
  { id: 'word_fr_006', lemma: 'avoir', languageId: 'lang_french', status: 'KNOWN', translation: 'to have', dictionaryFrequency: 99, userFrequency: 10 },
  { id: 'word_fr_007', lemma: 'France', languageId: 'lang_french', status: 'KNOWN', translation: 'France', dictionaryFrequency: 85, userFrequency: 8 },
  { id: 'word_fr_008', lemma: 'Paris', languageId: 'lang_french', status: 'KNOWN', translation: 'Paris', dictionaryFrequency: 80, userFrequency: 7 },
  { id: 'word_fr_009', lemma: 'culture', languageId: 'lang_french', status: 'FAMILIAR', translation: 'culture', dictionaryFrequency: 75, userFrequency: 3 },
  { id: 'word_fr_010', lemma: 'célèbre', languageId: 'lang_french', status: 'FAMILIAR', translation: 'famous', dictionaryFrequency: 70, userFrequency: 2 },
];

// ========== TAGS DATA ==========
const seedTags = [
  { id: 'tag_noun', name: 'Noun', color: '210 40% 50%' },
  { id: 'tag_verb', name: 'Verb', color: '120 40% 50%' },
  { id: 'tag_adjective', name: 'Adjective', color: '30 40% 50%' },
  { id: 'tag_adverb', name: 'Adverb', color: '270 40% 50%' },
  { id: 'tag_preposition', name: 'Preposition', color: '0 40% 50%' },
  { id: 'tag_article', name: 'Article', color: '180 40% 50%' },
  { id: 'tag_pronoun', name: 'Pronoun', color: '300 40% 50%' },
  { id: 'tag_news', name: 'News', color: '15 70% 45%' },
  { id: 'tag_technology', name: 'Technology', color: '200 70% 45%' },
  { id: 'tag_education', name: 'Education', color: '150 70% 45%' },
];

// ========== SETTINGS DATA ==========
const seedSettings = [
  { id: 'setting_001', key: 'user.currentLanguage', value: 'lang_spanish' },
  { id: 'setting_002', key: 'reader.font.size', value: 'medium' },
  { id: 'setting_003', key: 'reader.highlight.intensity', value: '70' },
  { id: 'setting_004', key: 'dashboard.graph.range', value: '30days' },
  { id: 'setting_005', key: 'dashboard.recent.count', value: '10' },
  { id: 'setting_006', key: 'app.theme', value: 'light' },
];

// ========== SEED FUNCTION ==========
async function seed() {
  console.log('🌱 Starting comprehensive database seed...\n');

  try {
    // 1. Seed Languages
    console.log('📚 Seeding languages...');
    for (const language of seedLanguages) {
      await db.insert(languages).values(language).onConflictDoNothing();
    }
    console.log(`  ✓ ${seedLanguages.length} languages\n`);

    // 2. Seed Series
    console.log('📁 Seeding series...');
    for (const s of seedSeries) {
      await db.insert(series).values(s).onConflictDoNothing();
    }
    console.log(`  ✓ ${seedSeries.length} series\n`);

    // 3. Seed Words
    console.log('📖 Seeding words...');
    for (const word of seedWords) {
      await db.insert(words).values(word).onConflictDoNothing();
    }
    console.log(`  ✓ ${seedWords.length} words`);
    console.log(`    - ${seedWords.filter((w) => w.status === 'NEWLY_SEEN').length} NEWLY_SEEN (${((seedWords.filter((w) => w.status === 'NEWLY_SEEN').length / seedWords.length) * 100).toFixed(0)}%)`);
    console.log(`    - ${seedWords.filter((w) => w.status === 'FAMILIAR').length} FAMILIAR (${((seedWords.filter((w) => w.status === 'FAMILIAR').length / seedWords.length) * 100).toFixed(0)}%)`);
    console.log(`    - ${seedWords.filter((w) => w.status === 'KNOWN').length} KNOWN (${((seedWords.filter((w) => w.status === 'KNOWN').length / seedWords.length) * 100).toFixed(0)}%)`);
    console.log(`    - ${seedWords.filter((w) => w.status === 'WELL_KNOWN').length} WELL_KNOWN (${((seedWords.filter((w) => w.status === 'WELL_KNOWN').length / seedWords.length) * 100).toFixed(0)}%)`);
    console.log(`    - ${seedWords.filter((w) => w.status === 'IGNORE').length} IGNORE (${((seedWords.filter((w) => w.status === 'IGNORE').length / seedWords.length) * 100).toFixed(0)}%)\n`);

    // 4. Seed Tags
    console.log('🏷️  Seeding tags...');
    for (const tag of seedTags) {
      await db.insert(tags).values(tag).onConflictDoNothing();
    }
    console.log(`  ✓ ${seedTags.length} tags\n`);

    // 5. Seed Texts with calculated statistics
    console.log('📄 Seeding texts with word instances and sentences...');
    for (const text of seedTexts) {
      // Simple word tokenization (split by spaces and punctuation)
      const textWords = text.content
        .toLowerCase()
        .split(/[\s.,!?;:]+/)
        .filter((w) => w.length > 0);

      const uniqueWords = new Set(textWords);
      const wordCount = textWords.length;
      const uniqueWordCount = uniqueWords.size;

      // Calculate known percentage based on word statuses
      // For demo purposes, we'll match words to our seed data
      const knownWords = textWords.filter((word) => {
        const wordRecord = seedWords.find(
          (w) => w.lemma.toLowerCase() === word && w.languageId === text.languageId
        );
        return wordRecord && ['KNOWN', 'WELL_KNOWN'].includes(wordRecord.status);
      });
      const knownPercentage = wordCount > 0 ? (knownWords.length / wordCount) * 100 : 0;

      // Insert text with statistics
      await db
        .insert(texts)
        .values({
          ...text,
          wordCount,
          uniqueWordCount,
          knownPercentage: Math.round(knownPercentage * 10) / 10, // Round to 1 decimal
        })
        .onConflictDoNothing();

      // Extract sentences (split by period, exclamation, question mark)
      const sentenceContents = text.content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      for (let i = 0; i < sentenceContents.length; i++) {
        await db
          .insert(sentences)
          .values({
            id: `${text.id}_sent_${i + 1}`,
            textId: text.id,
            content: sentenceContents[i].trim(),
            order: i + 1,
          })
          .onConflictDoNothing();
      }

      // Create word instances (link words in text to word records)
      let position = 0;
      for (const word of textWords) {
        const wordRecord = seedWords.find(
          (w) => w.lemma.toLowerCase() === word && w.languageId === text.languageId
        );
        if (wordRecord) {
          await db
            .insert(wordInstances)
            .values({
              id: `${text.id}_inst_${position}`,
              textId: text.id,
              wordId: wordRecord.id,
              surfaceForm: word,
              position,
            })
            .onConflictDoNothing();
        }
        position++;
      }

      console.log(`  ✓ ${text.title} (${wordCount} words, ${knownPercentage.toFixed(1)}% known)`);
    }
    console.log();

    // 6. Seed Text Tags
    console.log('🔗 Seeding text tags...');
    const textTagMappings = [
      { textId: 'text_es_climate', tagId: 'tag_news' },
      { textId: 'text_es_tech', tagId: 'tag_technology' },
      { textId: 'text_es_tech', tagId: 'tag_news' },
      { textId: 'text_es_education', tagId: 'tag_education' },
      { textId: 'text_es_education', tagId: 'tag_technology' },
    ];
    for (const mapping of textTagMappings) {
      await db
        .insert(textTags)
        .values({
          id: `texttag_${mapping.textId}_${mapping.tagId}`,
          ...mapping,
        })
        .onConflictDoNothing();
    }
    console.log(`  ✓ ${textTagMappings.length} text tag associations\n`);

    // 7. Seed POS Tags
    console.log('🏷️  Seeding POS tags...');
    const posTagMappings = [
      { wordId: 'word_es_074', tagId: 'tag_verb' }, // ser
      { wordId: 'word_es_075', tagId: 'tag_verb' }, // estar
      { wordId: 'word_es_097', tagId: 'tag_article' }, // el
      { wordId: 'word_es_098', tagId: 'tag_article' }, // la
      { wordId: 'word_es_001', tagId: 'tag_noun' }, // cambio
      { wordId: 'word_es_019', tagId: 'tag_noun' }, // sociedad
    ];
    for (const mapping of posTagMappings) {
      await db
        .insert(posTags)
        .values({
          id: `postag_${mapping.wordId}_${mapping.tagId}`,
          ...mapping,
        })
        .onConflictDoNothing();
    }
    console.log(`  ✓ ${posTagMappings.length} POS tag associations\n`);

    // 8. Seed Settings
    console.log('⚙️  Seeding settings...');
    for (const setting of seedSettings) {
      await db.insert(settings).values(setting).onConflictDoNothing();
    }
    console.log(`  ✓ ${seedSettings.length} settings\n`);

    // 9. Seed Default User
    console.log('👤 Seeding default user...');
    await db
      .insert(users)
      .values({
        id: 'user_default',
        name: 'Demo User',
        defaultLanguageId: 'lang_spanish',
      })
      .onConflictDoNothing();
    console.log('  ✓ 1 user\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ Database seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📚 ${seedLanguages.length} languages`);
    console.log(`📁 ${seedSeries.length} series`);
    console.log(`📄 ${seedTexts.length} texts`);
    console.log(`📖 ${seedWords.length} words`);
    console.log(`🏷️  ${seedTags.length} tags`);
    console.log(`⚙️  ${seedSettings.length} settings`);
    console.log(`👤 1 user`);
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }

  process.exit(0);
}

seed();
