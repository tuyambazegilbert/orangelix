/**
 * OrangeFlix YouTube Discovery V2 — Languages Component
 * Multilingual dictionaries, local cinema vocabularies, and term mapping across 14+ languages.
 */

import React from 'react';
import {
  Sparkles,
  Globe2,
  BookOpen,
  Film,
  Layers,
} from 'lucide-react';

interface LanguageTermCard {
  code: string;
  name: string;
  nativeName: string;
  territory: string;
  terms: string[];
}

const LANGUAGE_CATALOG: LanguageTermCard[] = [
  {
    code: 'rw',
    name: 'Kinyarwanda',
    nativeName: 'Ikinyarwanda',
    territory: 'Rwanda (RW)',
    terms: ['agasobanuye', 'filime nyarwanda', 'gasobanuye', 'sinema nyarwanda', 'ikinyarwanda cyose', 'filime zisobanuye'],
  },
  {
    code: 'lg',
    name: 'Luganda',
    nativeName: 'Oluganda',
    territory: 'Uganda (UG)',
    terms: ['katogo', 'vj junior', 'vj jingo', 'vj mark', 'vj ice p', 'translated movies', 'oluganda lwa leero'],
  },
  {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    territory: 'Tanzania (TZ) / Kenya (KE)',
    terms: ['bongo movie', 'filamu za kiswahili', 'tamthilia', 'swahiliwood', 'kiswahili full movie', 'sinema ya bongo'],
  },
  {
    code: 'yo',
    name: 'Yoruba',
    nativeName: 'Èdè Yorùbá',
    territory: 'Nigeria (NG)',
    terms: ['nollywood yoruba', 'sinima yoruba', 'yoruba full movie', 'latest yoruba drama'],
  },
  {
    code: 'ig',
    name: 'Igbo',
    nativeName: 'Asụsụ Igbo',
    territory: 'Nigeria (NG)',
    terms: ['nollywood igbo', 'asusu igbo', 'igbo epic film', 'igbo cultural movies'],
  },
  {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Harshen Hausa',
    territory: 'Nigeria (NG)',
    terms: ['kannywood', 'hausa films', 'fina-finan hausa', 'hausa series full'],
  },
  {
    code: 'ak',
    name: 'Twi / Akan',
    nativeName: 'Akan / Twi',
    territory: 'Ghana (GH)',
    terms: ['kumawood', 'ghanaian movies', 'ghallywood', 'akan films full', 'twi movie'],
  },
  {
    code: 'zu',
    name: 'isiZulu',
    nativeName: 'isiZulu',
    territory: 'South Africa (ZA)',
    terms: ['mzansi bioskop', 'isizulu movie', 'south african drama', 'zulu cinema'],
  },
  {
    code: 'xh',
    name: 'isiXhosa',
    nativeName: 'isiXhosa',
    territory: 'South Africa (ZA)',
    terms: ['isixhosa movie', 'south african stories', 'cape cinema'],
  },
  {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    territory: 'Ethiopia / Horn of Africa',
    terms: ['amharic full movie', 'habesha cinema', 'ethiopian film', 'addis movie'],
  },
  {
    code: 'so',
    name: 'Somali',
    nativeName: 'Af-Soomaali',
    territory: 'East Africa / Horn of Africa',
    terms: ['riwaayad', 'somali drama full', 'somali movie'],
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    territory: 'Francophone Africa',
    terms: ['film africain en français', 'cinéma francophone', 'série africaine', 'film complet'],
  },
];

export const DiscoveryLanguages: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-card/60 border border-border rounded-xl p-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Multilingual Vocabulary & Cultural Cinema Dictionaries
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          High-recall discovery engine maps colloquial terminology across 14+ African languages to discover grassroots cinema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LANGUAGE_CATALOG.map((lang) => (
          <div
            key={lang.code}
            className="bg-card/60 border border-border rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">{lang.name}</h3>
                <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary text-secondary-foreground uppercase">
                {lang.code}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              Primary Territory: <strong className="text-foreground">{lang.territory}</strong>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                Recognized Terminology
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lang.terms.map((term, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
