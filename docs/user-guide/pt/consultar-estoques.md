# Consultar estoques

Esta página explica como percorrer seu estoque de café: escolher um país e armazém,
ler a lista FIFO de lotes e abrir um lote.

## 1. Escolher um país e um armazém

Use o filtro de país no topo da aplicação para escolher **Brasil**, **Equador** ou
**Colômbia**. Você pode então restringir a um único **armazém** dentro desse país. A
tela **Armazéns** mostra cada armazém do país selecionado com sua última temperatura
e umidade medidas, para que você veja num relance quais locais estão saudáveis e
quais estão desviando.

## 2. Ler a lista FIFO de lotes

Abra a tela **Lotes** para ver todos os lotes de café. Os lotes são sempre
ordenados por **FIFO — First In, First Out** (primeiro a entrar, primeiro a sair),
o que significa que o **lote mais antigo em armazenamento aparece primeiro**. Essa é
a ordem em que o café normalmente deve deixar o armazém, então o topo da lista é o
que precisa da sua atenção primeiro.

Para cada lote, a lista mostra:

- um identificador do lote;
- o armazém e o país onde ele está armazenado;
- a **data de armazenamento** e há quantos **dias** ele está em estoque;
- um indicador de **status** (veja abaixo).

### Entender o status do lote

| Status | Significado |
|---|---|
| **OK / saudável** | As condições estão dentro da faixa ideal e o lote não está antigo demais. |
| **Fora da faixa** | A temperatura ou a umidade está fora da faixa de tolerância do país. |
| **Antigo demais** | O lote está armazenado há mais de 365 dias. |

Você pode filtrar a lista por país, por armazém e por status para focar, por
exemplo, apenas nos lotes que precisam de ação.

## 3. Abrir um lote

Clique em um lote da lista para abrir sua **página de detalhes**. Lá você
encontrará:

- as informações-chave do lote (armazém, país, data de armazenamento, idade);
- suas **curvas de temperatura e umidade** ao longo do tempo;
- a faixa ideal do país, desenhada no gráfico.

A leitura dessas curvas é abordada em [Ler os gráficos](ler-graficos.md).

## Próximos passos

- Entenda as curvas em [Ler os gráficos](ler-graficos.md).
- Reaja a problemas em [Entender os alertas](alertas.md).
