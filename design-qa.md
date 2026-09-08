# Design QA — Vagner esportivo

## Fontes e normalização

- Referência da cena 1: `C:/Users/leona/Downloads/ChatGPT Image 8 de set. de 2026, 12_49_19.png` (941×1672).
- Referência da cena 2: `C:/Users/leona/Downloads/Gemini_Generated_Image_yr48ktyr48ktyr48.jpg` (768×1376).
- Implementação desktop: `docs/evidence/vagner-sport/desktop-scene-1.png`, `desktop-scene-2.png` e `desktop-invite.png` (1440×900, viewport CSS 1440×900, DPR 1).
- Implementação mobile: `docs/evidence/vagner-sport/mobile-scene-1.png`, `mobile-scene-2.png` e `mobile-invite.png` (390×844, viewport CSS 390×844, DPR 1).
- As referências são fotografias verticais, não mockups de interface. A comparação normalizou cada fotografia por `contain` e confrontou identidade, crop, cor e qualidade com as capturas da interface nos estados equivalentes.

## Evidência comparativa

- Cena 1: o túnel, o campo e a luz de pôr do sol permanecem reconhecíveis em desktop e mobile; o overlay verde cria contraste sem apagar a fotografia.
- Cena 2: a mesma fotografia aprovada é usada sem deformação ou filtro pesado; rosto e tronco permanecem claros nos dois breakpoints.
- Convite: a cena do estádio reaparece com crop e contraste secundários, deixando nome, idade, informações e ação do Maps legíveis.
- Comparações focadas de rosto, topo da cabeça e tronco foram realizadas porque o recorte desktop depende de `object-position`. Não foram necessários recortes focados adicionais para tipografia ou controles, que permanecem legíveis nas capturas integrais.

## Superfícies obrigatórias

- Tipografia: sans-serif pesada e contemporânea cria hierarquia esportiva sem retornar ao tom cerimonial; corpo, marcadores e números mantêm pesos e espaçamento legíveis.
- Espaçamento e layout: cenas ocupam a primeira dobra, CTAs não colidem e o convite mantém ritmo vertical. Não há overflow em 360, 390, 430 ou 1440 px.
- Cores: verde profundo e branco predominam; dourado aparece apenas em pequenos marcadores. Contraste aprovado sobre as duas imagens.
- Imagens: os WebPs mantêm dimensões originais e boa nitidez. Não há assets simulados, imagens geradas nesta etapa ou repetição artificial de símbolos esportivos.
- Conteúdo: textos aprovados aparecem em HTML; regras compartilhadas, Maps, prazo e aviso de álcool permanecem coerentes.
- Interação e acessibilidade: foco, teclado, pular, rever, visitante recorrente, Escape, `inert`, textos alternativos e movimento reduzido foram preservados. Botões medem 53 px nos breakpoints móveis verificados.

## Histórico de comparação

- Primeira passagem: [P2] a posição vertical da foto na cena 2 desktop aproximava demais o topo da cabeça.
- Correção: `object-position` passou para 29% no desktop e 32% no breakpoint intermediário; o ajuste móvel específico foi preservado.
- Pós-correção: a captura `desktop-scene-2.png` confirma espaço acima do cabelo, rosto íntegro e tronco suficiente. Nenhum P0, P1 ou P2 permanece.

## Checklist

- [x] Cena 1, cena 2 e convite comparados com as referências.
- [x] Desktop 1440×900 e mobile 390×844 capturados.
- [x] Breakpoints 360×800 e 430×932 medidos.
- [x] Interações principais verificadas no navegador.
- [x] Console sem erros nas capturas automatizadas.
- [x] Regressão unitária e de navegador aprovada.

final result: passed
