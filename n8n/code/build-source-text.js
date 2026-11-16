// n8n Code node: "Build Source Text"
// Combines uploaded PDF text / pasted email, or loads a built-in demo promo.
const form = $('Supplier Promo Intake').first().json;
function pick(keys) {
  for (const k of keys) {
    const v = form[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}
let pdfText = '';
try { pdfText = $('Extract PDF Text').first().json.text || ''; } catch (e) { pdfText = ''; }
const NL = String.fromCharCode(10);

const SAMPLES = {
  'Spain & Portugal Grand Tour - Early Booking (complex)': {
    supplier: 'Iberia Dreams DMC',
    lines: [
      'SUBJECT: EARLY BOOKING 2027 - Spain & Portugal Grand Tour (12 days)',
      'Dear Petrabax team,',
      'We are happy to launch our Early Booking 2027 offer for the Spain & Portugal Grand Tour.',
      'Route: Madrid, Toledo, Cordoba, Seville, Lisbon, Fatima and Salamanca. 12 days / 11 nights.',
      '2027 departures (Saturdays): April 10, April 24, May 8, May 22, June 5, June 19, September 11, September 25, October 9.',
      'Early booking prices, land only, per person in USD:',
      '- April and May departures: $2,390 in double room / $3,150 in single room',
      '- June departures: $2,490 in double room / $3,290 in single room',
      '- September and October departures: $2,350 in double room / $3,090 in single room',
      'Triple room: 3% reduction on the double room price (3rd person only).',
      'Book by January 31, 2027 to receive the early booking price. After this date brochure prices apply: $2,690 per person in double room.',
      'Extra discount: $100 per person for bookings of 2 or more rooms on the same reservation.',
      'Agent commission: 12% on the land price. Commission does not apply to the extra discount.',
      'Conditions: new bookings only; not combinable with other promotions; minimum 2 passengers per booking; 25% deposit at booking, non-refundable within 45 days of departure.',
      'Includes: 11 nights in 4-star hotels, daily breakfast, 5 dinners, Cordoba Mosque-Cathedral and Seville Cathedral entrances, Lisbon city tour, English-speaking tour guide, private coach.',
      'Not included: international flights, tips, city taxes.',
      'Best regards, Iberia Dreams DMC'
    ]
  },
  'Spain & Portugal Grand Tour - Supplier correction': {
    supplier: 'Iberia Dreams DMC',
    lines: [
      'SUBJECT: CORRECTION - EARLY BOOKING 2027 - Spain & Portugal Grand Tour (12 days)',
      'Dear Petrabax team,',
      'Please note this email REPLACES our previous Early Booking 2027 offer for the Spain & Portugal Grand Tour.',
      'Route: Madrid, Toledo, Cordoba, Seville, Lisbon, Fatima and Salamanca. 12 days / 11 nights.',
      '2027 departures (Saturdays): April 10, April 24, May 8, May 22, June 5, September 11, September 25, October 9. The June 19 departure is cancelled.',
      'Early booking prices, land only, per person in USD:',
      '- April and May departures: $2,390 in double room / $3,150 in single room',
      '- June departures: $2,540 in double room / $3,340 in single room',
      '- September and October departures: $2,350 in double room / $3,090 in single room',
      'Triple room: 3% reduction on the double room price (3rd person only).',
      'Book by February 15, 2027 to receive the early booking price. After this date brochure prices apply: $2,690 per person in double room.',
      'Extra discount: $100 per person for bookings of 2 or more rooms on the same reservation.',
      'Agent commission: 12% on the land price. Commission does not apply to the extra discount.',
      'Conditions: new bookings only; not combinable with other promotions; minimum 2 passengers per booking; 25% deposit at booking, non-refundable within 45 days of departure.',
      'Includes: 11 nights in 4-star hotels, daily breakfast, 5 dinners, Cordoba Mosque-Cathedral and Seville Cathedral entrances, Lisbon city tour, English-speaking tour guide, private coach.',
      'Not included: international flights, tips, city taxes.',
      'Best regards, Iberia Dreams DMC'
    ]
  },
  'Spain - Andalusia Winter Escape (clean)': {
    supplier: 'Iberia Dreams DMC',
    lines: [
      'SUBJECT: NEW Winter 2027 Promo - Andalusia Winter Escape',
      'Dear Partners,',
      'We are pleased to share our Andalusia Winter Escape for winter 2027.',
      'Itinerary: 8 days / 7 nights - Madrid, Cordoba, Seville, Ronda and Granada.',
      'Promo price: from USD $1,649 per person, based on double occupancy, land only.',
      'Travel window: departures between January 15, 2027 and March 31, 2027.',
      'Book by December 20, 2026 to secure the promo price (save $200 per person vs. brochure rate).',
      'Includes: 7 nights in 4-star hotels, daily breakfast, 4 dinners, guided visit of the Alhambra, Seville Cathedral entrance, private air-conditioned coach, bilingual tour leader.',
      'Not included: international airfare, tips, city taxes.',
      'Single supplement: $520.',
      'Promo code: AND-WIN27. Subject to availability.'
    ]
  },
  'Portugal - Coastal Highlights (conflicting + expired)': {
    supplier: 'Lusitania Travel Partners',
    lines: [
      'Portugal Coastal Highlights - SPECIAL OFFER',
      '9 days: Lisbon, Obidos, Nazare, Porto and the Douro Valley.',
      'Double room: special price from $1,290 per person!',
      'Flash sale: double room now only $1,190 per person for early bookings.',
      'Valid for departures in spring 2027.',
      'Offer valid for bookings made until October 31, 2026.',
      'Includes hotels, breakfast, Douro river cruise and port wine tasting.'
    ]
  },
  'Morocco - Imperial Cities & Sahara (needs review)': {
    supplier: 'Atlas Horizons Morocco',
    lines: [
      'Morocco Imperial Cities & Sahara - 10 days',
      'From $2,195 per person, double occupancy.',
      'Route: Casablanca, Rabat, Fez, Merzouga desert camp, Marrakech.',
      'Book by January 31, 2027.',
      'Includes 4 and 5-star riads and hotels, daily breakfast, 6 dinners, 4x4 desert excursion and camel ride.',
      'Departures available year-round; Ramadan dates may affect the itinerary.',
      'Single supplement on request.'
    ]
  }
};

const choice = pick(['demo_sample', 'Load a demo promo (optional)']);
let supplier = pick(['supplier', 'Supplier name']);
let text = '';
let sourceType = '';
if (SAMPLES[choice]) {
  text = SAMPLES[choice].lines.join(NL);
  supplier = supplier || SAMPLES[choice].supplier;
  sourceType = 'Demo sample: ' + choice;
} else {
  const pasted = pick(['promo_text', 'Paste supplier email / promo text']);
  text = [pdfText, pasted].filter(Boolean).join(NL + NL);
  sourceType = pdfText ? (pasted ? 'PDF + pasted text' : 'PDF upload') : 'Pasted text';
}
if (!text.trim()) {
  throw new Error('No promo material found: upload a PDF, paste the promo text, or pick a demo promo.');
}
return [{ json: { supplier: supplier || 'Unknown supplier', source_type: sourceType, source_text: text } }];
