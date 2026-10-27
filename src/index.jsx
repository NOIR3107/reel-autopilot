import {Composition, registerRoot} from 'remotion';
import {Ad, AD_FRAMES} from './ad/Ad.jsx';
import {Kinetic, KINETIC_FRAMES} from './reels/Kinetic.jsx';
import {Teardown, TEARDOWN_FRAMES} from './reels/Teardown.jsx';
import {MikeEpisode, sceneFrames} from './reels/MikeEpisode.jsx';
import EPISODES from './reels/mike-episodes.json';
import {MikeStory} from './reels/MikeStory.jsx';
import {StoryReel, storyFrames} from './reels/StoryReel.jsx';
import {Explainer, explainerFrames} from './reels/Explainer.jsx';
import {Survival, survivalFrames} from './reels/Survival.jsx';

// One composition per style. The daily robot renders the one named in today's script, with the script's props.
const FPS = 30;
const size = {fps: FPS, width: 1080, height: 1920};

registerRoot(() => (
  <>
    <Composition id="ad" component={Ad} {...size} durationInFrames={AD_FRAMES} defaultProps={{trade: 'roofing', music: false}} />
    <Composition id="teardown" component={Teardown} {...size} durationInFrames={TEARDOWN_FRAMES} defaultProps={{music: false}} />
    <Composition id="kinetic" component={Kinetic} {...size} durationInFrames={KINETIC_FRAMES} defaultProps={{music: false}} />
    <Composition id="mike" component={MikeEpisode} {...size} durationInFrames={1} defaultProps={{scenes: EPISODES.story.scenes, music: false}}
      calculateMetadata={({props}) => ({durationInFrames: sceneFrames(props.scenes)})} />
    <Composition id="mikestory" component={MikeStory} {...size} durationInFrames={1} defaultProps={{scenes: EPISODES.story.scenes, music: false}}
      calculateMetadata={({props}) => ({durationInFrames: sceneFrames(props.scenes)})} />
    <Composition id="story" component={StoryReel} {...size} durationInFrames={1} defaultProps={{scenes: EPISODES.story.scenes, music: false}}
      calculateMetadata={({props}) => ({durationInFrames: storyFrames(props.scenes)})} />
    <Composition id="explainer" component={Explainer} {...size} durationInFrames={1} defaultProps={{scenes: [{sec: 2, vo: 'hi'}], music: false}}
      calculateMetadata={({props}) => ({durationInFrames: explainerFrames(props.scenes)})} />
    <Composition id="survival" component={Survival} {...size} durationInFrames={1} defaultProps={{scenes: [{sec: 2, vo: 'hi'}], music: false}}
      calculateMetadata={({props}) => ({durationInFrames: survivalFrames(props.scenes)})} />
  </>
));
