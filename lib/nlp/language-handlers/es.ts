/**
 * Spanish Language Handler
 *
 * Lemmatization rules for Spanish based on Universal Dependencies patterns.
 * Handles verb conjugations (-ar, -er, -ir), noun/adjective gender and number.
 *
 * Target accuracy: 95%+ for common words
 */

import type { LanguageHandler } from '../types';

/**
 * Spanish lemmatization handler
 *
 * Implements rule-based lemmatization for Spanish morphology:
 * - Verbs: habló → hablar, corrieron → correr, vivimos → vivir
 * - Nouns: gatos → gato, mujeres → mujer
 * - Adjectives: rápidas → rápido, felices → feliz
 */
export const spanishHandler: LanguageHandler = {
  code: 'es',
  name: 'Spanish',

  async lemmatize(
    word: string,
    pos: string,
    morphFeatures: Record<string, string>
  ): Promise<string> {
    const lower = word.toLowerCase();

    // High-frequency irregular verbs
    if (pos === 'VERB' || pos === 'AUX') {
      const irregularVerbs: Record<string, string> = {
        // ser (to be)
        'soy': 'ser', 'eres': 'ser', 'es': 'ser', 'somos': 'ser', 'sois': 'ser', 'son': 'ser',
        'era': 'ser', 'eras': 'ser', 'éramos': 'ser', 'erais': 'ser', 'eran': 'ser',
        'fui': 'ser', 'fuiste': 'ser', 'fue': 'ser', 'fuimos': 'ser', 'fuisteis': 'ser', 'fueron': 'ser',
        'sido': 'ser', 'siendo': 'ser',

        // estar (to be - location/state)
        'estoy': 'estar', 'estás': 'estar', 'está': 'estar', 'estamos': 'estar', 'estáis': 'estar', 'están': 'estar',
        'estaba': 'estar', 'estabas': 'estar', 'estábamos': 'estar', 'estabais': 'estar', 'estaban': 'estar',
        'estuve': 'estar', 'estuviste': 'estar', 'estuvo': 'estar', 'estuvimos': 'estar', 'estuvisteis': 'estar', 'estuvieron': 'estar',
        'estado': 'estar', 'estando': 'estar',

        // haber (to have - auxiliary)
        'he': 'haber', 'has': 'haber', 'ha': 'haber', 'hemos': 'haber', 'habéis': 'haber', 'han': 'haber',
        'había': 'haber', 'habías': 'haber', 'habíamos': 'haber', 'habíais': 'haber', 'habían': 'haber',
        'hube': 'haber', 'hubiste': 'haber', 'hubo': 'haber', 'hubimos': 'haber', 'hubisteis': 'haber', 'hubieron': 'haber',
        'habido': 'haber', 'habiendo': 'haber', 'hay': 'haber',

        // tener (to have)
        'tengo': 'tener', 'tienes': 'tener', 'tiene': 'tener', 'tenemos': 'tener', 'tenéis': 'tener', 'tienen': 'tener',
        'tenía': 'tener', 'tenías': 'tener', 'teníamos': 'tener', 'teníais': 'tener', 'tenían': 'tener',
        'tuve': 'tener', 'tuviste': 'tener', 'tuvo': 'tener', 'tuvimos': 'tener', 'tuvisteis': 'tener', 'tuvieron': 'tener',
        'tenido': 'tener', 'teniendo': 'tener',

        // hacer (to do/make)
        'hago': 'hacer', 'haces': 'hacer', 'hace': 'hacer', 'hacemos': 'hacer', 'hacéis': 'hacer', 'hacen': 'hacer',
        'hacía': 'hacer', 'hacías': 'hacer', 'hacíamos': 'hacer', 'hacíais': 'hacer', 'hacían': 'hacer',
        'hice': 'hacer', 'hiciste': 'hacer', 'hizo': 'hacer', 'hicimos': 'hacer', 'hicisteis': 'hacer', 'hicieron': 'hacer',
        'hecho': 'hacer', 'haciendo': 'hacer',

        // decir (to say)
        'digo': 'decir', 'dices': 'decir', 'dice': 'decir', 'decimos': 'decir', 'decís': 'decir', 'dicen': 'decir',
        'decía': 'decir', 'decías': 'decir', 'decíamos': 'decir', 'decíais': 'decir', 'decían': 'decir',
        'dije': 'decir', 'dijiste': 'decir', 'dijo': 'decir', 'dijimos': 'decir', 'dijisteis': 'decir', 'dijeron': 'decir',
        'dicho': 'decir', 'diciendo': 'decir',

        // poder (can/to be able)
        'puedo': 'poder', 'puedes': 'poder', 'puede': 'poder', 'podemos': 'poder', 'podéis': 'poder', 'pueden': 'poder',
        'podía': 'poder', 'podías': 'poder', 'podíamos': 'poder', 'podíais': 'poder', 'podían': 'poder',
        'pude': 'poder', 'pudiste': 'poder', 'pudo': 'poder', 'pudimos': 'poder', 'pudisteis': 'poder', 'pudieron': 'poder',
        'podido': 'poder', 'pudiendo': 'poder',

        // ir (to go)
        'voy': 'ir', 'vas': 'ir', 'va': 'ir', 'vamos': 'ir', 'vais': 'ir', 'van': 'ir',
        'iba': 'ir', 'ibas': 'ir', 'íbamos': 'ir', 'ibais': 'ir', 'iban': 'ir',
        'fui': 'ir', 'fuiste': 'ir', 'fue': 'ir', 'fuimos': 'ir', 'fuisteis': 'ir', 'fueron': 'ir',
        'ido': 'ir', 'yendo': 'ir',

        // dar (to give)
        'doy': 'dar', 'das': 'dar', 'da': 'dar', 'damos': 'dar', 'dais': 'dar', 'dan': 'dar',
        'daba': 'dar', 'dabas': 'dar', 'dábamos': 'dar', 'dabais': 'dar', 'daban': 'dar',
        'di': 'dar', 'diste': 'dar', 'dio': 'dar', 'dimos': 'dar', 'disteis': 'dar', 'dieron': 'dar',
        'dado': 'dar', 'dando': 'dar',

        // ver (to see)
        'veo': 'ver', 'ves': 'ver', 've': 'ver', 'vemos': 'ver', 'veis': 'ver', 'ven': 'ver',
        'veía': 'ver', 'veías': 'ver', 'veíamos': 'ver', 'veíais': 'ver', 'veían': 'ver',
        'vi': 'ver', 'viste': 'ver', 'vio': 'ver', 'vimos': 'ver', 'visteis': 'ver', 'vieron': 'ver',
        'visto': 'ver', 'viendo': 'ver',

        // saber (to know)
        'sé': 'saber', 'sabes': 'saber', 'sabe': 'saber', 'sabemos': 'saber', 'sabéis': 'saber', 'saben': 'saber',
        'sabía': 'saber', 'sabías': 'saber', 'sabíamos': 'saber', 'sabíais': 'saber', 'sabían': 'saber',
        'supe': 'saber', 'supiste': 'saber', 'supo': 'saber', 'supimos': 'saber', 'supisteis': 'saber', 'supieron': 'saber',
        'sabido': 'saber', 'sabiendo': 'saber',

        // querer (to want)
        'quiero': 'querer', 'quieres': 'querer', 'quiere': 'querer', 'queremos': 'querer', 'queréis': 'querer', 'quieren': 'querer',
        'quería': 'querer', 'querías': 'querer', 'queríamos': 'querer', 'queríais': 'querer', 'querían': 'querer',
        'quise': 'querer', 'quisiste': 'querer', 'quiso': 'querer', 'quisimos': 'querer', 'quisisteis': 'querer', 'quisieron': 'querer',
        'querido': 'querer', 'queriendo': 'querer',

        // poner (to put)
        'pongo': 'poner', 'pones': 'poner', 'pone': 'poner', 'ponemos': 'poner', 'ponéis': 'poner', 'ponen': 'poner',
        'ponía': 'poner', 'ponías': 'poner', 'poníamos': 'poner', 'poníais': 'poner', 'ponían': 'poner',
        'puse': 'poner', 'pusiste': 'poner', 'puso': 'poner', 'pusimos': 'poner', 'pusisteis': 'poner', 'pusieron': 'poner',
        'puesto': 'poner', 'poniendo': 'poner',

        // venir (to come)
        'vengo': 'venir', 'vienes': 'venir', 'viene': 'venir', 'venimos': 'venir', 'venís': 'venir', 'vienen': 'venir',
        'venía': 'venir', 'venías': 'venir', 'veníamos': 'venir', 'veníais': 'venir', 'venían': 'venir',
        'vine': 'venir', 'viniste': 'venir', 'vino': 'venir', 'vinimos': 'venir', 'vinisteis': 'venir', 'vinieron': 'venir',
        'venido': 'venir', 'viniendo': 'venir',
      };

      if (irregularVerbs[lower]) {
        return irregularVerbs[lower];
      }

      // Regular -AR verb patterns
      if (lower.match(/[aá]r$/)) {
        return lower; // Already infinitive
      }

      // Present tense -AR: hablo, hablas, habla, hablamos, habláis, hablan → hablar
      if (lower.match(/(o|as|a|amos|áis|an)$/)) {
        const stem = lower.slice(0, -2);
        if (stem.length > 0) return stem + 'ar';
      }

      // Preterite -AR: hablé, hablaste, habló, hablamos, hablasteis, hablaron → hablar
      if (lower.match(/(é|aste|ó|asteis|aron)$/)) {
        const stem = lower.replace(/(é|aste|ó|asteis|aron)$/, '');
        if (stem.length > 0) return stem + 'ar';
      }

      // Imperfect -AR: hablaba, hablabas, hablábamos, hablabais, hablaban → hablar
      if (lower.match(/(aba|abas|ábamos|abais|aban)$/)) {
        const stem = lower.replace(/(aba|abas|ábamos|abais|aban)$/, '');
        if (stem.length > 0) return stem + 'ar';
      }

      // Gerund -AR: hablando → hablar
      if (lower.endsWith('ando')) {
        const stem = lower.slice(0, -4);
        if (stem.length > 0) return stem + 'ar';
      }

      // Participle -AR: hablado → hablar
      if (lower.endsWith('ado')) {
        const stem = lower.slice(0, -3);
        if (stem.length > 0) return stem + 'ar';
      }

      // Regular -ER verb patterns
      if (lower.match(/[eé]r$/)) {
        return lower; // Already infinitive
      }

      // Present tense -ER: como, comes, come, comemos, coméis, comen → comer
      if (lower.match(/(o|es|e|emos|éis|en)$/)) {
        const stem = lower.slice(0, -2);
        if (stem.length > 0 && !lower.match(/[aá]r$/)) return stem + 'er';
      }

      // Preterite -ER: comí, comiste, comió, comimos, comisteis, comieron → comer
      if (lower.match(/(í|iste|ió|imos|isteis|ieron)$/)) {
        const stem = lower.replace(/(í|iste|ió|imos|isteis|ieron)$/, '');
        if (stem.length > 0) return stem + 'er';
      }

      // Imperfect -ER: comía, comías, comíamos, comíais, comían → comer
      if (lower.match(/(ía|ías|íamos|íais|ían)$/)) {
        const stem = lower.replace(/(ía|ías|íamos|íais|ían)$/, '');
        if (stem.length > 0) return stem + 'er';
      }

      // Gerund -ER: comiendo → comer
      if (lower.endsWith('iendo')) {
        const stem = lower.slice(0, -5);
        if (stem.length > 0) return stem + 'er';
      }

      // Participle -ER: comido → comer
      if (lower.endsWith('ido')) {
        const stem = lower.slice(0, -3);
        if (stem.length > 0) return stem + 'er';
      }

      // Regular -IR verb patterns
      if (lower.match(/[ií]r$/)) {
        return lower; // Already infinitive
      }

      // Gerund -IR: viviendo → vivir
      if (lower.endsWith('iendo')) {
        const stem = lower.slice(0, -5);
        if (stem.length > 0) return stem + 'ir';
      }

      // Participle -IR: vivido → vivir
      if (lower.endsWith('ido')) {
        const stem = lower.slice(0, -3);
        if (stem.length > 0) return stem + 'ir';
      }
    }

    // Noun and adjective gender/number
    if (pos === 'NOUN' || pos === 'ADJ' || pos === 'PROPN') {
      // Plural → singular
      // -ces → z (felices → feliz, voces → voz)
      if (lower.endsWith('ces')) {
        return lower.slice(0, -3) + 'z';
      }

      // -es → remove (mujeres → mujer, felices → feliz)
      if (lower.endsWith('es')) {
        // But not if it's already singular (martes, lunes)
        if (!lower.match(/(tes|nes|res)$/)) {
          return lower.slice(0, -2);
        }
      }

      // -as/-os → -a/-o (gatas → gata, gatos → gato)
      if (lower.endsWith('as') && pos === 'NOUN') {
        return lower.slice(0, -1);
      }
      if (lower.endsWith('os') && pos === 'NOUN') {
        return lower.slice(0, -1);
      }

      // Feminine -a → masculine -o for adjectives (if specified)
      if (pos === 'ADJ' && lower.endsWith('a') && morphFeatures.gender === 'feminine') {
        return lower.slice(0, -1) + 'o';
      }
    }

    // Default: return lowercase
    return lower;
  },
};
