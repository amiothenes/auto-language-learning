/**
 * English Language Handler
 *
 * Lemmatization rules for English based on Universal Dependencies patterns.
 * Handles common inflections for verbs, nouns, adjectives, and adverbs.
 *
 * Target accuracy: 95%+ for common words
 */

import type { LanguageHandler } from '../types';

/**
 * English lemmatization handler
 *
 * Implements rule-based lemmatization for English morphology:
 * - Verb: running → run, walked → walk, studies → study
 * - Noun: cats → cat, children → child, mice → mouse
 * - Adjective: bigger → big, happiest → happy
 * - Adverb: quickly → quick
 */
export const englishHandler: LanguageHandler = {
  code: 'en',
  name: 'English',

  async lemmatize(
    word: string,
    pos: string,
    morphFeatures: Record<string, string>
  ): Promise<string> {
    const lower = word.toLowerCase();

    // Irregular verb forms (high-frequency verbs)
    if (pos === 'VERB' || pos === 'AUX') {
      const irregularVerbs: Record<string, string> = {
        'am': 'be', 'is': 'be', 'are': 'be', 'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
        'have': 'have', 'has': 'have', 'had': 'have', 'having': 'have',
        'do': 'do', 'does': 'do', 'did': 'do', 'doing': 'do', 'done': 'do',
        'go': 'go', 'goes': 'go', 'went': 'go', 'gone': 'go', 'going': 'go',
        'can': 'can', 'could': 'can',
        'will': 'will', 'would': 'will',
        'shall': 'shall', 'should': 'shall',
        'may': 'may', 'might': 'may',
        'must': 'must',
        'say': 'say', 'said': 'say', 'says': 'say', 'saying': 'say',
        'make': 'make', 'made': 'make', 'makes': 'make', 'making': 'make',
        'get': 'get', 'got': 'get', 'gotten': 'get', 'gets': 'get', 'getting': 'get',
        'take': 'take', 'took': 'take', 'taken': 'take', 'takes': 'take', 'taking': 'take',
        'come': 'come', 'came': 'come', 'comes': 'come', 'coming': 'come',
        'see': 'see', 'saw': 'see', 'seen': 'see', 'sees': 'see', 'seeing': 'see',
        'know': 'know', 'knew': 'know', 'known': 'know', 'knows': 'know', 'knowing': 'know',
        'think': 'think', 'thought': 'think', 'thinks': 'think', 'thinking': 'think',
        'give': 'give', 'gave': 'give', 'given': 'give', 'gives': 'give', 'giving': 'give',
        'find': 'find', 'found': 'find', 'finds': 'find', 'finding': 'find',
        'tell': 'tell', 'told': 'tell', 'tells': 'tell', 'telling': 'tell',
        'become': 'become', 'became': 'become', 'becomes': 'become', 'becoming': 'become',
        'leave': 'leave', 'left': 'leave', 'leaves': 'leave', 'leaving': 'leave',
        'feel': 'feel', 'felt': 'feel', 'feels': 'feel', 'feeling': 'feel',
        'bring': 'bring', 'brought': 'bring', 'brings': 'bring', 'bringing': 'bring',
        'begin': 'begin', 'began': 'begin', 'begun': 'begin', 'begins': 'begin', 'beginning': 'begin',
        'keep': 'keep', 'kept': 'keep', 'keeps': 'keep', 'keeping': 'keep',
        'hold': 'hold', 'held': 'hold', 'holds': 'hold', 'holding': 'hold',
        'write': 'write', 'wrote': 'write', 'written': 'write', 'writes': 'write', 'writing': 'write',
        'stand': 'stand', 'stood': 'stand', 'stands': 'stand', 'standing': 'stand',
        'hear': 'hear', 'heard': 'hear', 'hears': 'hear', 'hearing': 'hear',
        'let': 'let', 'lets': 'let', 'letting': 'let',
        'mean': 'mean', 'meant': 'mean', 'means': 'mean', 'meaning': 'mean',
        'set': 'set', 'sets': 'set', 'setting': 'set',
        'meet': 'meet', 'met': 'meet', 'meets': 'meet', 'meeting': 'meet',
        'run': 'run', 'ran': 'run', 'runs': 'run', 'running': 'run',
        'pay': 'pay', 'paid': 'pay', 'pays': 'pay', 'paying': 'pay',
        'sit': 'sit', 'sat': 'sit', 'sits': 'sit', 'sitting': 'sit',
        'speak': 'speak', 'spoke': 'speak', 'spoken': 'speak', 'speaks': 'speak', 'speaking': 'speak',
        'lie': 'lie', 'lay': 'lie', 'lain': 'lie', 'lies': 'lie', 'lying': 'lie',
        'lead': 'lead', 'led': 'lead', 'leads': 'lead', 'leading': 'lead',
        'read': 'read', 'reads': 'read', 'reading': 'read',
        'grow': 'grow', 'grew': 'grow', 'grown': 'grow', 'grows': 'grow', 'growing': 'grow',
        'lose': 'lose', 'lost': 'lose', 'loses': 'lose', 'losing': 'lose',
        'fall': 'fall', 'fell': 'fall', 'fallen': 'fall', 'falls': 'fall', 'falling': 'fall',
        'send': 'send', 'sent': 'send', 'sends': 'send', 'sending': 'send',
        'build': 'build', 'built': 'build', 'builds': 'build', 'building': 'build',
        'understand': 'understand', 'understood': 'understand', 'understands': 'understand', 'understanding': 'understand',
        'draw': 'draw', 'drew': 'draw', 'drawn': 'draw', 'draws': 'draw', 'drawing': 'draw',
        'break': 'break', 'broke': 'break', 'broken': 'break', 'breaks': 'break', 'breaking': 'break',
        'spend': 'spend', 'spent': 'spend', 'spends': 'spend', 'spending': 'spend',
        'cut': 'cut', 'cuts': 'cut', 'cutting': 'cut',
        'rise': 'rise', 'rose': 'rise', 'risen': 'rise', 'rises': 'rise', 'rising': 'rise',
        'drive': 'drive', 'drove': 'drive', 'driven': 'drive', 'drives': 'drive', 'driving': 'drive',
        'buy': 'buy', 'bought': 'buy', 'buys': 'buy', 'buying': 'buy',
        'wear': 'wear', 'wore': 'wear', 'worn': 'wear', 'wears': 'wear', 'wearing': 'wear',
        'choose': 'choose', 'chose': 'choose', 'chosen': 'choose', 'chooses': 'choose', 'choosing': 'choose',
        'seek': 'seek', 'sought': 'seek', 'seeks': 'seek', 'seeking': 'seek',
        'throw': 'throw', 'threw': 'throw', 'thrown': 'throw', 'throws': 'throw', 'throwing': 'throw',
        'catch': 'catch', 'caught': 'catch', 'catches': 'catch', 'catching': 'catch',
        'deal': 'deal', 'dealt': 'deal', 'deals': 'deal', 'dealing': 'deal',
        'win': 'win', 'won': 'win', 'wins': 'win', 'winning': 'win',
        'forget': 'forget', 'forgot': 'forget', 'forgotten': 'forget', 'forgets': 'forget', 'forgetting': 'forget',
        'shoot': 'shoot', 'shot': 'shoot', 'shoots': 'shoot', 'shooting': 'shoot',
        'ride': 'ride', 'rode': 'ride', 'ridden': 'ride', 'rides': 'ride', 'riding': 'ride',
        'drink': 'drink', 'drank': 'drink', 'drunk': 'drink', 'drinks': 'drink', 'drinking': 'drink',
        'ring': 'ring', 'rang': 'ring', 'rung': 'ring', 'rings': 'ring', 'ringing': 'ring',
        'sing': 'sing', 'sang': 'sing', 'sung': 'sing', 'sings': 'sing', 'singing': 'sing',
        'sink': 'sink', 'sank': 'sink', 'sunk': 'sink', 'sinks': 'sink', 'sinking': 'sink',
        'swim': 'swim', 'swam': 'swim', 'swum': 'swim', 'swims': 'swim', 'swimming': 'swim',
        'teach': 'teach', 'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
        'sell': 'sell', 'sold': 'sell', 'sells': 'sell', 'selling': 'sell',
        'shake': 'shake', 'shook': 'shake', 'shaken': 'shake', 'shakes': 'shake', 'shaking': 'shake',
        'fight': 'fight', 'fought': 'fight', 'fights': 'fight', 'fighting': 'fight',
        'hit': 'hit', 'hits': 'hit', 'hitting': 'hit',
        'put': 'put', 'puts': 'put', 'putting': 'put',
      };

      if (irregularVerbs[lower]) {
        return irregularVerbs[lower];
      }

      // Regular verb patterns
      // -ing → remove ing (running → run, but double consonants)
      if (lower.endsWith('ing')) {
        const base = lower.slice(0, -3);
        // Handle doubled consonants: running → run, sitting → sit
        if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
          return base.slice(0, -1);
        }
        // Handle -ying: studying → study
        if (base.endsWith('y')) {
          return base + 'y';
        }
        return base || lower;
      }

      // -ed → remove ed (walked → walk)
      if (lower.endsWith('ed')) {
        const base = lower.slice(0, -2);
        // Handle doubled consonants: stopped → stop
        if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
          return base.slice(0, -1);
        }
        // Handle -ied: studied → study
        if (base.endsWith('i')) {
          return base.slice(0, -1) + 'y';
        }
        return base || lower;
      }

      // -s / -es → remove for 3rd person singular (walks → walk, watches → watch)
      if (lower.endsWith('es')) {
        return lower.slice(0, -2);
      }
      if (lower.endsWith('s') && !lower.endsWith('ss')) {
        // studies → study
        if (lower.endsWith('ies')) {
          return lower.slice(0, -3) + 'y';
        }
        return lower.slice(0, -1);
      }
    }

    // Irregular noun plurals
    if (pos === 'NOUN' || pos === 'PROPN') {
      const irregularNouns: Record<string, string> = {
        'children': 'child',
        'men': 'man',
        'women': 'woman',
        'people': 'person',
        'feet': 'foot',
        'teeth': 'tooth',
        'geese': 'goose',
        'mice': 'mouse',
        'oxen': 'ox',
        'sheep': 'sheep',
        'deer': 'deer',
        'fish': 'fish',
        'series': 'series',
        'species': 'species',
      };

      if (irregularNouns[lower]) {
        return irregularNouns[lower];
      }

      // Regular noun plurals
      // -ies → y (stories → story)
      if (lower.endsWith('ies')) {
        return lower.slice(0, -3) + 'y';
      }
      // -ves → f/fe (lives → life, wolves → wolf)
      if (lower.endsWith('ves')) {
        return lower.slice(0, -3) + 'f';
      }
      // -es → remove (boxes → box, churches → church)
      if (lower.endsWith('es') && (lower.endsWith('shes') || lower.endsWith('ches') || lower.endsWith('xes') || lower.endsWith('zes'))) {
        return lower.slice(0, -2);
      }
      // -s → remove (cats → cat)
      if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us')) {
        return lower.slice(0, -1);
      }
    }

    // Adjective/Adverb comparatives and superlatives
    if (pos === 'ADJ' || pos === 'ADV') {
      // -est → remove (biggest → big, happiest → happy)
      if (lower.endsWith('est')) {
        const base = lower.slice(0, -3);
        // Double consonant: biggest → big
        if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
          return base.slice(0, -1);
        }
        // -iest: happiest → happy
        if (lower.endsWith('iest')) {
          return lower.slice(0, -4) + 'y';
        }
        return base || lower;
      }

      // -er → remove (bigger → big, happier → happy)
      if (lower.endsWith('er')) {
        const base = lower.slice(0, -2);
        // Double consonant: bigger → big
        if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
          return base.slice(0, -1);
        }
        // -ier: happier → happy
        if (lower.endsWith('ier')) {
          return lower.slice(0, -3) + 'y';
        }
        // Don't lemmatize if it's a noun (teacher, writer)
        if (pos === 'ADJ') {
          return base || lower;
        }
      }
    }

    // Adverb -ly → adjective (quickly → quick)
    if (pos === 'ADV' && lower.endsWith('ly')) {
      const base = lower.slice(0, -2);
      // happily → happy
      if (lower.endsWith('ily')) {
        return lower.slice(0, -3) + 'y';
      }
      return base || lower;
    }

    // Default: return lowercase
    return lower;
  },
};
