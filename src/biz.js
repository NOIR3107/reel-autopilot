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
    oldNews: 'NEW!! We now offer gutter guards!!', rival: 'Another roofer', category: 'Roofing contractor',
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
    oldNews: 'NEW!! Ask about our maintenance club!!', rival: 'Another HVAC company', category: 'Heating and air',
  },
  plumbing: {
    name: 'Clearwell', fullName: 'Clearwell Plumbing', oldName: 'CLEARWELL PLUMBING & DRAIN SERVICE', domain: 'clearwellplumbing.com', phone: '(555) 012-6604',
    color: {main: '#1d6fd1', deep: '#0b3a73'}, photos: {hero: 'hvac-house.jpg', detail: 'hvac-house.jpg'},
    headline: ['Burst pipe?', "We're on the way."], sub: 'Leaks, clogs, water heaters and repipes. A real plumber answers, day or night.',
    cta2: 'Book a plumber', bookTitle: 'Book a plumber', ask: "What's leaking?", chips: ['Leak', 'Clog', 'Water heater', 'Not sure'],
    servicesTitle: 'What we fix',
    services: [['Leaks and bursts', 'Water off fast, then a proper fix.'], ['Drains', 'Clogs cleared, camera checked.'], ['Water heaters', 'Repair or replace, same week.'], ['Free estimates', 'A clear price before any work.']],
    oldLinks: ['Plumbing', 'Drain Cleaning', 'Water Heaters', 'Sewer Lines', 'Faucets', 'Toilets', 'Coupons', 'FAQ', 'Site Map'],
    oldPic: 'pipes1.jpg', oldWork: 'leak repair, drain cleaning, water heaters, sewer line repair, repiping, faucets, toilets, garbage disposals',
    oldNews: 'NEW!! Ask about our $25 off coupon!!', rival: 'Another plumber', category: 'Plumbing service',
  },
  electrical: {
    name: 'Voltline', fullName: 'Voltline Electric', oldName: 'VOLTLINE ELECTRICAL CONTRACTORS', domain: 'voltlineelectric.com', phone: '(555) 015-9032',
    color: {main: '#c2410c', deep: '#6b2205'}, photos: {hero: 'np-house.jpg', detail: 'np-house.jpg'},
    headline: ['Power out?', "We'll find it."], sub: 'Repairs, panels, EV chargers and lighting. A licensed electrician answers, day or night.',
    cta2: 'Book an electrician', bookTitle: 'Book an electrician', ask: "What's going on?", chips: ['No power', 'Breaker trips', 'Panel', 'EV charger'],
    servicesTitle: 'What we do',
    services: [['Repairs', 'Outlets, breakers and wiring, fixed safely.'], ['Panel upgrades', 'Room for everything you plug in.'], ['EV chargers', 'Installed and permitted.'], ['Free estimates', 'A clear price before any work.']],
    oldLinks: ['Residential', 'Commercial', 'Panels', 'Lighting', 'Generators', 'EV Chargers', 'Financing', 'FAQ', 'Site Map'],
    oldPic: 'panel1.jpg', oldWork: 'electrical repair, panel upgrades, lighting, ceiling fans, generators, EV chargers, rewiring, code corrections',
    oldNews: 'NEW!! We now install EV chargers!!', rival: 'Another electrician', category: 'Electrician',
  },
  landscaping: {
    name: 'Greenmark', fullName: 'Greenmark Landscaping', oldName: 'GREENMARK LAWN & LANDSCAPE', domain: 'greenmarkyards.com', phone: '(555) 019-2275',
    color: {main: '#15803d', deep: '#0a4220'}, photos: {hero: 'kestrel-hero.jpg', detail: 'kestrel-hero.jpg'},
    headline: ['Yard a mess?', 'We make it shine.'], sub: 'Lawn care, cleanups, patios and plantings. Free quotes, real people.',
    cta2: 'Get a free quote', bookTitle: 'Get a free quote', ask: 'What do you need?', chips: ['Lawn care', 'Cleanup', 'Patio', 'Not sure'],
    servicesTitle: 'What we do',
    services: [['Lawn care', 'Weekly mowing, edging and cleanup.'], ['Cleanups', 'Spring and fall, done in a day.'], ['Hardscapes', 'Patios, walls and walkways.'], ['Free quotes', 'A clear price after one visit.']],
    oldLinks: ['Lawn Care', 'Landscaping', 'Hardscapes', 'Irrigation', 'Snow Removal', 'Gallery', 'Specials', 'FAQ', 'Site Map'],
    oldPic: 'lawn1.jpg', oldWork: 'lawn mowing, landscaping, mulch, hardscapes, patios, retaining walls, irrigation, snow removal',
    oldNews: 'NEW!! Now booking spring cleanups!!', rival: 'Another landscaper', category: 'Landscaping',
  },
};

export const BizCtx = createContext(BUSINESSES.roofing);
export const useBiz = () => useContext(BizCtx);
// Brand colors as CSS variables so every component follows the business.
export const bizVars = (b) => ({'--main': b.color.main, '--deep': b.color.deep});
