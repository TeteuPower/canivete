import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Campo de partículas ASCII — port nativo do `particle-drift` do 21st.dev.
 *
 * O original desenha o mesmo campo, mas dentro de um `<iframe srcDoc>` que carrega
 * Tailwind, GSAP, GSAP/ScrollTrigger e Iconify de CDN para depois esconder tudo
 * menos o canvas. Aqui o canvas é o componente. O que isso resolve:
 *
 * 1. Funciona offline. Num app desktop (WebView2) não há garantia de rede.
 * 2. O mouse continua valendo com a UI por cima. O `mousemove` é escutado na
 *    janela hospedeira e projetado no retângulo do canvas, então o canvas pode
 *    ser `pointer-events: none` sem perder a interação.
 * 3. Movimento independente de taxa de quadros. O original avança por quadro
 *    (`y += vy`), então num monitor de 144 Hz o campo corre 2,4× mais rápido.
 *    Aqui o passo é normalizado para 60 fps.
 * 4. Sem escala composta no resize. O original chama `ctx.scale(dpr, dpr)` a cada
 *    redimensionamento, e a transformação acumula; aqui é `setTransform`.
 * 5. Congela com `prefers-reduced-motion` e pausa com a aba escondida.
 */

export type ParticleFieldMode = "dark" | "light" | "auto";

export type ParticleFieldProps = {
  /** `auto` segue `data-theme`/`data-scheme` na raiz, ou `prefers-color-scheme`. */
  mode?: ParticleFieldMode;
  /** Multiplicador de velocidade. 0 congela. */
  speed?: number;
  /** Multiplicador da contagem de nós e feixes. */
  density?: number;
  /** Comprimento dos feixes e alcance da malha de proximidade. */
  length?: number;
  /** Espessura dos feixes. */
  strokeWidth?: number;
  /** Opacidade do campo inteiro. */
  opacity?: number;
  /** Giro de matiz, em graus. Use para levar o azul a outra cor. */
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Desliga o rastreamento do mouse — campo puramente ambiente. */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()";

/** Distância, em px, em que um nó reage ao cursor. Do original. */
const MOUSE_REACH = 180;
/** Alcance base da malha, antes do multiplicador `length`. Do original. */
const LINK_BASE = 120;

const PALETTE = {
  dark: {
    accent: "#60A5FA",
    accentRgb: "96, 165, 250",
    idle: "rgba(156, 163, 175, 0.4)",
    meshRgb: "156, 163, 175",
    meshAlpha: 0.15,
  },
  light: {
    accent: "#2563EB",
    accentRgb: "37, 99, 235",
    idle: "rgba(36, 48, 68, 0.55)",
    meshRgb: "36, 48, 68",
    meshAlpha: 0.22,
  },
} as const;

type Node = { x: number; y: number; vy: number; ch: string };
type Beam = { x: number; y: number; len: number; speed: number; op: number };

type Knobs = {
  mode: "dark" | "light";
  speed: number;
  density: number;
  length: number;
  strokeWidth: number;
  interactive: boolean;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function randChar() {
  return CHARS[(Math.random() * CHARS.length) | 0]!;
}

function readAutoMode(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  const declared = root.dataset.scheme ?? root.dataset.theme;
  if (declared === "light" || declared === "dark") return declared;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useResolvedMode(requested: ParticleFieldMode) {
  const [auto, setAuto] = useState<"dark" | "light">(readAutoMode);

  useEffect(() => {
    if (requested !== "auto" || typeof document === "undefined") return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setAuto(readAutoMode());
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-scheme", "data-theme"],
    });
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, [requested]);

  return requested === "auto" ? auto : requested;
}

function makeNode(w: number, h: number): Node {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vy: Math.random() * 0.4 + 0.1,
    ch: randChar(),
  };
}

function makeBeam(w: number, h: number, length: number): Beam {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    len: (Math.random() * 100 + 50) * length,
    speed: Math.random() * 6 + 3,
    op: Math.random() * 0.5 + 0.3,
  };
}

