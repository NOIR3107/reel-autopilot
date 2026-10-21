// Fictional businesses the mock websites are built for. The weekly writer picks one by key and may override copy.
import {createContext, useContext} from 'react';

export const BUSINESSES = {
  roofing: {
    name: 'Northpeak', fullName: 'Northpeak Roofing', oldName: 'NORTHPEAK ROOFING & GUTTER CO.', domain: 'northpeakroofing.com', phone: '(555) 014-2289',
    color: {main: '#2346d0', deep: '#14287e'}, photos: {hero: 'np-house.jpg', detail: 'np-shingles.jpg'},
    headline: ['Leak tonight?', 'We pick up.'], sub: 'Repairs, storm damage and full replacements. A real roofer answers, day or night.',
    cta2: 'Book inspection', bookTitle: 'Book a free inspection', ask: "What's happening?", chips: ['Leak', 'Storm damage', 'Replacement', 'Not sure'],
    servicesTitle: 'What we fix',
    services: [['Leaks and storm damage', 'Same-day tarping, then a proper repair.'], ['Replacement', 'Shingle, metal, flat.'], ['Gutters', 'Install, clean, guard.'], ['Free inspections', 'Photos of every issue, sent to your phone.']],
    oldLinks: ['Roof Repair', 'Shingles', 'Metal Roofs', 'Gutters', 'Skylights', 'Insurance Claims', 'Financing', 'FAQ', 'Site Map'],
    oldPic: 'roof_pic1.jpg', oldWork: 'roof repair, roof replacement, shingle installation, metal roofing, flat roofs, gutter installation, gutter cleaning, skylights, chimney flashing',
    oldNews: 'NEW!! We now offer gutter guards!!',
  },
  hvac: {
    name: 'Brightline', fullName: 'Brightline Heating & Air', oldName: 'BRIGHTLINE HEATING & AIR CONDITIONING', domain: 'brightlineair.com', phone: '(555) 017-3380',
    color: {main: '#0e7490', deep: '#083d4f'}, photos: {hero: 'hvac-house.jpg', detail: 'hvac-detail.jpg'},
    headline: ['AC out?', 'Cool again today.'], sub: 'Repairs, tune-ups and new systems. A real tech answers, day or night.',
    cta2: 'Book a visit', bookTitle: 'Book a service visit', ask: "What's going on?", chips: ['No cooling', 'No heat', 'Strange noise', 'Tune-up'],
    servicesTitle: 'What we do',
    services: [['Repairs', 'Fixed on the first visit when we can.'], ['New systems', 'Sized right for your home.'], ['Tune-ups', 'Spring and fall checks.'], ['Free estimates', 'A clear quote before any work starts.']],
    oldLinks: ['Air Conditioning', 'Heating', 'Heat Pumps', 'Duct Cleaning', 'Thermostats', 'Maintenance Plans', 'Financing', 'FAQ', 'Site Map'],
    oldPic: 'ac_unit1.jpg', oldWork: 'air conditioning repair, furnace repair, heat pumps, duct cleaning, thermostat installation, indoor air quality, maintenance plans',
    oldNews: 'NEW!! Ask about our maintenance club!!',
  },
};

export const BizCtx = createContext(BUSINESSES.roofing);
export const useBiz = () => useContext(BizCtx);
// Brand colors as CSS variables so every component follows the business.
export const bizVars = (b) => ({'--main': b.color.main, '--deep': b.color.deep});
