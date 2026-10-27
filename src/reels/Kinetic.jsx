// Style 3: Kinetic Type. Full-screen color blocks, 1-4 words a card, hard cuts on the beat.
// Text markup in kinetic-cards.json: *word* = accent color, [word] = the reel's one lime highlighter, \n = line break.
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {Phone as PhoneIcon} from '@phosphor-icons/react';
import DATA from './kinetic-cards.json';

const FPS = 30;
export const KINETIC_FRAMES = DATA.totalSeconds * FPS;
const BEAT = (60 / DATA.bpm) * FPS;
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const C = {ink: '#0d1424', paper: '#f4f5f7', lime: '#d9ff3f', cobalt: '#2346d0'};
const FG = {ink: [C.paper, C.lime], paper: [C.ink, C.cobalt], lime: [C.ink, C.ink], cobalt: [C.paper, C.lime]}; // [text, accent]
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

// Card start frames, snapped to the beat grid (bpm is a house constant; cards come from the script).
const timeCards = (cards) => {
  let acc = 0;
  return cards.map((c) => {
    const start = Math.round(acc * BEAT);
    acc += c.beats ?? 0;
    return {...c, start};
  });
};

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/></svg>")`;

// Splits "a *b* [c]" into styled runs.
const runs = (line) => line.split(/(\*[^*]+\*|\[[^\]]+\])/).filter(Boolean).map((t) => (
  t.startsWith('*') ? {t: t.slice(1, -1), k: 'accent'} : t.startsWith('[') ? {t: t.slice(1, -1), k: 'mark'} : {t, k: 'plain'}));

const Card = ({card, local, fps}) => {
  const [fg, accent] = FG[card.bg];
  const lines = card.text.split('\n');
  const longest = Math.max(...lines.map((l) => l.replace(/[*[\]]/g, '').length));
  const size = Math.min(card.turn ? 260 : 230, 1700 / Math.max(longest, 4)); // fills ~760px, keeps the right 230px clear
  const punch = spring({frame: local, fps, config: {damping: 14, stiffness: 260}});
  return (
    <AbsoluteFill style={{background: C[card.bg], alignItems: 'flex-start', justifyContent: 'center', padding: '0 90px', boxSizing: 'border-box'}}>
      <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: card.bg === 'ink' ? 'screen' : 'multiply'}} />
      <div style={{scale: String(1.06 - 0.06 * punch), transformOrigin: '0% 50%', marginTop: -80}}>
        {card.icon === 'phone' && <div style={{marginBottom: 30}}><PhoneIcon size={150} weight="fill" color={fg} /></div>}
        {lines.map((line, li) => (
          <div key={li} style={{fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.0, letterSpacing: '-0.045em', color: fg, whiteSpace: 'nowrap', paddingBottom: size * 0.06}}>
            {runs(line).map((r, ri) => r.t.split(/(\s+)/).map((piece, pi) => {
              if (!piece.trim()) return piece;
                            const style = r.k === 'accent' ? {color: accent} : r.k === 'mark' ? {background: C.lime, color: C.ink, padding: '0 0.12em', borderRadius: 10, boxDecorationBreak: 'clone'} : {};
              return <span key={`${ri}-${pi}`} style={style}>{piece}</span>;
            }))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Cta = ({local, fps, card = {}}) => {
  const {keyword = 'WEBSITE', sub = "I'll check yours. Free.", share = 'Send this to a contractor who needs it', top = 'Comment'} = card;
  const pop = spring({frame: local - 10, fps, config: {damping: 11, stiffness: 150}});
  const fade = (a) => interpolate(local, [a, a + 12], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.ink, alignItems: 'center', justifyContent: 'center', gap: 34, fontFamily: FONT, paddingBottom: 160}}>
      <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: 'screen'}} />
      <div style={{fontWeight: 800, fontSize: 110, letterSpacing: '-0.045em', color: C.paper}}>{top}</div>
      <div style={{background: C.lime, color: C.ink, fontWeight: 800, fontSize: 150, letterSpacing: '-0.04em', padding: '16px 70px', borderRadius: 999, scale: String(local < 10 ? 0 : pop)}}>{keyword}</div>
      <div style={{fontWeight: 600, fontSize: 46, color: 'rgba(244,245,247,.85)', opacity: fade(24), marginTop: 10, textAlign: 'center', padding: '0 80px'}}>{sub}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '18px 30px', borderRadius: 999, border: '1.5px solid rgba(244,245,247,.3)', fontWeight: 600, fontSize: 32, color: C.paper, opacity: fade(48), marginTop: 20}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.lime} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z" /></svg>
        {share}
      </div>
    </AbsoluteFill>
  );
};

export const Kinetic = ({cards = DATA.cards, music = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const card = timeCards(cards).findLast((c) => frame >= c.start);
  const local = frame - card.start;
  return (
    <AbsoluteFill>
      {card.cta ? <Cta local={local} fps={fps} card={card} /> : <Card card={card} local={local} fps={fps} />}
      {music && <Audio src={staticFile('kinetic-sound.wav')} />}
    </AbsoluteFill>
  );
};
