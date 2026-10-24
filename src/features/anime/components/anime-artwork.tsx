import type { AnimeArt } from "@/features/anime/types";

/**
 * Generiertes, abstraktes Demo-Artwork je Anime (kein urheberrechtlich
 * geschütztes Bildmaterial). Quadratische Komposition, die als Poster
 * (Hochformat) und als Banner (Querformat) zugeschnitten werden kann.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function random(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function AnimeArtwork({
  art,
  seed,
  className,
}: {
  art: AnimeArt;
  seed: string;
  className?: string;
}) {
  const [bg, mid, accent] = art.palette;
  const rand = random(hash(seed));
  const offsetX = round((rand() - 0.5) * 80);
  // Varianten derselben Serie: gespiegelt und unterschiedlich nah herangezoomt.
  const flip = rand() > 0.5;
  const zoom = round(1 + rand() * 0.25);
  const focusX = round(150 + rand() * 100);
  const focusY = round(150 + rand() * 100);
  // Spiegelung um die Mitte, Zoom um einen Punkt im Bild – beides lässt keine Ränder frei.
  const transform = `${flip ? "translate(400 0) scale(-1 1) " : ""}translate(${focusX} ${focusY}) scale(${zoom}) translate(${-focusX} ${-focusY})`;

  let motif: React.ReactNode;
  switch (art.motif) {
    case "sun": {
      const cy = 170 + rand() * 30;
      motif = (
        <>
          <circle cx={200 + offsetX} cy={cy} r={110} fill={mid} />
          <circle
            cx={200 + offsetX}
            cy={cy}
            r={70}
            fill={accent}
            opacity={0.85}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={0}
              y={cy + 20 + i * 18}
              width={400}
              height={4 + i * 2.5}
              fill={bg}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <path
              key={`w${i}`}
              d={`M0 ${300 + i * 28} Q 100 ${280 + i * 28 - rand() * 20} 200 ${300 + i * 28} T 400 ${300 + i * 28} V 400 H 0 Z`}
              fill={i === 0 ? mid : bg}
              opacity={i === 0 ? 0.55 : 0.9}
            />
          ))}
        </>
      );
      break;
    }
    case "moon": {
      motif = (
        <>
          {Array.from({ length: 28 }, (_, i) => (
            <circle
              key={i}
              cx={round(rand() * 400)}
              cy={round(rand() * 220)}
              r={round(0.8 + rand() * 1.6)}
              fill={accent}
              opacity={round(0.35 + rand() * 0.5)}
            />
          ))}
          <circle cx={250 + offsetX / 2} cy={130} r={70} fill={accent} />
          <circle cx={278 + offsetX / 2} cy={112} r={62} fill={bg} />
          {Array.from({ length: 9 }, (_, i) => {
            const width = 30 + rand() * 30;
            const height = 70 + rand() * 120;
            return (
              <rect
                key={`b${i}`}
                x={round(i * 46 - 10)}
                y={round(400 - height)}
                width={round(width)}
                height={round(height)}
                fill={mid}
                opacity={0.35 + (i % 3) * 0.2}
              />
            );
          })}
        </>
      );
      break;
    }
    case "rays": {
      const cx = 200 + offsetX;
      const cy = 200;
      motif = (
        <>
          {Array.from({ length: 18 }, (_, i) => {
            const a1 = (i / 18) * Math.PI * 2;
            const a2 = a1 + Math.PI / 30;
            return (
              <path
                key={i}
                d={`M${cx} ${cy} L${round(cx + Math.cos(a1) * 400)} ${round(cy + Math.sin(a1) * 400)} L${round(cx + Math.cos(a2) * 400)} ${round(cy + Math.sin(a2) * 400)} Z`}
                fill={mid}
                opacity={0.55}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={84} fill={mid} />
          <circle cx={cx} cy={cy} r={54} fill={accent} />
        </>
      );
      break;
    }
    case "rings": {
      const cx = 200 + offsetX;
      motif = (
        <>
          {[150, 120, 92, 66, 42].map((r, i) => (
            <circle
              key={r}
              cx={cx}
              cy={190}
              r={r}
              fill="none"
              stroke={i % 2 ? accent : mid}
              strokeWidth={i === 0 ? 18 : 8}
              opacity={0.9 - i * 0.1}
            />
          ))}
          <path
            d={`M${cx} 190 m-24 0 a24 24 0 1 1 48 0 a36 36 0 1 1 -72 0 a52 52 0 1 1 104 0`}
            fill="none"
            stroke={accent}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </>
      );
      break;
    }
    case "waves": {
      motif = (
        <>
          {Array.from({ length: 7 }, (_, i) => {
            const y = 120 + i * 42;
            const amp = 18 + rand() * 14;
            return (
              <path
                key={i}
                d={`M0 ${y} C 70 ${y - amp} 130 ${y + amp} 200 ${y} S 330 ${y - amp} 400 ${y} V 400 H 0 Z`}
                fill={i % 2 ? bg : mid}
                stroke={accent}
                strokeWidth={i % 3 === 0 ? 3 : 0}
                opacity={0.95}
              />
            );
          })}
          <circle cx={300 + offsetX / 2} cy={80} r={34} fill={accent} />
        </>
      );
      break;
    }
    case "peaks": {
      motif = (
        <>
          <rect
            x={0}
            y={250}
            width={400}
            height={150}
            fill={mid}
            opacity={0.5}
          />
          {Array.from({ length: 5 }, (_, i) => {
            const x = i * 100 - 40 + rand() * 30;
            const h = 160 + rand() * 120;
            return (
              <path
                key={i}
                d={`M${round(x)} 400 L${round(x + 90)} ${round(400 - h)} L${round(x + 180)} 400 Z`}
                fill={i % 2 ? mid : accent}
                opacity={0.45 + i * 0.1}
              />
            );
          })}
          <rect
            x={0}
            y={330}
            width={400}
            height={70}
            fill={bg}
            opacity={0.85}
          />
          {Array.from({ length: 14 }, (_, i) => (
            <rect
              key={`c${i}`}
              x={i * 30}
              y={318}
              width={18}
              height={14}
              fill={bg}
              opacity={0.85}
            />
          ))}
        </>
      );
      break;
    }
    case "shards": {
      motif = (
        <>
          {Array.from({ length: 11 }, (_, i) => {
            const x = rand() * 400;
            const y = rand() * 400;
            const s = 60 + rand() * 120;
            return (
              <path
                key={i}
                d={`M${round(x)} ${round(y)} l${round(s)} ${round(-s * 0.4)} l${round(-s * 0.3)} ${round(s)} Z`}
                fill={i % 3 === 0 ? accent : mid}
                opacity={round(0.35 + rand() * 0.5)}
              />
            );
          })}
          <path
            d="M60 400 L340 0"
            stroke={accent}
            strokeWidth={5}
            opacity={0.9}
          />
        </>
      );
      break;
    }
    case "stars": {
      motif = (
        <>
          {Array.from({ length: 46 }, (_, i) => (
            <circle
              key={i}
              cx={round(rand() * 400)}
              cy={round(rand() * 280)}
              r={round(0.7 + rand() * 1.8)}
              fill={accent}
              opacity={round(0.3 + rand() * 0.6)}
            />
          ))}
          <path
            d={`M${200 + offsetX} 70 l10 40 l40 10 l-40 10 l-10 40 l-10 -40 l-40 -10 l40 -10 Z`}
            fill={accent}
          />
          <path
            d="M0 310 Q 200 270 400 310 V 400 H 0 Z"
            fill={mid}
            opacity={0.6}
          />
          <path
            d="M0 340 Q 200 310 400 345 V 400 H 0 Z"
            fill={bg}
            opacity={0.9}
          />
        </>
      );
      break;
    }
  }

  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <rect width={400} height={400} fill={bg} />
      <g transform={transform}>{motif}</g>
    </svg>
  );
}
