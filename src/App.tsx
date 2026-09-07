import { useState } from "react";
import ParticleField from "@/components/ui/particle-field";
import ParticleDrift from "@/components/ui/particle-drift";
import { cn } from "@/lib/utils";

type Engine = "nativo" | "iframe";
type Mode = "dark" | "light";

function Knob({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
        {label}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-ink">
        {value.toFixed(step < 1 ? 2 : 0)}
        {unit ? <span className="text-ink-4">{unit}</span> : null}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="col-span-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-drift
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-drift
                   [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(96,165,250,0.7)]"
      />
    </label>
  );
}

function Switch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-sm border border-white/10 bg-black/40">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            "cursor-pointer border-0 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors",
            value === o.id
              ? "bg-drift text-abyss"
              : "bg-transparent text-ink-3 hover:bg-white/5 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [engine, setEngine] = useState<Engine>("nativo");
  const [mode, setMode] = useState<Mode>("dark");
  const [speed, setSpeed] = useState(1);
  const [density, setDensity] = useState(1);
  const [length, setLength] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [hue, setHue] = useState(0);

  const nodes = Math.max(12, Math.round(90 * density));
  const beams = Math.max(4, Math.round(25 * density));
  const ground = mode === "light" ? "#eef1f6" : "#030509";

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden transition-colors duration-500"
      style={{ backgroundColor: ground }}
    >
      {/* ---------- o campo, atrás de tudo ---------- */}
      <div className="fixed inset-0 z-0">
        {engine === "nativo" ? (
          <ParticleField
            mode={mode}
            speed={speed}
            density={density}
            length={length}
            strokeWidth={strokeWidth}
            opacity={opacity}
            hue={hue}
          />
        ) : (
          <ParticleDrift
            mode={mode}
            speed={speed}
            density={density}
            length={length}
            strokeWidth={strokeWidth}
            opacity={opacity}
            hue={hue}
          />
        )}
      </div>

      {/* ---------- conteúdo ---------- */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-between gap-10 p-6 md:p-10">
        <header className="pointer-events-none">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6.2 12.6C6.2 8.1 10.6 3.8 16.6 2.05c.86-.25 1.4.72.85 1.42-2.9 3.7-4.3 6.3-4.85 9.13z"
                fill="currentColor"
                className="text-ink-3"
              />
              <path
                d="M3.4 13.4h12.9a4.6 4.6 0 0 1 0 9.2H5.4a2 2 0 0 1-2-2z"
                fill="currentColor"
                className="text-drift"
              />
            </svg>
            <span
              className={cn(
                "font-mono text-[9px] uppercase tracking-[0.24em]",
                mode === "light" ? "text-slate-500" : "text-ink-3",
              )}
            >
              Canivete · campo de fundo
            </span>
          </div>
          <h1
            className={cn(
              "mt-5 max-w-[26ch] text-4xl leading-[0.95] font-light tracking-tight text-balance md:text-6xl",
              mode === "light" ? "text-slate-900" : "text-ink",
            )}
          >
            Cinco ferramentas.
            <br />
            Um <span className="text-drift">cabo</span>.
          </h1>
          <p
            className={cn(
              "mt-5 max-w-[52ch] text-sm leading-relaxed font-light md:text-base",
              mode === "light" ? "text-slate-600" : "text-ink-2",
            )}
          >
            Partida do zero em React + Tailwind, começando pelo fundo. Mexa o
            mouse: os nós reagem ao cursor <em>por baixo</em> desta interface —
            e os controles abaixo continuam clicáveis.
          </p>
        </header>

        {/* ---------- bancada de controle ---------- */}
        <section
          className={cn(
            "w-full max-w-3xl rounded-lg border p-5 backdrop-blur-xl md:p-6",
            mode === "light"
              ? "border-slate-900/10 bg-white/60"
              : "border-white/10 bg-white/[0.035]",
          )}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                  Motor
                </div>
                <Switch
                  options={[
                    { id: "nativo", label: "port nativo" },
                    { id: "iframe", label: "iframe 21st" },
                  ]}
                  value={engine}
                  onChange={setEngine}
                />
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                  Modo
                </div>
                <Switch
                  options={[
                    { id: "dark", label: "escuro" },
                    { id: "light", label: "claro" },
                  ]}
                  value={mode}
                  onChange={setMode}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl tabular-nums text-drift">
                {nodes}
                <span className="text-sm text-ink-4"> nós</span>
              </div>
              <div className="font-mono text-[10px] tabular-nums text-ink-4">
                {beams} feixes · malha em {Math.round(120 * length)} px
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Knob label="Velocidade" value={speed} min={0} max={3} step={0.05} onChange={setSpeed} />
            <Knob label="Densidade" value={density} min={0.25} max={2.5} step={0.05} onChange={setDensity} />
            <Knob label="Alcance" value={length} min={0.35} max={2.5} step={0.05} onChange={setLength} />
            <Knob label="Espessura" value={strokeWidth} min={0.25} max={8} step={0.25} onChange={setStrokeWidth} />
            <Knob label="Opacidade" value={opacity} min={0.05} max={1} step={0.05} onChange={setOpacity} />
            <Knob label="Matiz" value={hue} min={-180} max={180} step={1} unit="°" onChange={setHue} />
          </div>

          <p
            className={cn(
              "mt-5 border-t pt-4 font-mono text-[10px] leading-relaxed",
              mode === "light"
                ? "border-slate-900/10 text-slate-500"
                : "border-white/10 text-ink-4",
            )}
          >
            {engine === "nativo" ? (
              <>
                Canvas nativo. Sem rede, sem GSAP, sem Tailwind CDN. O mouse é
                escutado na janela, então o canvas fica{" "}
                <span className="text-drift">pointer-events: none</span> e a
                reação acontece atrás de qualquer UI.
              </>
            ) : (
              <>
                O componente original: um <span className="text-warn">iframe</span>{" "}
                que baixa Tailwind, GSAP, ScrollTrigger e Iconify para depois
                esconder tudo menos o canvas. Repare que o campo{" "}
                <span className="text-warn">para de reagir</span> quando o cursor
                passa sobre este painel — e some de vez se o iframe receber
                pointer-events: none.
              </>
            )}
          </p>
          <p
            className={cn(
              "mt-3 font-mono text-[10px] leading-relaxed",
              mode === "light" ? "text-slate-500" : "text-ink-4",
            )}
          >
            Matiz gira o azul <span className="text-drift">#60A5FA</span> para
            outra cor sem tocar no canvas: em <span className="tabular-nums">−150°</span>{" "}
            ele chega perto do vermelho anodizado, se a identidade for por ali.
          </p>
        </section>
      </div>
    </div>
  );
}
