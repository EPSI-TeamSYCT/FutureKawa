# 🔄 Gestão da mudança — supervisionar o café verde em três países

> 🌐 **Idiomas:** [English](../en/change-management.md) · [Français](../fr/conduite-du-changement.md) · **Português** · [Español](../es/gestion-del-cambio.md)

Este plano descreve como a FutureKawa passa de um acompanhamento de armazenagem
**semimanual e difícil de auditar** para uma **plataforma supervisionada e
multinacional** — e, acima de tudo, **como as equipes de campo a adotam**. Toda a
abordagem se baseia num princípio: a mudança acontece **no local e no idioma local**
(🇧🇷 português no Brasil, 🇪🇨🇨🇴 espanhol no Equador e na Colômbia), nunca como uma
ordem enviada à distância pela sede.

Este documento complementa o [guia do usuário](../../user-guide/pt/index.md) (como usar
o aplicativo) e o [esquema de automação da fase 2](../../phase2/automation-schema.md)
(para onde essa mudança se dirige).

## Índice

- [🎯 Contexto & objetivo da mudança](#-contexto--objetivo-da-mudança)
- [👥 Partes interessadas & impacto](#-partes-interessadas--impacto)
- [🧭 Abordagem de adoção — os três pilares](#-abordagem-de-adoção--os-três-pilares)
- [🗺️ Implantação por fases](#-implantação-por-fases)
- [🎓 Plano de treinamento](#-plano-de-treinamento)
- [📣 Plano de comunicação](#-plano-de-comunicação)
- [🧱 Gestão de resistências](#-gestão-de-resistências)
- [🛟 Modelo de suporte](#-modelo-de-suporte)
- [📊 Indicadores de sucesso (KPIs)](#-indicadores-de-sucesso-kpis)
- [🔮 Ligação com a fase 2](#-ligação-com-a-fase-2)
- [🔗 Documentos relacionados](#-documentos-relacionados)

## 🎯 Contexto & objetivo da mudança

Hoje, as condições de armazenagem do café verde são acompanhadas de forma
**semimanual**: leituras anotadas à mão ou em planilhas dispersas, rotação **FIFO**
aplicada de memória e nenhuma trilha de auditoria confiável quando um cliente pede
**prova de rastreabilidade**. Quando a temperatura ou a umidade desvia, ninguém
percebe antes que os grãos já tenham perdido aroma ou sido rebaixados — a perda é
constatada **depois** do dano.

A mudança introduz uma **plataforma supervisionada** única: os sensores publicam
temperatura/umidade automaticamente, os lotes são acompanhados do mais antigo ao mais
recente, os **alertas** disparam assim que as condições saem da faixa ideal, e a sede
consolida os três países numa visão única — mantendo **cada país dono dos seus dados**
(soberania).

| | Antes — semimanual | Depois — plataforma supervisionada |
|---|---|---|
| 🌡️ Condições | Lidas à mão, de forma intermitente | Medidas automaticamente, de forma contínua |
| 🔁 Rotação FIFO | De memória, sujeita a erros | Lista do mais antigo, sempre visível |
| 🚨 Desvio | Notado após o dano | Alerta no instante em que ocorre |
| 🧾 Rastreabilidade | Difícil de reconstituir | Histórico registrado por lote |
| 🌍 Visão multinacional | Nenhuma | Consolidada na sede, dados ficam locais |

> 💡 **Por que isso importa para as equipes de campo.** Não se trata de "mais telas para
> preencher". Elimina a anotação manual, substitui o achismo na rotação por uma lista
> clara e faz com que um gerente de armazém seja **avisado a tempo** de salvar um lote,
> em vez de explicar uma perda depois. O objetivo da gestão da mudança é **fazer sentir**
> esse benefício, não apenas anunciá-lo.

> 📸 **[SCREENSHOT]** — Painel da sede, Brasil selecionado, armazém wh-01 aberto, um lote
> EM ALERTA com sua curva de temperatura/umidade saindo da faixa verde.

## 👥 Partes interessadas & impacto

Todas as pessoas afetadas pela plataforma, o que muda para elas e o benefício concreto
que conquista a adesão. Os níveis de suporte **N1** (correspondente de TI local) e **N2**
(infra/DevOps) estão descritos no [modelo de suporte](#-modelo-de-suporte).

| Função | 🔧 Impacto (o que muda) | 🎁 Benefício (o que ganham) |
|---|---|---|
| 🏭 **Gerente de exploração (fazenda)** | Recebe alertas de armazenagem por e-mail; age sobre desvio e idade dos lotes. | Menos perdas; reage a tempo em vez de explicar danos. |
| 📦 **Gerente de armazém** | Usa a lista FIFO de lotes e as curvas no dia a dia, em vez de anotações manuais. | Ordem de rotação clara; condições visíveis de relance. |
| 🔬 **Gerente de qualidade** | Consulta o histórico registrado para certificar as condições de um lote. | Prova real de rastreabilidade para clientes e auditorias. |
| 🚚 **Gerente de supply-chain** | Planeja embarques sobre dados de estoque consolidados e confiáveis. | Menos surpresas; embarca primeiro os lotes certos. |
| 🏢 **Supervisor na sede** | Ganha uma visão multinacional única e consolidada. | Conduz três países a partir de um painel; identifica tendências. |
| 🧑‍💻 **Correspondente de TI local (N1)** | Torna-se o primeiro ponto de contato e o elo no local. | Papel local reconhecido; linha direta com o N2. |
| ⚙️ **Infra / DevOps (N2)** | Opera e monitora as stacks por país e da sede. | Implantações reproduzíveis; uma stack por país, guiada por variáveis. |

> 📸 **[SCREENSHOT]** — E-mail de alerta recebido pelo gerente de exploração: armazém,
> identificador do lote, valor de temperatura/umidade fora da faixa, data/hora.

## 🧭 Abordagem de adoção — os três pilares

A adoção apoia-se nos três pilares da MSPR. Nenhum funciona sozinho: a **participação**
gera confiança, a **comunicação** mantém todos informados, o **treinamento** constrói a
competência — tudo entregue **no local, no idioma local**.

| Pilar | O que significa aqui | Como entregamos |
|---|---|---|
| 🤝 **Participação** | As equipes de campo moldam a implantação, não apenas a recebem. | Oficinas no local por país; usuários-chave locais escolhidos cedo; os retornos guiam as correções. |
| 📣 **Comunicação** | Todos sabem o porquê, o quando e onde buscar ajuda. | Lançamento no idioma local, atualizações regulares, um laço de feedback bidirecional (veja abaixo). |
| 🎓 **Treinamento** | Cada função sabe fazer seu trabalho diário na ferramenta, com confiança. | Sessões por função, práticas, **no local e em PT / ES**; formação de multiplicadores. |

> 💡 Os três pilares são **repetidos no idioma local em cada país**, por um instrutor
> local sempre que possível. Uma mensagem que chega em português num armazém brasileiro
> vale mais do que um material perfeito em inglês.

## 🗺️ Implantação por fases

Nós **não** ligamos os três países de uma vez. Fazemos um **piloto em um país**,
provamos o valor e depois **generalizamos** para os outros dois — levando os
aprendizados adiante.

| Fase | Escopo | Foco | Saída → fase seguinte |
|---|---|---|---|
| 0️⃣ **Preparar** | Sede + país piloto | Stacks implantadas, usuários-chave nomeados, materiais traduzidos. | Ambiente pronto, instrutores prontos. |
| 1️⃣ **Pilotar** | 🇧🇷 Brasil (1–2 armazéns) | Uso real em lotes reais; coleta de atritos; ajuste de limiares/alertas. | **Go/no-go** atingido (abaixo). |
| 2️⃣ **Generalizar** | 🇪🇨 Equador + 🇨🇴 Colômbia | Repetir o roteiro comprovado, em ES, no local. | Mesmo go/no-go por país. |
| 3️⃣ **Operar & melhorar** | Os 3 países | Suporte de regime, revisão de KPIs, preparação da fase 2. | KPIs estáveis; entrevista da fase 2 iniciada. |

O Brasil é o piloto natural: maior operação e referência para os limiares de
armazenagem. Adicionar um país é **repetir a mesma stack**, configurada apenas por
variáveis de ambiente — veja [executar a stack](../../deployment/running-the-stack.md).

### ✅ Critérios go / no-go

Antes de generalizar além do piloto, **todos** estes critérios devem ser cumpridos:

| Critério | 🎯 Meta |
|---|---|
| 📈 Adoção | Os usuários-chave acessam e usam a lista FIFO **todos os dias** por 2 semanas. |
| 🚨 Alertas confiáveis | Os alertas geram ação, e os **falsos alertas** ficam abaixo de uma taxa baixa acordada. |
| 📥 Completude dos dados | Chegam medições de cada armazém piloto, com poucas lacunas. |
| 🧑‍🏫 Capacidade local | Ao menos **um instrutor local formado** por site piloto. |
| 😀 Satisfação | Os usuários piloto relatam que a ferramenta **economiza tempo** vs. o modo manual. |

> ⚠️ Um **no-go** não é um fracasso: ele pausa a generalização até que o critério
> bloqueador seja corrigido (ex.: falsos alertas em excesso → reajustar as tolerâncias
> antes da implantação).

## 🎓 Plano de treinamento

O treinamento é **no local e no idioma local** — é o coração do plano. Nenhuma função é
treinada por um webinar genérico em inglês; um instrutor está **no armazém**, falando
**português no Brasil** e **espanhol no Equador e na Colômbia**.

### Sessões por função

| Função | Idioma | Formato | Cobre |
|---|---|---|---|
| 🏭 Gerente de exploração | PT / ES | No local, ~½ dia | Ler alertas, agir sobre desvio & idade dos lotes, escalonamento. |
| 📦 Gerente de armazém | PT / ES | No local, prático | Lista FIFO, abrir um lote, ler as curvas no dia a dia. |
| 🔬 Gerente de qualidade | PT / ES | No local, ~½ dia | Histórico & rastreabilidade, exportar prova para clientes. |
| 🚚 Gerente de supply-chain | PT / ES | No local / remoto | Visão de estoque consolidada, planejar sobre dados confiáveis. |
| 🏢 Supervisor na sede | EN / local | Remoto + no local | Painel multinacional, tendências entre países. |
| 🧑‍💻 Correspondente N1 | Local | Aprofundado, no local | Tudo acima + solução de problemas de 1ª linha + quando escalar ao N2. |

### Materiais & formação de multiplicadores

| Item | Idioma | Notas |
|---|---|---|
| 🧑‍🏫 **Formação de multiplicadores** | PT / ES | A sede treina primeiro os instrutores locais; eles ensinam depois no país. |
| 📘 **Guia de início rápido** | PT / ES | Curto, guiado por capturas; espelha o [guia do usuário](../../user-guide/pt/index.md). |
| 🎬 **Tutoriais gravados em tela** | PT / ES | Lista FIFO, leitura de uma curva, reação a um alerta. |
| 🃏 **Folha de referência de uma página** | PT / ES | Fixada no armazém; limiares + "o que fazer em um alerta". |
| ❓ **FAQ** | PT / ES | Espelho local da [FAQ](../../user-guide/pt/perguntas-frequentes.md) do guia. |

> 💡 A **formação de multiplicadores** é o que permite escalar o treinamento no local e
> no idioma local para os três países: a sede forma um punhado de instrutores locais, e
> **são eles** que conduzem as sessões no armazém em PT / ES — o conhecimento fica local,
> e o suporte também.

> 📸 **[SCREENSHOT]** — Página de capa do guia de início rápido, localizado em português,
> mostrando a lista FIFO de lotes de um armazém brasileiro.

## 📣 Plano de comunicação

Claro, repetido, **bidirecional** e sempre disponível no idioma local.

| Canal | Público | Cadência | Objetivo |
|---|---|---|---|
| 🚀 **Reunião de lançamento (no local)** | Todas as funções por país | Uma vez, no início da fase | Explicar o porquê, o plano e a quem pedir ajuda. |
| 🗞️ **Atualização de progresso** | Todas as partes interessadas | Semanal durante a implantação | O que foi entregue, o que vem, vitórias do piloto. |
| 🧑‍🤝‍🧑 **Check-in local** | Armazém + N1 | Diário durante o piloto | Trazer atritos rápido; nada espera uma semana. |
| 📧 **E-mails de alerta** | Gerentes de exploração | Por evento | O próprio sinal operacional (desvio / idade do lote). |
| 🗣️ **Canal de feedback** | Todos | Sempre aberto | Coletar problemas & ideias; fechar o ciclo. |

### 🔑 Mensagens-chave

- **"Salva seus lotes."** A plataforma avisa **a tempo** de agir, não depois.
- **"Seus dados ficam no seu país."** A sede consolida uma visão; nunca leva seu banco.
- **"Substitui as anotações manuais"**, não adiciona papelada por cima.
- **"A ajuda é local."** Seu primeiro contato é o correspondente N1 no local.

### 🔁 Laço de feedback

Cada objeção, bug ou ideia vai ao **correspondente N1** local, é triada com o **N2** se
for técnica, e o resultado é **devolvido** à pessoa que a levantou. Um acompanhamento
visível é o que transforma comunicação em confiança.

## 🧱 Gestão de resistências

As objeções são esperadas e legítimas. Nós as nomeamos e as respondemos **antes** que se
enrijeçam — no idioma local, no local.

| 🗣️ Objeção esperada | ✅ Como respondemos |
|---|---|
| "O jeito manual funcionava bem." | Mostrar lado a lado: um alerta que pega um desvio que o manual teria perdido. |
| "É trabalho a mais além do meu." | Demonstrar que **elimina** as anotações manuais; o gesto diário é um olhar, não digitação. |
| "Alertas demais/falsos, vou ignorar." | Ajustar as tolerâncias no piloto; uma baixa taxa de falsos alertas é critério **go/no-go**. |
| "Não confio nos números do sensor." | Conferir as leituras no local durante o treinamento; explicar a faixa ideal & a tolerância. |
| "Em inglês eu não entendo tudo." | **Tudo** é entregue em PT / ES, no local, por um instrutor local. |
| "A sede está nos vigiando / pegando nossos dados?" | Explicar a soberania: o país é dono do seu banco; a sede só consulta uma visão consolidada. |
| "A quem eu ligo quando quebra?" | Um correspondente **N1 local** nomeado, com o N2 atrás — impresso na folha de referência. |

> 💡 O antídoto mais forte à resistência é um **campeão local**: um colega de armazém
> respeitado, treinado primeiro, que responde no idioma local e prova a ferramenta nos
> próprios lotes da equipe.

## 🛟 Modelo de suporte

Dois níveis, alinhados ao contexto do cliente — **o local primeiro**, a infra atrás.

| Nível | Quem | Escopo | Recorre a |
|---|---|---|---|
| 🧑‍💻 **N1 — correspondente de TI local** | No local, por país, fala o idioma local | Primeiro contato: dúvidas de uso, "esse alerta é real?", verificações básicas, triagem. | Escala problemas de infra/plataforma ao N2. |
| ⚙️ **N2 — infra / DevOps** | Central, entre países | Plataforma: stacks, broker, APIs, implantações, incidentes, fluxo de dados. | Dono do [sistema distribuído](../../architecture/distributed-system.md) & das implantações. |

```
Usuário de campo ──▶ N1 (local, no local, PT/ES) ──▶ N2 (infra / DevOps, central)
   ▲                       │                              │
   └──────— resposta ◀──────┴──— correção da plataforma ◀──┘
```

> 💡 A maioria das dúvidas do dia a dia são dúvidas de **uso** e param no **N1** — no
> idioma local, no local. Só falhas reais de plataforma sobem ao N2. Assim o suporte
> continua rápido, local e compreensível.

## 📊 Indicadores de sucesso (KPIs)

Como sabemos que a mudança realmente pegou — revisados por país e na sede.

| KPI | 📐 O que mede | 🎯 Direção |
|---|---|---|
| 📈 **Taxa de adoção** | Usuários ativos vs. esperados, e uso diário da lista FIFO. | ⬆️ Rumo a um uso estável, quase total. |
| ⏱️ **Tempo de resposta ao alerta** | Tempo do alerta disparado → ação tomada. | ⬇️ Para baixo — reagir antes do dano. |
| 📉 **Redução de perdas** | Lotes rebaixados/perdidos vs. a base manual. | ⬇️ Para baixo — o ganho central do negócio. |
| 📥 **Completude dos dados** | Parte das medições esperadas efetivamente recebidas. | ⬆️ Para cima — poucas lacunas por armazém. |
| 😀 **Satisfação dos usuários** | As equipes de campo relatam tempo economizado & confiança nos alertas. | ⬆️ Para cima — adesão duradoura. |
| 🧑‍🏫 **Autonomia local** | Dúvidas resolvidas no N1 sem escalar. | ⬆️ Para cima — o suporte local funciona. |

> 💡 Os KPIs são revisados **com** as equipes locais, no idioma delas — a revisão é, ela
> mesma, um momento de comunicação e participação, não uma auditoria.

> 📸 **[SCREENSHOT]** — Área de KPIs/visão geral do painel da sede: estoque por país e
> número de alertas ativos lado a lado para Brasil, Equador e Colômbia.

## 🔮 Ligação com a fase 2

A fase 1 faz as pessoas **confiarem na supervisão**: elas aprendem a se apoiar nos
alertas, a agir sobre o desvio e a ler as curvas. A fase 2 **fecha o ciclo** — as mesmas
medições acionam **atuadores** (aquecimento, aeração, umidificação) que mantêm cada
armazém na sua faixa ideal **automaticamente** (veja o
[esquema de automação](../../phase2/automation-schema.md)).

Essa automação só ganha aceitação se a **fase humana vier primeiro**:

| Hábito de mudança (fase 1) | Prepara a aceitação na fase 2 de… |
|---|---|
| Confiar nos alertas & na faixa ideal | Confiar no controlador que age na mesma faixa. |
| Reagir ao desvio à mão | Deixar os atuadores reagirem, com um **controle manual** mantido. |
| Consultar o histórico registrado | Revisar a trilha de auditoria dos comandos automáticos. |
| Suporte N1 local + N2 central | Os mesmos níveis de suporte operando a malha de controle. |

> 💡 Uma equipe que já confia nos alertas aceitará um atuador que age sobre esses mesmos
> alertas. A gestão da mudança na fase 1 é o que torna a automação da fase 2
> **bem-vinda** em vez de imposta. As decisões em aberto estão reunidas no
> [questionário de entrevista](../../phase2/interview-questionnaire.md).

## 🔗 Documentos relacionados

- [Guia do usuário](../../user-guide/pt/index.md) — como as equipes de campo usam o app no dia a dia.
- [Fase 2 — esquema de automação](../../phase2/automation-schema.md) — para onde vai essa mudança.
- [Fase 2 — questionário de entrevista](../../phase2/interview-questionnaire.md) — decisões ainda em aberto.
- [Sistema distribuído](../../architecture/distributed-system.md) — a topologia multinacional soberana.
- [Executar a stack](../../deployment/running-the-stack.md) — implantar uma stack por país.
