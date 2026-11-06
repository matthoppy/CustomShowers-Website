/**
 * Who Custom Showers is, for the structured data on every page.
 *
 * Google's local results need a phone number and an address that match the
 * Google Business Profile exactly. Fill them in here and they appear in the
 * LocalBusiness markup on every page; while they are empty they are left out
 * rather than guessed.
 */

export interface PostalAddress {
  streetAddress: string;
  addressLocality: string;
  addressRegion?: string;
  postalCode: string;
  addressCountry: string;
}

export const business = {
  name: 'Custom Showers',
  legalName: 'Custom Showers Ltd',
  url: 'https://customshowers.uk',
  logo: 'https://customshowers.uk/CustomShowersMain.png',
  email: 'sales@customshowers.uk',
  /** As on the Google Business Profile, for example "+44 20 7946 0000". */
  telephone: '',
  address: null as PostalAddress | null,
  /** The Google Business Profile, Instagram, Checkatrade and so on: full URLs. */
  sameAs: [] as string[],
  areaServed: ['London', 'Fulham', 'Chelsea', 'Kensington', 'Hammersmith', 'Wandsworth', 'Westminster'],
  openingHours: [{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:30' }],
  priceRange: '££',
  description:
    'Bespoke frameless shower enclosures in 10mm toughened glass, made to your measurements. Supply only across the UK with installation guides for your fitter; survey and design in London.',
};
