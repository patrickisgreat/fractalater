export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="180"
      height="44"
      viewBox="0 0 580 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Rainbow gradient for the F */}
        <linearGradient id="rainbow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF0033" />
          <stop offset="16%" stopColor="#FF8A00" />
          <stop offset="33%" stopColor="#FFEE00" />
          <stop offset="50%" stopColor="#00D943" />
          <stop offset="66%" stopColor="#0077FF" />
          <stop offset="83%" stopColor="#7A00FF" />
          <stop offset="100%" stopColor="#D400FF" />
        </linearGradient>

        {/* Base block "F" shape */}
        <g id="Fbase">
          {/* Vertical stem */}
          <rect x="0" y="0" width="26" height="104" fill="url(#rainbow)" />
          {/* Top bar */}
          <rect x="0" y="0" width="80" height="26" fill="url(#rainbow)" />
          {/* Middle bar */}
          <rect x="0" y="48" width="60" height="26" fill="url(#rainbow)" />
        </g>
      </defs>

      {/* Fractal "F": big F + smaller self-similar F's inside */}
      <g transform="translate(20,18)">
        {/* Main large F */}
        <use href="#Fbase" />

        {/* First smaller F (about half size), nested in upper area */}
        <use href="#Fbase" transform="translate(24,10) scale(0.5)" />

        {/* Second smaller F (about 35%), nested in middle area */}
        <use href="#Fbase" transform="translate(26,56) scale(0.35)" />

        {/* Third even smaller F (about 22%), nested in stem */}
        <use href="#Fbase" transform="translate(10,30) scale(0.22)" />
      </g>

      {/* Wordmark, tight to the F */}
      <text
        x="120"
        y="97"
        fill="#F2F2F2"
        fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="96"
        fontWeight="500"
      >
        ractalater
      </text>
    </svg>
  );
}
