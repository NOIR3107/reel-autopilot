// A typical template site for a fictional local business, with three fixable problems. Default shop: "Kestrel Heating & Air".
// fix = {headline, popup, form} each 0..1: 0 = the original problem, 1 = fixed. Layout is 390px wide (phone CSS px).
import {Img, interpolate, staticFile} from 'remotion';
import {ChatCircleDots, Clock, Fire, HouseLine, List, Phone as PhoneIcon, Snowflake, Wrench, X} from '@phosphor-icons/react';

const SANS = 'Arial, Helvetica, sans-serif'; // the template site's default stack, on purpose
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const INK = '#0d1424';
// The shop the teardown is about. The weekly writer may replace any field; everything is fictional.
export const DEFAULT_SHOP = {
  name: 'Kestrel Heating & Air', domain: 'kestrelheatingair.com', phone: '(555) 019-4420', trade: 'HVAC', photo: 'kestrel-hero.jpg', accent: '#0e7490',
  fixedHeadline: ['AC out?', 'Fixed today.'], fixedSub: 'Heating and cooling repair across Mesa.',
  about: 'heating, ventilation and air conditioning', services: ['Cooling', 'Heating', 'Maintenance'], icons: 'hvac',
};

// Positions the reel zooms to, in site px (scroll included).
export const SPOTS = {headline: [195, 236], popup: [262, 652], form: [195, 1060]};

const FIELDS = [
  ['First name', 'Name'], ['Last name'], ['Email address'], ['Phone number', 'Phone'], ['Street address'], ['City'], ['ZIP code'],
  ['Equipment type'], ['Model number'], ['Preferred date'], ['Message', "What's wrong?"],
];

const mix = (p, a, b) => a + (b - a) * p;

