// Mock websites for a fictional business (see biz.js; roofing "Northpeak" by default). Old site = desktop-only 2009 page; new site = modern, phone-first.
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {ArrowRight, Camera, CheckCircle, Drop, HouseLine, MagnifyingGlass, Phone as PhoneIcon, PhoneCall} from '@phosphor-icons/react';
import '@fontsource-variable/archivo/wdth.css';
import {useBiz, bizVars} from '../biz.js';

const SERIF_OLD = '"Times New Roman", Times, DejaVu Serif, serif';

// ---------- Devices ----------
export const Phone = ({w = 560, children, glow, style}) => {
  const b = Math.round(w * 0.04);
  const inner = w - 2 * b;
  const h = Math.round(inner * (844 / 390)) + 2 * b;
  return (
    <div style={{width: w, height: h, borderRadius: w * 0.16, background: 'linear-gradient(145deg,#2b2d33,#0c0d10)', padding: b, boxSizing: 'border-box', position: 'relative',
      boxShadow: `0 60px 120px rgba(0,0,0,.65), 0 0 0 2px #3a3d45 inset${glow ? `, 0 0 90px ${glow}` : ''}`, ...style}}>
      <div style={{width: inner, height: h - 2 * b, borderRadius: w * 0.125, overflow: 'hidden', position: 'relative', background: '#fff'}}>
        <div style={{width: 390, height: 844, scale: String(inner / 390), transformOrigin: '0 0', position: 'absolute', left: 0, top: 0}}>{children}</div>
        <div style={{position: 'absolute', top: inner * 0.03, left: '50%', translate: '-50% 0', width: inner * 0.3, height: inner * 0.085, borderRadius: 999, background: '#000'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 32%)', pointerEvents: 'none'}} />
      </div>
    </div>
  );
};

export const Laptop = ({w = 900, children, style}) => {
  const inner = w * 0.92;
  const sh = inner * (800 / 1280);
  return (
    <div style={{width: w, ...style}}>
      <div style={{width: w, padding: w * 0.04, paddingBottom: w * 0.03, boxSizing: 'border-box', borderRadius: w * 0.035, background: 'linear-gradient(160deg,#2b2d33,#0c0d10)', boxShadow: '0 50px 110px rgba(0,0,0,.6), 0 0 0 2px #3a3d45 inset'}}>
        <div style={{width: inner, height: sh, overflow: 'hidden', position: 'relative', borderRadius: 6, background: '#fff'}}>
          <div style={{width: 1280, height: 800, scale: String(inner / 1280), transformOrigin: '0 0', position: 'absolute'}}>{children}</div>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 30%)'}} />
        </div>
      </div>
      <div style={{width: w * 1.12, marginLeft: -w * 0.06, height: w * 0.035, borderRadius: `0 0 ${w * 0.03}px ${w * 0.03}px`, background: 'linear-gradient(#3a3d45,#16171b)'}} />
    </div>
  );
};