export default function ParticleField({
  mode = "dark",
  speed = 1,
  density = 1,
  length = 1,
  strokeWidth = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  interactive = true,
  className,
  style,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedMode = useResolvedMode(mode);

  const safeSpeed = clamp(speed, 0, 3);
  const safeDensity = clamp(density, 0.25, 2.5);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeStroke = clamp(strokeWidth, 0.25, 8);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeHue = clamp(hue, -180, 180);
  const safeSat = clamp(saturation, 0, 2);
  const safeBright = clamp(brightness, 0.35, 1.65);

  // Os botões vivem num ref para o laço ler o valor atual sem se reinscrever —
  // mexer na velocidade não reinicia a simulação.
  const knobs = useRef<Knobs>({
    mode: resolvedMode,
    speed: safeSpeed,
    density: safeDensity,
    length: safeLength,
    strokeWidth: safeStroke,
    interactive,
  });
  knobs.current = {
    mode: resolvedMode,
    speed: safeSpeed,
    density: safeDensity,
    length: safeLength,
    strokeWidth: safeStroke,
    interactive,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let beams: Beam[] = [];
    const mouse = { x: -1e4, y: -1e4 };

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function measure() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      // setTransform, não scale: scale acumularia a cada resize.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /** Cresce ou encurta as populações conforme a densidade, sem recomeçar. */
    function fit() {
      const wantNodes = Math.max(12, Math.round(90 * knobs.current.density));
      const wantBeams = Math.max(4, Math.round(25 * knobs.current.density));
      while (nodes.length < wantNodes) nodes.push(makeNode(w, h));
      if (nodes.length > wantNodes) nodes.length = wantNodes;
      while (beams.length < wantBeams)
        beams.push(makeBeam(w, h, knobs.current.length));
      if (beams.length > wantBeams) beams.length = wantBeams;
    }

    function seed() {
      nodes = [];
      beams = [];
      fit();
    }

    function draw(dt: number) {
      const k = knobs.current;
      const pal = PALETTE[k.mode];
      const link = LINK_BASE * k.length;
      const step = dt * k.speed;

      ctx!.clearRect(0, 0, w, h);

      // 1. feixes subindo
      ctx!.lineWidth = 1.5 * k.strokeWidth;
      for (const b of beams) {
        b.y -= b.speed * step;
        if (b.y + b.len < 0) {
          b.y = h + 100;
          b.x = Math.random() * w;
        }
        const g = ctx!.createLinearGradient(b.x, b.y, b.x, b.y + b.len);
        g.addColorStop(0, `rgba(${pal.accentRgb}, ${b.op})`);
        g.addColorStop(1, "transparent");
        ctx!.strokeStyle = g;
        ctx!.beginPath();
        ctx!.moveTo(b.x, b.y);
        ctx!.lineTo(b.x, b.y + b.len);
        ctx!.stroke();
      }

      ctx!.font = "12px monospace";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.lineWidth = 0.5;

      // 2. malha de proximidade.
      // Ordenar por x deixa o laço interno sair cedo: como está crescente, o
      // primeiro dx maior que o alcance garante que nenhum vizinho seguinte
      // entra. Mesmo resultado, uma fração dos pares.
      nodes.sort((a, b) => a.x - b.x);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = b.x - a.x;
          if (dx > link) break;
          const d = Math.hypot(dx, a.y - b.y);
          if (d < link) {
            ctx!.strokeStyle = `rgba(${pal.meshRgb}, ${
              pal.meshAlpha * (1 - d / link)
            })`;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // 3. nós
      for (const n of nodes) {
        n.y += n.vy * step;
        if (n.y > h + 20) {
          n.y = -20;
          n.x = Math.random() * w;
        }

        const near = k.interactive
          ? Math.hypot(mouse.x - n.x, mouse.y - n.y)
          : Infinity;
        const hot = near < MOUSE_REACH;

        if (hot || Math.random() > 0.98) n.ch = randChar();

        if (hot) {
          ctx!.strokeStyle = `rgba(${pal.accentRgb}, ${
            0.5 * (1 - near / MOUSE_REACH)
          })`;
          ctx!.beginPath();
          ctx!.moveTo(n.x, n.y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.stroke();
        }

        ctx!.fillStyle = hot ? pal.accent : pal.idle;
        ctx!.fillText(n.ch, n.x, n.y);
      }
    }

    measure();
    seed();

    let raf = 0;
    let last = performance.now();

    function loop(now: number) {
      // 64 ms de teto: uma aba que volta do fundo não deve dar um salto.
      const dt = Math.min(64, now - last) / (1000 / 60);
      last = now;
      fit();
      draw(dt);
      raf = requestAnimationFrame(loop);
    }

    if (still) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onMove = (e: PointerEvent) => {
      // Escutamos na janela, não no canvas: assim o canvas pode ser
      // pointer-events:none e a UI por cima continua clicável.
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -1e4;
      mouse.y = -1e4;
    };
    const onVisibility = () => {
      if (still) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      measure();
      if (still) draw(0);
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [interactive]);

  const filter =
    safeHue === 0 && safeSat === 1 && safeBright === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSat}) brightness(${safeBright})`;

  return (
    <canvas
      ref={canvasRef}
      data-canivete-field=""
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%", opacity: safeOpacity, filter, ...style }}
    />
  );
}