export const KestrelSite = ({fix, scroll = 0, popIn = 1, shop = DEFAULT_SHOP}) => {
  const {headline: h, popup: pu, form: fo} = fix;
  const TEAL = shop.accent;
  const icons = shop.icons === 'hvac' ? [Snowflake, Fire, Wrench] : [Wrench, HouseLine, Clock];
  return (
    <div style={{width: 390, height: 752, overflow: 'hidden', position: 'relative', background: '#fff', fontFamily: SANS}}>
      <div style={{translate: `0 ${-scroll}px`}}>
        <div style={{height: 34, background: '#ffe066', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333'}}>Fall tune-up special! Click here to learn more</div>
        <div style={{height: 62, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #eee'}}>
          <List size={24} color="#555" />
          <div style={{flex: 1, textAlign: 'center', fontSize: 13, letterSpacing: '0.25em', color: '#444', fontWeight: 300}}>{shop.name.toUpperCase()}</div>
          <div style={{width: 24}} />
        </div>
        {/* hero */}
        <div style={{height: 340, position: 'relative', overflow: 'hidden'}}>
          <Img src={staticFile(shop.photo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <div style={{position: 'absolute', inset: 0, background: `rgba(8,30,40,${mix(h, 0.08, 0.62)})`}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, opacity: 1 - h}}>
            <div style={{color: '#fff', fontSize: 25, fontWeight: 300, textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,.3)'}}>Welcome to {shop.name}</div>
          </div>
          <div style={{position: 'absolute', left: 22, right: 22, bottom: 30, opacity: h, translate: `0 ${(1 - h) * 20}px`, fontFamily: FONT}}>
            <div style={{color: '#fff', fontSize: 38, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.03em'}}>{shop.fixedHeadline[0]}<br />{shop.fixedHeadline[1]}</div>
            <div style={{color: 'rgba(255,255,255,.85)', fontSize: 15, margin: '10px 0 16px'}}>{shop.fixedSub}</div>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: TEAL, fontWeight: 700, fontSize: 16, padding: '13px 20px', borderRadius: 999}}><PhoneIcon size={18} weight="fill" />Call {shop.phone}</div>
          </div>
          <div style={{position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, opacity: 1 - h}}>
            {[0, 1, 2, 3].map((i) => <div key={i} style={{width: 7, height: 7, borderRadius: '50%', background: i ? 'rgba(255,255,255,.5)' : '#fff'}} />)}
          </div>
        </div>
        {/* about */}
        <div style={{padding: '22px 18px'}}>
          <div style={{fontSize: 19, color: '#333', marginBottom: 8}}>About Us</div>
          <div style={{fontSize: 12.5, lineHeight: 1.6, color: '#888'}}>{shop.name} is a locally owned and operated company dedicated to providing quality service to our valued customers. We pride ourselves on honesty, integrity and customer satisfaction. Our team has years of experience in all aspects of {shop.about}.</div>
        </div>
        {/* services */}
        <div style={{display: 'flex', justifyContent: 'space-around', padding: '6px 10px 26px'}}>
          {shop.services.map((t, i) => [icons[i], t]).map(([I, t]) => (
            <div key={t} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12, color: '#666'}}>
              <div style={{width: 58, height: 58, borderRadius: '50%', background: '#eef3f5', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><I size={26} color="#7a8a90" /></div>{t}
            </div>
          ))}
        </div>
        {/* form */}
        <div style={{padding: '16px 18px 24px', background: '#f7f7f7'}}>
          <div style={{fontSize: 19, color: '#333', marginBottom: 12, fontFamily: fo > 0.5 ? FONT : SANS, fontWeight: fo > 0.5 ? 800 : 400}}>{fo > 0.5 ? 'Get help today' : 'Contact Us'}</div>
          {FIELDS.map(([bad, good]) => {
            const keep = Boolean(good);
            const ht = keep ? 50 : mix(fo, 50, 0);
            return (
              <div key={bad} style={{height: ht, overflow: 'hidden', opacity: keep ? 1 : 1 - fo}}>
                <div style={{height: 40, border: `1px solid ${keep && fo > 0.5 ? TEAL : '#ccc'}`, borderRadius: keep ? mix(fo, 2, 12) : 2, background: '#fff', fontSize: 13, color: '#999', display: 'flex', alignItems: 'center', padding: '0 10px'}}>
                  {keep && fo > 0.5 ? good : bad}
                </div>
              </div>
            );
          })}
          <div style={{height: mix(fo, 70, 0), overflow: 'hidden', opacity: 1 - fo}}>
            <div style={{width: 230, height: 58, border: '1px solid #ccc', background: '#f9f9f9', fontSize: 12, color: '#777', display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px'}}><div style={{width: 22, height: 22, border: '2px solid #bbb'}} />I'm not a robot</div>
          </div>
          <div style={{marginTop: 6, height: 44, borderRadius: mix(fo, 2, 999), background: fo > 0.5 ? TEAL : '#9aa5a8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700}}>{fo > 0.5 ? 'Send, we call you back' : 'SUBMIT'}</div>
        </div>
        <div style={{padding: '14px 18px 300px', fontSize: 9.5, color: '#aaa'}}>© {shop.name}. All rights reserved. {shop.phone}</div>
      </div>

      {/* chat pop-up (problem 2) */}
      <div style={{position: 'absolute', right: 12, top: 560, width: 228, borderRadius: 14, background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,.25)', padding: 14,
        opacity: popIn * (1 - pu), translate: `${pu * 260}px ${(1 - popIn) * 40}px`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#333'}}><ChatCircleDots size={24} weight="fill" color="#3b82f6" />Chat with us!</div>
          <X size={16} color="#888" />
        </div>
        <div style={{fontSize: 12.5, color: '#555', lineHeight: 1.4, marginBottom: 10}}>Hi there! How can we help you today?</div>
        <div style={{height: 34, borderRadius: 8, border: '1px solid #ddd', fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', padding: '0 10px'}}>Type a message...</div>
      </div>

      {/* sticky call bar (fix 2) */}
      <div style={{position: 'absolute', left: 12, right: 12, bottom: 16, height: 54, borderRadius: 999, background: TEAL, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: FONT, fontWeight: 700, fontSize: 17, boxShadow: '0 10px 26px rgba(14,116,144,.4)', translate: `0 ${(1 - pu) * 120}px`}}>
        <PhoneIcon size={20} weight="fill" />Tap to call {shop.phone}
      </div>
    </div>
  );
};