// ---------- Old site: built for a 980px desktop, so on a phone everything is tiny ----------
export const OLD_W = 980;
export const OldSite = () => {
  const frame = useCurrentFrame();
  const biz = useBiz();
  const link = {color: '#0000ee', textDecoration: 'underline'};
  return (
    <div style={{width: 390, height: 844, overflow: 'hidden', background: '#e8e4d0'}}>
      <div style={{width: OLD_W, scale: String(390 / OLD_W), transformOrigin: '0 0', fontFamily: SERIF_OLD, color: '#222', background: '#e8e4d0'}}>
        <div style={{background: 'linear-gradient(#7a0a0a,#3d0000)', padding: '26px 30px', borderBottom: '6px ridge #c9a227'}}>
          <div style={{fontSize: 54, fontWeight: 700, color: '#ffd700', textShadow: '3px 3px 0 #000', letterSpacing: 1}}>{biz.oldName}</div>
          <div style={{fontSize: 20, color: '#fff', fontStyle: 'italic'}}>"Quality You Can Trust Since Way Back!!!"</div>
        </div>
        <div style={{background: '#000080', color: '#ffff00', fontSize: 18, padding: 6, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          <span style={{display: 'inline-block', translate: `${600 - frame * 3}px 0`}}>*** WELCOME TO OUR WEB SITE *** CALL TODAY FOR A FREE ESTIMATE *** WE ACCEPT CHECKS ***</span>
        </div>
        <div style={{fontSize: 15, padding: '8px 12px', background: '#c0c0c0', borderBottom: '2px solid #808080'}}>
          {['Home', 'About Us', 'Our Services', 'Photo Gallery', 'Testimonials', 'Contact Us', 'Links'].map((t, i) => <span key={t}>{i ? ' | ' : ''}<span style={link}>{t}</span></span>)}
        </div>
        <div style={{display: 'flex', gap: 20, padding: 20}}>
          <div style={{width: 210, flexShrink: 0, background: '#f5f5dc', border: '3px outset #ccc', padding: 12, fontSize: 14}}>
            <b>QUICK LINKS</b>
            {biz.oldLinks.map((t) => <div key={t} style={{...link, margin: '6px 0'}}>» {t}</div>)}
            <div style={{marginTop: 18, fontSize: 12, textAlign: 'center'}}>You are visitor #<span style={{fontFamily: 'monospace', background: '#000', color: '#0f0', padding: '1px 4px'}}>004817</span></div>
          </div>
          <div style={{flex: 1, fontSize: 15, lineHeight: 1.35}}>
            <div style={{fontSize: 30, color: '#7a0a0a', fontWeight: 700, marginBottom: 10}}>Welcome!</div>
            <div style={{float: 'right', width: 250, height: 170, margin: '0 0 10px 14px', border: '2px solid #999', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13}}>[ {biz.oldPic} ]</div>
            <p>{biz.fullName} is a family owned and operated business that has been proudly serving the local community and surrounding areas for many years. We offer a wide variety of residential and commercial services including but not limited to {biz.oldWork} and much much more.</p>
            <p>Our experienced crew takes pride in every job big or small. We use only the finest materials available and all of our work is backed by our satisfaction policy. Please feel free to browse our web site to learn more about our company and the services that we offer. If you have any questions please do not hesitate to contact us during normal business hours Monday through Friday.</p>
            <p>To request an estimate please print out our estimate form, fill it out completely and mail or fax it to our office. <span style={link}>Click HERE for the estimate form (PDF)</span>.</p>
            <p style={{color: '#7a0a0a', fontWeight: 700}}>{biz.oldNews}</p>
            <p>Office hours: Mon-Fri 8am-4:30pm. Closed weekends and holidays. Fax: (555) 014-2290</p>
          </div>
        </div>
        <div id="old-footer" style={{background: '#c0c0c0', fontSize: 12, padding: '10px 14px', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between'}}>
          <span>© 2009 {biz.fullName}. All Rights Reserved. | <span style={link}>Webmaster</span></span>
          <span>Call: {biz.phone}</span>
          <span>Best viewed in Internet Explorer at 800x600</span>
        </div>
        <div style={{height: 400, background: '#e8e4d0'}} />
      </div>
    </div>
  );
};

// ---------- New site ----------
// Direction: a calm, decisive "we pick up" roofer. One committed cobalt field carries the hero, cool chalk below,
// Archivo Expanded for display, real photography, Phosphor icons. Radius rule: buttons and chips are full pills, surfaces 20px.
const DISPLAY = '"Archivo Variable", sans-serif';
const COBALT = 'var(--main)';
const COBALT_DEEP = 'var(--deep)';
const TINT = 'color-mix(in srgb, var(--main) 18%, white)';
const INK = '#0d1424';
const CHALK = '#f1f3f7';
const MUTED = '#556079';
const LINE = '#d9dfea';
const disp = (size, extra) => ({fontFamily: DISPLAY, fontStretch: '125%', fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.02em', ...extra});
const body = (size, extra) => ({fontFamily: DISPLAY, fontStretch: '100%', fontWeight: 450, fontSize: size, lineHeight: 1.45, ...extra});

// Simple geometric mark: two roof pitches.
const Mark = ({size = 22, color = '#fff'}) => (
  <svg width={size} height={size * 0.78} viewBox="0 0 28 22"><path d="M2 20 L14 6 L26 20" stroke={color} strokeWidth="3.4" fill="none" strokeLinejoin="round" strokeLinecap="round" /><path d="M9 20 L14 14 L19 20" stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity=".55" /></svg>
);
const Wordmark = ({size = 15, color = '#fff'}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.5, color, ...disp(size, {letterSpacing: '0.01em'})}}><Mark size={size * 1.5} color={color} />{useBiz().name}</div>
);
const Pill = ({children, kind = 'light', size = 15, style}) => {
  const k = {light: {background: '#fff', color: COBALT_DEEP}, ghost: {background: 'transparent', color: '#fff', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)'}, cobalt: {background: COBALT, color: '#fff'}}[kind];
  return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, padding: `${size * 0.95}px ${size * 1.3}px`, whiteSpace: 'nowrap', ...body(size, {fontWeight: 650}), ...k, ...style}}>{children}</div>;
};

const Bento = ({cols = 2, gap = 10, cells}) => (
  <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap}}>{cells}</div>
);
const Cell = ({span = 1, h, bg, children, style}) => (
  <div style={{gridColumn: `span ${span}`, height: h, borderRadius: 20, background: bg, padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', ...style}}>{children}</div>
);
const PhotoCell = ({span, h, title, sub, size = 19}) => (
  <Cell span={span} h={h} bg={INK} style={{justifyContent: 'flex-end'}}>
    <Img src={staticFile(useBiz().photos.detail)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,20,36,0) 30%, rgba(13,20,36,.85) 100%)'}} />
    <div style={{position: 'relative'}}>
      <div style={disp(size, {color: '#fff'})}>{title}</div>
      <div style={body(size * 0.68, {color: 'rgba(255,255,255,.82)', marginTop: 4})}>{sub}</div>
    </div>
  </Cell>
);
const IconCell = ({Icon, title, sub, bg, dark, span, h, size = 16}) => (
  <Cell span={span} h={h} bg={bg} style={dark ? {} : {boxShadow: `inset 0 0 0 1px ${LINE}`}}>
    <Icon size={size * 1.6} weight="bold" color={dark ? '#fff' : COBALT} />
    <div>
      <div style={disp(size, {color: dark ? '#fff' : INK})}>{title}</div>
      <div style={body(size * 0.8, {color: dark ? 'rgba(255,255,255,.78)' : MUTED, marginTop: 3})}>{sub}</div>
    </div>
  </Cell>
);

const Field = ({label, value, filled}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
    <div style={body(12.5, {fontWeight: 650, color: INK})}>{label}</div>
    <div style={{borderRadius: 14, background: '#fff', boxShadow: `inset 0 0 0 1.5px ${filled ? COBALT : LINE}`, padding: '12px 14px', ...body(14.5, {color: filled ? INK : '#6b7489'})}}>{value}</div>
  </div>
);

export const NewSiteMobile = ({scroll = 0}) => {
  const biz = useBiz();
  const [s0, s1, s2, s3] = biz.services;
  return (
  <div style={{width: 390, height: 844, overflow: 'hidden', position: 'relative', background: CHALK, ...bizVars(biz)}}>
    <div style={{translate: `0 ${-scroll}px`}}>
      {/* hero: the cobalt field */}
      <div style={{background: `linear-gradient(165deg, ${COBALT} 0%, ${COBALT_DEEP} 100%)`, padding: '0 14px 26px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56, padding: '0 4px'}}>
          <Wordmark />
          <div style={{width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><PhoneIcon size={18} weight="bold" color="#fff" /></div>
        </div>
        <div style={{height: 210, borderRadius: 20, overflow: 'hidden', position: 'relative'}}>
          <Img src={staticFile(biz.photos.hero)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, color-mix(in srgb, var(--deep) 55%, transparent) 100%)'}} />
        </div>
        <div style={{padding: '22px 4px 0'}}>
          <div style={disp(35, {color: '#fff'})}>{biz.headline[0]}<br />{biz.headline[1]}</div>
          <div style={body(15, {color: TINT, margin: '12px 0 20px', maxWidth: 330})}>{biz.sub}</div>
          <Pill kind="light" size={15.5}><PhoneIcon size={18} weight="fill" />Call {biz.phone}</Pill>
          <Pill kind="ghost" size={15} style={{marginTop: 10}}>{biz.cta2}<ArrowRight size={16} weight="bold" /></Pill>
        </div>
      </div>

      {/* services bento */}
      <div style={{padding: '30px 14px 8px'}}>
        <div style={disp(24, {color: INK, margin: '0 4px 14px'})}>{biz.servicesTitle}</div>
        <Bento cells={[
          <PhotoCell key="a" span={2} h={180} title={s0[0]} sub={s0[1]} />,
          <IconCell key="b" Icon={HouseLine} title={s1[0]} sub={s1[1]} bg={COBALT} dark h={150} />,
          <IconCell key="c" Icon={Drop} title={s2[0]} sub={s2[1]} bg="#fff" h={150} />,
          <IconCell key="d" Icon={Camera} title={s3[0]} sub={s3[1]} bg="#e4e9f4" span={2} h={118} />,
        ]} />
      </div>

      {/* how it goes */}
      <div style={{padding: '26px 18px 6px'}}>
        <div style={disp(24, {color: INK, marginBottom: 18})}>How it goes</div>
        {[[PhoneCall, 'You call', 'We answer, and book a time that suits you.'], [MagnifyingGlass, 'We inspect', 'Free, with photos and a written quote.'], [CheckCircle, 'You approve', 'No work starts until you say yes.']].map(([Icon, t, s], i) => (
          <div key={t} style={{display: 'flex', gap: 14, paddingBottom: 18, position: 'relative'}}>
            {i < 2 && <div style={{position: 'absolute', left: 21, top: 44, bottom: 0, width: 2, background: LINE}} />}
            <div style={{width: 44, height: 44, borderRadius: 999, background: '#fff', boxShadow: `inset 0 0 0 1.5px ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}><Icon size={20} weight="bold" color={COBALT} /></div>
            <div><div style={disp(16, {color: INK})}>{t}</div><div style={body(13.5, {color: MUTED, marginTop: 3})}>{s}</div></div>
          </div>
        ))}
      </div>

      {/* booking */}
      <div style={{margin: '8px 14px', borderRadius: 20, background: '#fff', padding: 18, boxShadow: '0 14px 40px rgba(13,20,36,.10)', display: 'flex', flexDirection: 'column', gap: 14}}>
        <div style={disp(22, {color: INK})}>{biz.bookTitle}</div>
        <Field label="Name" value="Dana Whitfield" filled />
        <Field label="Phone" value="(555) 018-4471" filled />
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={body(12.5, {fontWeight: 650, color: INK})}>{biz.ask}</div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
            {biz.chips.map((c, i) => (
              <div key={c} style={{borderRadius: 999, padding: '9px 14px', ...body(13, {fontWeight: 600}), background: i ? '#fff' : COBALT, color: i ? INK : '#fff', boxShadow: i ? `inset 0 0 0 1.5px ${LINE}` : 'none'}}>{c}</div>
            ))}
          </div>
        </div>
        <Pill kind="cobalt" size={15.5}>{biz.cta2}<ArrowRight size={16} weight="bold" /></Pill>
      </div>
      <div style={{height: 260}} />
    </div>

    {/* sticky call bar */}
    <div style={{position: 'absolute', left: 12, right: 12, bottom: 18, borderRadius: 999, padding: 6, background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(14px)', boxShadow: '0 12px 34px rgba(13,20,36,.22), inset 0 0 0 1px rgba(255,255,255,.6)', display: 'flex'}}>
      <Pill kind="cobalt" size={15} style={{flex: 1}}><PhoneIcon size={17} weight="fill" />Call {biz.phone}</Pill>
    </div>
  </div>
  );
};

export const NewSiteDesktop = () => {
  const biz = useBiz();
  return (
  <div style={{width: 1280, height: 800, background: CHALK, overflow: 'hidden', ...bizVars(biz)}}>
    <div style={{display: 'grid', gridTemplateColumns: '660px 1fr', height: 600}}>
      <div style={{background: `linear-gradient(165deg, ${COBALT} 0%, ${COBALT_DEEP} 100%)`, padding: '0 56px', display: 'flex', flexDirection: 'column'}}>
        <div style={{height: 76, display: 'flex', alignItems: 'center'}}><Wordmark size={20} /></div>
        <div style={{marginTop: 70}}>
          <div style={disp(54, {color: '#fff'})}>{biz.headline[0]}<br />{biz.headline[1]}</div>
          <div style={body(19, {color: TINT, margin: '20px 0 32px', maxWidth: 440})}>{biz.sub}</div>
          <div style={{display: 'flex', gap: 12}}>
            <Pill kind="light" size={17}><PhoneIcon size={20} weight="fill" />Call {biz.phone}</Pill>
            <Pill kind="ghost" size={17}>{biz.cta2}<ArrowRight size={18} weight="bold" /></Pill>
          </div>
        </div>
      </div>
      <div style={{position: 'relative'}}>
        <Img src={staticFile(biz.photos.hero)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, color-mix(in srgb, var(--deep) 80%, transparent) 0%, transparent 30%)'}} />
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 30, padding: '0 40px', ...body(16, {fontWeight: 600, color: '#fff'})}}>
          {['Services', 'Projects', 'Reviews', 'Service area'].map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>
    </div>
    <div style={{padding: '24px 56px'}}>
      <Bento cols={4} gap={14} cells={[
        <PhotoCell key="a" span={1} h={170} title={biz.services[0][0]} sub={biz.services[0][1]} size={18} />,
        <IconCell key="b" Icon={HouseLine} title={biz.services[1][0]} sub={biz.services[1][1]} bg={COBALT} dark h={170} size={18} />,
        <IconCell key="c" Icon={Drop} title={biz.services[2][0]} sub={biz.services[2][1]} bg="#fff" h={170} size={18} />,
        <IconCell key="d" Icon={Camera} title={biz.services[3][0]} sub={biz.services[3][1]} bg="#e4e9f4" h={170} size={18} />,
      ]} />
    </div>
  </div>
  );
};
