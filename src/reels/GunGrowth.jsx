// Full reel: the 3D "bullet in a round tube" hook, then the lyric panel carries the line on ("is knowing exactly...").
import React from 'react';
import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import {GunHook, HOOK_SECONDS} from './GunHook.jsx';
import {Lyric, lyricSeconds} from './Lyric.jsx';
import script from '../../data/lyric-growth2.json';

export const gunGrowthSeconds = () => HOOK_SECONDS + lyricSeconds(script);
export const GunGrowth = ({audio}) => (
  <AbsoluteFill>
    <Series>
      <Series.Sequence durationInFrames={Math.round(HOOK_SECONDS * 30)}><GunHook /></Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(lyricSeconds(script) * 30)}><Lyric script={script} audio={null} /></Series.Sequence>
    </Series>
    {audio && <Audio src={staticFile(audio)} />}
  </AbsoluteFill>
);
