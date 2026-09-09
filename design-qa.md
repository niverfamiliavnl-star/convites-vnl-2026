# Design QA — Heitor Noah “Level Up da Fé”

## Fontes, implementação e normalização

- Verdade visual: `C:/Users/leona/Downloads/heitor_noah_level_up_da_fe_site_final_sem_compartilhar/site_heitor_noah_level_up_da_fe_final_sem_compartilhar/index.html`.
- Implementação: rota local `/noah/` deste projeto.
- Capturas da referência: `docs/evidence/noah-level-up/reference-{mobile-390x844,mobile-430x932,desktop-1440x900}-*.png`.
- Capturas da implementação: `docs/evidence/noah-level-up/implementation-{mobile-390x844,mobile-430x932,desktop-1440x900}-*.png`.
- Comparações na mesma imagem: `docs/evidence/noah-level-up/qa-comparison-mobile-390x844.png`, `qa-comparison-mobile-430x932.png` e `qa-comparison-desktop-1440x900.png`.
- Viewports CSS e pixels: 390×844, 430×932 e 1440×900; `deviceScaleFactor=1`, sem redimensionamento entre a referência e a implementação. Estados longos foram capturados em página inteira; os painéis comparativos usam o mesmo recorte superior por estado.
- Estados: abertura, identificação, Armadura de Deus, escolha do caminho, Barra da Fé e convite; o RSVP VNL também possui captura focada na implementação.

## Evidência comparativa

- A comparação integral confirma a mesma composição central, barra superior, progresso, paleta navy/ciano/lime/roxo, hierarquia de títulos, painéis de game, ordem e densidade das três fases.
- As comparações focadas de cada painel foram incluídas nos mesmos painéis lado a lado; não foi necessário recorte adicional porque títulos, controles, ícones, espaçamentos e textos permanecem legíveis nas imagens originais.
- A extensão do convite final é intencional: a referência abre Google Forms externamente, enquanto a implementação incorpora o RSVP VNL já homologado.

## Superfícies obrigatórias

- Tipografia: família sans-serif, peso alto, caixa alta, escala, entrelinha e brilho dos títulos reproduzem a hierarquia canônica nos três viewports; corpo e microtexto permanecem legíveis.
- Espaçamento e layout: frame desktop limitado a 590 px, duas colunas de equipamentos, painéis, raios, bordas e ritmo vertical equivalentes. Não há colisão nem scroll horizontal nos viewports verificados.
- Cores e tokens: navy, ciano, verde neon, lime, roxo, rosa e amarelo mantêm funções visuais equivalentes, com contraste e estados de acerto/erro coerentes.
- Imagens e assets: o HTML canônico não contém assets fotográficos ou arquivos próprios. Seus símbolos e elementos de interface foram preservados conforme a instrução desta tarefa; nenhum asset externo, imagem gerada ou item de Hannah/Vagner foi introduzido.
- Copy e conteúdo: abertura, identificação, seis itens, três rotas, versículos, Barra da Fé e convite seguem o conteúdo canônico; somente Google Forms foi substituído deliberadamente pelo RSVP VNL.
- Estados e acessibilidade: telas isoladas usam `hidden`, `inert` e `aria-hidden`; foco, teclado, medidor anunciado, mensagens recuperáveis, movimento reduzido e fallback sem JavaScript foram validados.

## Histórico de comparação

- Primeira passagem: [P2] o frame desktop ampliava para 920 px e a grade mudava para três colunas, alterando densidade e proporção do original; [P2] mensagens permanentes dentro dos equipamentos e feedback inicial aumentavam a altura da fase 1.
- Correções: frame fixado em 590 px, grade mantida em duas colunas, mensagens detalhadas movidas para feedback posterior ao gesto e feedback inicial ocultado.
- Pós-correção: os três painéis `qa-comparison-*.png` confirmam equivalência de composição e densidade em 390×844, 430×932 e 1440×900. Nenhum P0, P1 ou P2 permanece.

## Verificações funcionais do navegador

- Abertura, identificação, seis equipamentos, A/B/C, erro e acerto do medidor, convite, RSVP simulado, replay, áudio, teclado e movimento reduzido executados.
- Capturas browser-rendered geradas nos três viewports; console da implementação sem erros durante a jornada de evidência.
- 18 testes focados Noah, 34 testes unitários e 74 testes E2E completos aprovados.

final result: passed
