// Unneel Works ad reels: one short line per card, big left-aligned type, brand palette (navy, slate, cream, one orange accent).
// Props come from tools/unneel_make.py: {cards: [{text, bg, cta, start, sec}], audio, sec}. *word* = accent colour.
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';

const FONT = '"Bricolage Grotesque Variable", sans-serif';
const C = {navy: '#101D35', slate: '#354D70', steel: '#7186A5', cream: '#F3EBDD', orange: '#FF4D1F'};
const THEME = { // [background, text, accent]
  navy: [C.navy, C.cream, C.orange], cream: [C.cream, C.navy, C.orange],
  slate: [C.slate, C.cream, C.orange], orange: [C.orange, C.navy, C.cream],
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
export const unneelFrames = (p) => Math.round(p.sec * 30);

const words = (line) => line.split(/(\*[^*]+\*)/).filter(Boolean).flatMap((t) => {
  const acc = t.startsWith('*');
  return (acc ? t.slice(1, -1) : t).split(/\s+/).filter(Boolean).map((w) => ({w, acc}));
});

const Card = ({card, index, total, local, fps}) => {
  const [bg, fg, accent] = THEME[card.bg];
  const lines = card.text.split('\n');
  // biggest type that still fits ~900px wide and ~1000px tall (a char is about 0.5em wide in this tight setting)
  let size = 230;
  for (; size > 70; size -= 6) {
    const per = Math.floor(900 / (size * 0.5));
    const rows = lines.reduce((a, l) => a + Math.ceil(l.replace(/\*/g, '').length / per), 0);
    if (rows * size * 1.06 <= 1000) break;
  }
  const push = interpolate(local, [0, card.sec * fps], [1, 1.045], clamp);
  const spin = interpolate(local, [0, card.sec * fps], [0, 14], clamp);
  let n = 0;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', right: -330, top: 1080, width: 760, height: 760, border: `4px solid ${fg}`, opacity: 0.12, transform: `rotate(${28 + spin}deg)`}} />
      <div style={{position: 'absolute', right: -180, top: 1230, width: 500, height: 500, background: card.bg === 'orange' ? C.navy : accent, opacity: 0.16, transform: `rotate(${-18 - spin}deg)`}} />
      <div style={{position: 'absolute', left: 90, right: 90, top: 110, display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '0.14em', color: fg, opacity: 0.75}}>
        <span>UNNEEL WORKS</span><span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, top: 168, height: 3, background: fg, opacity: 0.35}} />
      <AbsoluteFill style={{justifyContent: 'center', padding: '0 90px', boxSizing: 'border-box', transform: `scale(${push})`, transformOrigin: '0% 50%'}}>
        {lines.map((line, li) => (
          <div key={li} style={{display: 'flex', flexWrap: 'wrap', gap: `0 ${size * 0.24}px`, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.045em'}}>
            {words(line).map(({w, acc}, wi) => {
              const k = n++;
              const pop = spring({frame: local - k * 3, fps, config: {damping: 13, stiffness: 240}});
              return (
                <span key={wi} style={{display: 'inline-block', color: acc ? accent : fg, opacity: Math.min(1, pop * 1.6), transform: `translateY(${(1 - pop) * 50}px) scale(${0.92 + 0.08 * pop})`}}>{w}</span>
              );
            })}
          </div>
        ))}
        {card.cta && (
          <div style={{marginTop: 70, fontFamily: FONT, fontWeight: 700, fontSize: 46, letterSpacing: '-0.01em', color: fg, opacity: interpolate(local, [14, 26], [0, 1], clamp)}}>
            Unneel Works · @unneelworks<br /><span style={{opacity: 0.6, fontSize: 36}}>AI automation and agents for US & UK businesses</span>
          </div>
        )}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 14, background: accent, width: `${((index + 1) / total) * 100}%`}} />
      <AbsoluteFill style={{background: accent, transform: `translateX(${interpolate(local, [0, 7], [0, 110], clamp)}%)`, opacity: index === 0 ? 0 : 1}} />
    </AbsoluteFill>
  );
};

export const Unneel = ({cards = [], audio}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  void frame;
  return (
    <AbsoluteFill style={{background: C.navy}}>
      {cards.map((c, i) => (
        <Sequence key={i} from={Math.round(c.start * fps)} durationInFrames={Math.round(c.sec * fps) + 1}>
          <CardInner card={c} index={i} total={cards.length} fps={fps} />
        </Sequence>
      ))}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
const CardInner = ({card, index, total, fps}) => <Card card={card} index={index} total={total} local={useCurrentFrame()} fps={fps} />;
