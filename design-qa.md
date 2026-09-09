# Design QA — refinamento final do Heitor Noah

## Fonte, implementação e normalização

- Verdade visual do personagem: `C:/Users/leona/Downloads/noah04.png` (PNG, 1024×1536, 2.114.991 bytes, transparência).
- Fonte de layout preservada: baseline local `8ec3841` e capturas anteriores em `docs/evidence/noah-level-up/`.
- Implementação: rota local `/noah/`, asset `noah/assets/noah-armadura.webp` e capturas em `docs/evidence/noah-final/`.
- Viewports: 390×844, 430×932 e 1440×900 CSS px, `deviceScaleFactor=1`.
- Estados: abertura, identificação e convite final; o retrato também foi capturado como região focada em cada viewport.
- Comparação integral no mesmo quadro: `docs/evidence/noah-final/qa-layout-comparison-mobile-390x844.png`.
- Comparação focada no mesmo quadro: `docs/evidence/noah-final/qa-asset-comparison.png`, reunindo PNG fonte, WebP otimizada e renderização final.

## Evidência e superfícies obrigatórias

- Tipografia: famílias, pesos, escalas e hierarquia do jogo foram preservados. A remoção dos três textos solicitados reduziu ruído sem alterar as mensagens canônicas restantes.
- Espaçamento e layout: a abertura foi compactada e cruz/controle foram redistribuídos dentro do console. O convite mantém o frame de 590 px no desktop e usa retrato de até 340 px; não há colisão ou overflow horizontal.
- Cores e tokens: navy, ciano, lime, roxo e amarelo permanecem inalterados; a nova moldura usa somente transparências desses tokens, com contraste suficiente sobre o asset.
- Imagem: a WebP mantém 1024×1536, transparência, proporção 2:3, enquadramento integral e fisionomia. Capacete, rosto, escudo, espada e pés permanecem visíveis; não há recorte, ampliação destrutiva ou halo de compressão perceptível.
- Copy e conteúdo: `PLAYER DA LUZ // ONLINE` e os dois textos auxiliares solicitados foram removidos. Nome, nível, evento, avisos, Maps, RSVP e “JOGAR NOVAMENTE” permanecem.
- Acessibilidade: o `img` possui texto alternativo descritivo e dimensões declaradas; foco, teclado, movimento reduzido, estados `hidden`/`inert` e fallback sem JavaScript continuam cobertos.
- Estados e interações: jornada, replay, Maps e RSVP simulado foram exercitados. A captura automatizada terminou sem erros de console.

## Histórico de comparação

- Primeira passagem: [P2] a borda do aviso flutuante vazio permanecia parcialmente visível na base do viewport e também surgia no meio de capturas de página inteira.
- Correção: o aviso agora fica invisível e transparente fora de `.is-visible`, preservando sua animação e comportamento quando há mensagem.
- Pós-correção: novas capturas em 390×844, 430×932 e 1440×900 confirmam a ausência do artefato. Nenhum P0, P1 ou P2 permanece.
- O primeiro disparo paralelo da suíte apresentou quatro timeouts sob carga em testes antigos. A repetição integral sequencial aprovou os 74 casos nos dois perfis, confirmando ausência de regressão funcional.

## Verificações

- 18 testes focados Noah aprovados em Chromium desktop e Pixel 7.
- 34 testes unitários aprovados.
- 74 testes E2E aprovados em Chromium desktop e Pixel 7 na execução integral sequencial.
- Auditoria de diff: `noah/app.js`, Hannah, Vagner, `shared/`, backend e workflow permanecem idênticos à baseline `8ec3841`.

final result: passed
