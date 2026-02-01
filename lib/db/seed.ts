import { db } from './index';
import { languages } from './schema';

const seedLanguages = [
  {
    code: 'en',
    name: 'English',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/definition/{word}',
    translateURI: 'https://translate.google.com/?sl=en&tl=auto&text={word}',
    googleTTSCode: 'en-US',
    characterSubstitutions: {
      '\u2019': "'", // Right single quotation mark to apostrophe
      '\u2018': "'", // Left single quotation mark to apostrophe
      '\u201c': '"', // Left double quotation mark
      '\u201d': '"', // Right double quotation mark
    },
    sentenceSplitRegex: '[.!?]+',
  },
  {
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
    code: 'fr',
    name: 'French',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/fren/{word}',
    translateURI: 'https://translate.google.com/?sl=fr&tl=en&text={word}',
    googleTTSCode: 'fr-FR',
    characterSubstitutions: {
      '\u00e0': 'a',
      '\u00e2': 'a',
      '\u00e9': 'e',
      '\u00e8': 'e',
      '\u00ea': 'e',
      '\u00eb': 'e',
      '\u00ee': 'i',
      '\u00ef': 'i',
      '\u00f4': 'o',
      '\u00f9': 'u',
      '\u00fb': 'u',
      '\u00fc': 'u',
      '\u00e7': 'c',
    },
    sentenceSplitRegex: '[.!?]+',
  },
  {
    code: 'de',
    name: 'German',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/deen/{word}',
    translateURI: 'https://translate.google.com/?sl=de&tl=en&text={word}',
    googleTTSCode: 'de-DE',
    characterSubstitutions: {
      '\u00e4': 'a',
      '\u00f6': 'o',
      '\u00fc': 'u',
      '\u00df': 'ss',
    },
    sentenceSplitRegex: '[.!?]+',
  },
  {
    code: 'zh',
    name: 'Chinese (Simplified)',
    isRTL: false,
    dictURI: 'https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb={word}',
    translateURI: 'https://translate.google.com/?sl=zh-CN&tl=en&text={word}',
    googleTTSCode: 'zh-CN',
    characterSubstitutions: {},
    sentenceSplitRegex: '[\u3002\uff01\uff1f]+', // Chinese period, exclamation, question mark
  },
  {
    code: 'ja',
    name: 'Japanese',
    isRTL: false,
    dictURI: 'https://jisho.org/search/{word}',
    translateURI: 'https://translate.google.com/?sl=ja&tl=en&text={word}',
    googleTTSCode: 'ja-JP',
    characterSubstitutions: {},
    sentenceSplitRegex: '[\u3002\uff01\uff1f]+', // Japanese period, exclamation, question mark
  },
  {
    code: 'ar',
    name: 'Arabic',
    isRTL: true,
    dictURI: 'https://www.almaany.com/en/dict/ar-en/{word}',
    translateURI: 'https://translate.google.com/?sl=ar&tl=en&text={word}',
    googleTTSCode: 'ar-SA',
    characterSubstitutions: {
      '\u064b': '', // Fathatan
      '\u064c': '', // Dammatan
      '\u064d': '', // Kasratan
      '\u064e': '', // Fatha
      '\u064f': '', // Damma
      '\u0650': '', // Kasra
      '\u0651': '', // Shadda
      '\u0652': '', // Sukun
    },
    sentenceSplitRegex: '[.\u061f\u061b]+', // Period, Arabic question mark, Arabic semicolon
  },
  {
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
    code: 'pt',
    name: 'Portuguese',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/pten/{word}',
    translateURI: 'https://translate.google.com/?sl=pt&tl=en&text={word}',
    googleTTSCode: 'pt-PT',
    characterSubstitutions: {
      '\u00e0': 'a',
      '\u00e1': 'a',
      '\u00e2': 'a',
      '\u00e3': 'a',
      '\u00e7': 'c',
      '\u00e9': 'e',
      '\u00ea': 'e',
      '\u00ed': 'i',
      '\u00f3': 'o',
      '\u00f4': 'o',
      '\u00f5': 'o',
      '\u00fa': 'u',
      '\u00fc': 'u',
    },
    sentenceSplitRegex: '[.!?]+',
  },
  {
    code: 'it',
    name: 'Italian',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/iten/{word}',
    translateURI: 'https://translate.google.com/?sl=it&tl=en&text={word}',
    googleTTSCode: 'it-IT',
    characterSubstitutions: {
      '\u00e0': 'a',
      '\u00e8': 'e',
      '\u00e9': 'e',
      '\u00ec': 'i',
      '\u00f2': 'o',
      '\u00f9': 'u',
    },
    sentenceSplitRegex: '[.!?]+',
  },
  {
    code: 'ko',
    name: 'Korean',
    isRTL: false,
    dictURI: 'https://ko.dict.naver.com/#/search?query={word}',
    translateURI: 'https://translate.google.com/?sl=ko&tl=en&text={word}',
    googleTTSCode: 'ko-KR',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.\uff01\uff1f]+', // Period, fullwidth exclamation, fullwidth question mark
  },
  {
    code: 'nl',
    name: 'Dutch',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/nlen/{word}',
    translateURI: 'https://translate.google.com/?sl=nl&tl=en&text={word}',
    googleTTSCode: 'nl-NL',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.!?]+',
  },
  {
    code: 'pl',
    name: 'Polish',
    isRTL: false,
    dictURI: 'https://www.wordreference.com/plen/{word}',
    translateURI: 'https://translate.google.com/?sl=pl&tl=en&text={word}',
    googleTTSCode: 'pl-PL',
    characterSubstitutions: {
      '\u0105': 'a',
      '\u0107': 'c',
      '\u0119': 'e',
      '\u0142': 'l',
      '\u0144': 'n',
      '\u00f3': 'o',
      '\u015b': 's',
      '\u017a': 'z',
      '\u017c': 'z',
    },
    sentenceSplitRegex: '[.!?]+',
  },
  {
    code: 'he',
    name: 'Hebrew',
    isRTL: true,
    dictURI: 'https://www.morfix.co.il/{word}',
    translateURI: 'https://translate.google.com/?sl=he&tl=en&text={word}',
    googleTTSCode: 'he-IL',
    characterSubstitutions: {},
    sentenceSplitRegex: '[.\u061f]+', // Period and question mark
  },
];

async function seed() {
  console.log('Starting database seed...');

  try {
    console.log('Seeding languages...');

    for (const language of seedLanguages) {
      await db.insert(languages).values(language).onConflictDoNothing();
      console.log(`  ✓ Added ${language.name} (${language.code})`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`   ${seedLanguages.length} languages added`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }

  process.exit(0);
}

seed();
