import React, { useState } from 'react';
import { COLORS } from './../constants/ui';

interface DockIconProps {
  size: number;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onContextMenu?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

const DockIcon: React.FC<DockIconProps> = ({ size, onClick, onContextMenu }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <svg
      viewBox="0 0 34 30"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ width: size, height: size, borderRadius: 10, cursor: 'pointer', transition: 'opacity .28s ease' }}
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b68e68" />
          <stop offset="55%" stopColor="#8e7357" />
          <stop offset="100%" stopColor="#62888e" />
        </linearGradient>
        <linearGradient id="iconGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0b67f" />
          <stop offset="55%" stopColor="#d1905a" />
          <stop offset="100%" stopColor="#7ec8d6" />
        </linearGradient>
        <filter id="duoShadow" x="-50%" y="-50%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0.6" stdDeviation="0.9" floodColor="#000000" floodOpacity="0.22" />
          <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#ffffff" floodOpacity="0.28" />
        </filter>
        <filter id="duoShadowHover" x="-50%" y="-50%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.3" floodColor="#000000" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="0" stdDeviation="1.1" floodColor="#ffffff" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#f5deb3" floodOpacity="0.35" />
        </filter>
      </defs>

      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1" shapeRendering="optimizeQuality">
        <g
          transform="translate(-12, -11)"
          fill={hovered ? 'url(#iconGradientHover)' : 'url(#iconGradient)'}
          stroke={hovered ? COLORS.stroke : 'none'}
          strokeWidth={hovered ? 0.16 : 0}
          vectorEffect="non-scaling-stroke"
          filter={hovered ? 'url(#duoShadowHover)' : 'url(#duoShadow)'}
        >
          <path d="M29.8192538,27.9315935 L30.1678065,28.5132463 L37.6074704,40.9367339 L37.5726151,41 L34.011181,41 L29.9276924,34.3293792 L28.76585,36.3064452 L31.0895348,36.3064452 L29.6081857,39.3748517 L26.768643,39.3748517 L25.7884353,41 L22.0271643,41 L29.8192538,27.9315935 Z M29.4454891,27.225346 L29.6104707,27.5195334 L29.5907194,27.5519573 L21.5740071,40.9999605 L21.2332,40.9999605 L29.4203158,27.2672598 L29.4454891,27.225346 Z M20.633031,12.5815737 L26.7791771,22.8623171 L23.5372496,22.8623171 L21.0203117,19.3035983 L17.5347846,25.2347964 L29.1532083,25.2347964 L28.7388178,26.1323843 L20.3077151,40.2684065 L14.7153805,30.3751681 L18.1157058,30.3751681 L20.2991949,33.4617635 L23.507429,28.0026888 L13.3715162,28.0026888 L12.2948756,26.0967972 L20.633031,12.5815737 Z M38.6532835,13.111467 L44.1716474,22.8623567 L40.9649625,22.8623567 L38.4476374,19.3036378 L34.9621103,25.2348359 L45.5120262,25.2348359 L46,26.0968367 L44.9233594,28.0027284 L34.9621103,28.0027284 L38.4476374,33.9339265 L41.3526305,29.5843812 L44.3540567,29.5843812 L38.4906255,39.3748122 L30.7256457,26.4131673 L38.6532835,13.111467 Z M24.118558,28.0026888 L23.8462996,28.0026888 L20.4843151,33.7239225 L20.633031,33.9338869 L24.118558,28.0026888 Z M38.2698367,12.4274417 L38.4324947,12.7200474 L30.4974986,26.0328193 L30.3270951,25.7481218 L38.2698367,12.4274417 Z M20.3331207,12.0208778 L20.5561944,12.4000791 L12.2145536,25.8848557 L12,25.4918149 L20.3331207,12.0208778 Z M37.7952241,11 L37.557821,11.3954132 L32.9499542,11.3954132 L32.1064567,13.0589166 L29.2653648,13.0589166 L27.7619408,15.7164887 L29.0217652,17.8790036 L29.946979,16.1403717 L28.1577417,16.1403717 L29.6390908,13.3448003 L32.4794081,13.3448003 L33.4483846,11.7908264 L37.2894354,11.7908264 L29.6452872,24.6101226 L21.9961044,11.7908264 L25.4746604,11.7908264 L27.5349942,15.3270067 L29.0411292,12.6635034 L31.8713772,12.6635034 L32.7144875,11 L37.7952241,11 Z M30.4818137,16.1403717 L30.2769422,16.1403717 L29.1944924,18.1751681 L29.3195841,18.3902728 L30.4818137,16.1403717 Z M24.9938513,11 L25.2269944,11.3954132 L21.7337217,11.3954132 L21.492833,11 L24.9938513,11 Z" />
        </g>
      </g>
    </svg>
  );
};

export default DockIcon;