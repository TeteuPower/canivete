# Canivete

Cinco ferramentas de PC num cabo só: um instalador, um ícone na bandeja, um login, um
atualizador. Cada ferramenta é uma **lâmina** — e só uma abre de cada vez, que é o que
mantém isso leve.

> **Estado: mock.** Não há código de aplicação ainda. O que existe é a interface idealizada,
> em [`mock/canivete.html`](mock/canivete.html), para decidir a UX antes de escrever a casca.

## As cinco

| Lâmina / vigia | Vem de | O que faz |
|---|---|---|
| **Conversor** | [conversor](https://github.com/TeteuPower) | Converte arquivos na sua máquina, dez famílias de formato. Nada sai daqui. |
| **Limpador** | Limpador | Mapa real do disco (tamanho *em disco*, hardlinks contados uma vez) e da memória. |
| **Copiloto Dota 2** | dota2 | Assistente de draft, painel ao vivo por GSI, overlay do minimapa. |
| **Consumo & sensores** | claude-indicator | Consumo da assinatura Claude + CPU/GPU/memória, na bandeja e na barra de tarefas. |
| **Acesso Remoto** | AcessoRemoto | Ver e controlar este PC do celular, ponta a ponta, sem terceiros. |

## A organização mental

Duas categorias, não cinco itens numa grade:

- **Lâminas** — você abre, usa e fecha. Uma de cada vez. *Conversor, Limpador, Copiloto.*
- **Vigias** — ficam ligadas, minúsculas, e nunca abrem janela para trabalhar; vivem no ícone,
  no painel da barra e no gadget. *Consumo & sensores, Acesso Remoto.*

A divisão é honesta porque é a mesma do consumo de memória: **o modelo mental e o modelo de
recurso são um só.** O rodapé do trilho mostra o peso em repouso, e Configurações deixa você
escolher o que fica ligado, com o custo em MB de cada escolha à vista.

## Por que juntar

O que as cinco repetem hoje é o peso de verdade — não os módulos:

| | Hoje, 5 apps | Canivete |
|---|---|---|
| Processos residentes | 5 | 1 |
| Ícones na bandeja | 5 | 1 |
| Verificadores de atualização | 5 | 1 |
| Logins do Claude | 3 | 1 |
| Entradas de inicialização | 5 | 1 |
| Instaladores (soma) | ~1,1 GB | ~118 MB |

## Por que fica leve

- Uma **casca** pequena que só supervisiona: bandeja, painel, atualizador, login, ciclo de vida
  das lâminas.
- Interface em **WebView2**, que já vem no Windows, em vez de um Electron empacotado por app.
- Um **runtime .NET** compartilhado entre as lâminas que são .NET.
- **Python só na lâmina do Dota**, e só enquanto o jogo está aberto.
- Lâmina sob demanda sobe ao ser usada e desce sozinha depois de ociosa.

## O mock

Abra [`mock/canivete.html`](mock/canivete.html) com dois cliques — arquivo único, sem
dependências. Ele tem as sete telas (Painel, Conversor, Limpador, Copiloto, Consumo,
Acesso Remoto, Configurações), a bandeja e o instalador único com escolha de lâminas.

Os números são plausíveis, não medidos — exceto os do Limpador, que vêm das medições reais
daquele projeto.

## Próximos passos

1. Fechar a UX no mock.
2. Definir o contrato casca ↔ lâmina (ciclo de vida, eventos, progresso, staging).
3. Escrever a casca e portar a primeira lâmina — o **Conversor**, que está em construção.
