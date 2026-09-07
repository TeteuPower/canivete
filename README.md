# Canivete

Cinco ferramentas de PC num cabo só: um instalador, um ícone na bandeja, um login, um
atualizador. Cada ferramenta é uma **lâmina** — e só uma abre de cada vez, que é o que
mantém isso leve.

> **Estado:** partida do zero em React + Tailwind, construindo de baixo para cima.
> O que existe hoje é o **campo de fundo** e a bancada para calibrá-lo.

## Rodar

```powershell
npm install
npm run dev      # http://localhost:5273
npm run build    # tsc -b && vite build
```

## Stack

| Camada | Escolha |
|---|---|
| Build | Vite 7 |
| UI | React 19 + TypeScript (strict) |
| Estilo | Tailwind CSS 4 (`@theme`, sem `tailwind.config.js`) |
| Estrutura | convenção shadcn — `components.json`, `@/*` → `src/*`, primitivos em `src/components/ui/` |

## O campo de fundo

Duas implementações do mesmo efeito, alternáveis na bancada:

### `src/components/ui/particle-drift.tsx`

O componente do [21st.dev](https://21st.dev/), **verbatim**. Fica como referência do que
foi escolhido. Ele não é um componente de canvas: é um `<iframe sandbox srcDoc>` que
embute um documento HTML inteiro — uma hero section com Playfair Display, botão e card
glassmorphism — carrega **Tailwind CDN, GSAP, GSAP/ScrollTrigger e Iconify**, e então
injeta CSS e JS que escondem tudo menos o `<canvas>`.

### `src/components/ui/particle-field.tsx`

O port nativo, e o que a casca usa. Mesmo desenho — 90 nós ASCII à deriva, malha de
proximidade em 120 px, 25 feixes subindo, reação ao cursor em 180 px — resolvendo cinco
coisas que o original não resolve:

1. **Funciona offline.** Num app desktop em WebView2 não há garantia de rede, e sem os
   scripts de CDN o original não desenha nada.
2. **Mouse *e* UI.** O `pointermove` é escutado na janela hospedeira e projetado no
   retângulo do canvas, então o canvas pode ser `pointer-events: none` e a reação
   acontece atrás de qualquer interface. No original, ou o iframe recebe o mouse ou a
   UI recebe o clique.
3. **Independente da taxa de quadros.** O original avança por quadro (`y += vy`), então
   num monitor de 144 Hz o campo corre 2,4× mais rápido. Aqui o passo é normalizado.
4. **Sem escala composta.** O original chama `ctx.scale(dpr, dpr)` a cada resize e a
   transformação acumula; aqui é `setTransform`.
5. **Respeita `prefers-reduced-motion`** e pausa com a aba escondida.

A malha é O(n²) por natureza. Os nós são ordenados por `x` a cada quadro, o que deixa o
laço interno sair no primeiro vizinho fora de alcance — mesmo resultado, uma fração dos
pares. Em densidade 2,5 são 225 nós.

Os botões (`speed`, `density`, `length`, `strokeWidth`, `opacity`, `hue`) vivem num
`ref`, então mexer na velocidade não reinicia a simulação. `hue` é filtro CSS: gira o
azul `#60A5FA` para outra cor sem tocar no canvas — perto de −150° ele chega no vermelho
anodizado.

## As cinco lâminas

| Lâmina / vigia | Vem de | O que faz |
|---|---|---|
| **Conversor** | conversor | Converte arquivos na sua máquina, dez famílias de formato. Nada sai daqui. |
| **Limpador** | Limpador | Mapa real do disco (tamanho *em disco*, hardlinks contados uma vez) e da memória. |
| **Copiloto Dota 2** | dota2 | Assistente de draft, painel ao vivo por GSI, overlay do minimapa. |
| **Consumo & sensores** | claude-indicator | Consumo da assinatura Claude + CPU/GPU/memória, na bandeja e na barra. |
| **Acesso Remoto** | AcessoRemoto | Ver e controlar este PC do celular, ponta a ponta, sem terceiros. |

## A organização mental

Duas categorias, não cinco itens numa grade:

- **Lâminas** — você abre, usa e fecha. Uma de cada vez. *Conversor, Limpador, Copiloto.*
- **Vigias** — ficam ligadas, minúsculas, e nunca abrem janela para trabalhar. *Consumo
  & sensores, Acesso Remoto.*

A divisão é honesta porque é a mesma do consumo de memória: **o modelo mental e o modelo
de recurso são um só.**

## Por que juntar

| | Hoje, 5 apps | Canivete |
|---|---|---|
| Processos residentes | 5 | 1 |
| Ícones na bandeja | 5 | 1 |
| Verificadores de atualização | 5 | 1 |
| Logins do Claude | 3 | 1 |
| Entradas de inicialização | 5 | 1 |
| Instaladores (soma) | ~1,1 GB | ~118 MB |

## Próximos passos

1. Fechar o campo de fundo (motor, cor, densidade).
2. Tipografia e paleta da casca, em cima da cor que o campo definir.
3. O cabo e as lâminas: a navegação.
4. Contrato casca ↔ lâmina (ciclo de vida, eventos, progresso, staging).
5. Portar a primeira lâmina — o **Conversor**, que está em construção.
