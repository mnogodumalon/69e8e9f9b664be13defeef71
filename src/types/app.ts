// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface HalloWelt {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    nachricht?: string;
  };
}

export const APP_IDS = {
  HALLO_WELT: '69e8e9ed2dd77d773eb39869',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'hallo_welt': {
    'nachricht': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateHalloWelt = StripLookup<HalloWelt['fields']>;