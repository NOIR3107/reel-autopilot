// Gun-loop hook, then the lyric panel on the original reel's timeline (its "love me" moments land on the red hooks).
import React from 'react';
import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import {GunHook, HOOK_SECONDS} from './GunHook.jsx';
import {Lyric, lyricSeconds} from './Lyric.jsx';
import script from '../../data/lyric-gunlove.json';

export const gunLoveSeconds = () => HOOK_SECONDS + lyricSeconds(script);
export const GunLove = ({audio}) => (
  <AbsoluteFill>
    <Series>
      <Series.Sequence durationInFrames={Math.round(HOOK_SECONDS * 30)}><GunHook /></Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(lyricSeconds(script) * 30)}><Lyric script={script} audio={null} /></Series.Sequence>
    </Series>
    {audio && <Audio src={staticFile(audio)} />}
  </AbsoluteFill>
);
