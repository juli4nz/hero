import App from './scripts/app.js';
import FOG from 'vanta/dist/vanta.fog.min';
import THREE from 'three';

new App().init();
FOG({
  el: 'body',
  mouseControls: true,
  touchControls: true,
  minHeight: 200.0,
  minWidth: 200.0,
  highlightColor: 0xc1a3c,
  midtoneColor: 0x1b263e,
  lowlightColor: 0x3f4f6b,
  baseColor: 0x13173c,
  blurFactor: 0.68,
  speed: 0.7,
  zoom: 1.5
});
