# Matriz de aceite

Legenda: `[x]` aprovado; `[ ]` ainda requer execução ou evidência.

## Backend e RSVP

- [x] RSVP SIM grava histórico e consolidado, validado também na homologação real.
- [x] RSVP NÃO grava quantidade zero, coberto por teste automatizado de persistência.
- [x] Origens HANNAH, NOAH e VAGNER são fixadas por rota e validadas automaticamente.
- [x] Telefone é normalizado e validado em testes unitários.
- [x] Resposta posterior permanece no histórico em teste automatizado.
- [x] Somente a resposta mais recente fica no consolidado em teste automatizado.
- [x] Deduplicação funciona entre convites em teste automatizado.
- [x] Regra de quantidade zero para NÃO coberta por teste unitário.
- [x] Limite de 15/09/2026 23:59:59 em America/Fortaleza coberto por teste unitário.
- [x] Backend registra submissão tardia com `fora_prazo=TRUE` sem consolidá-la em teste automatizado.
- [x] Interface substitui o formulário pelo contato quando o backend informa prazo fechado.
- [x] Relógio incorreto do aparelho não sobrepõe a decisão de prazo do backend.
- [x] Link do Maps validado em navegador automatizado.
- [x] Artefato público inspecionado sem ID de planilha ou dado pessoal.
- [x] Honeypot, cinco tentativas por telefone/10 min e sessenta submissões globais/min cobertos por testes automatizados.
- [x] Caminho de contenção do `ScriptLock` retorna `BUSY` sem gravar; serialização e consolidação cobertas por testes automatizados.

## Hannah

- [ ] Rota publicada abre de forma independente.
- [x] Rota local abre de forma independente.
- [x] Entrada principal “Entrar no Palácio” abre a revelação e “Descobrir o convite” conclui a jornada, movendo o foco ao convite.
- [x] Introdução possui entrada e opção de pular.
- [x] Atalho Escape fecha a confirmação e devolve o foco ao botão que a abriu.
- [x] Assets aprovados da Hannah são locais e não possuem fallback de personagem genérica.
- [x] Falha ou ausência do endpoint mantém as informações visíveis, bloqueia o envio e não simula sucesso.
- [x] Informações permanecem no HTML sem depender da animação.
- [x] RSVP validado ponta a ponta contra a homologação real, incluindo SIM/3, atualização SIM/2 e situação final NÃO/0.

## Noah

- [ ] Rota publicada abre de forma independente.
- [x] Rota local abre de forma independente.
- [x] Jornada começa por ação explícita em “Começar missão” e move o foco para a seleção dos itens.
- [x] Seis itens podem ser equipados em qualquer ordem.
- [x] Progresso avança de 0/6 a 6/6.
- [x] Cada item apresenta sua mensagem.
- [x] Missão completa aparece depois do sexto item.
- [x] Jornada completa leva o foco às informações do convite.
- [x] Missão pode ser pulada.
- [x] Todos os itens podem ser equipados por teclado e possuem estado acessível `aria-pressed`.
- [x] Missão já concluída não é repetida automaticamente e mantém a opção “Refazer missão”.
- [x] Implementação usa apenas HTML, CSS e JavaScript.
- [x] RSVP validado ponta a ponta contra a homologação real, incluindo SIM/3, atualização SIM/2 e situação final NÃO/0.

## Vagner

- [ ] Rota publicada abre de forma independente.
- [x] Rota local abre de forma independente.
- [x] Entrada principal inicia a microexperiência cinematográfica e a conclusão move o foco ao convite.
- [x] Sequência curta apresenta fundamento, raízes, casa e fé antes de revelar Josué 24:15.
- [x] Introdução pode ser pulada, não se repete para visitantes recorrentes e oferece opção de rever.
- [x] Experiência não possui áudio.
- [x] Teclado aparece somente como detalhe de identidade.
- [x] Josué 24:15 tem destaque visual.
- [x] RSVP validado ponta a ponta contra a homologação real, incluindo SIM/3, atualização SIM/2 e situação final NÃO/0.

## Compatibilidade e publicação

- [x] Chromium desktop validado automaticamente e por inspeção visual.
- [ ] Edge desktop validado manualmente.
- [ ] Safari desktop validado manualmente, quando disponível.
- [ ] Android real validado, quando disponível.
- [ ] iPhone real validado, quando disponível.
- [x] Viewports desktop e mobile aprovados pelo Playwright.
- [x] `prefers-reduced-motion` tratado no núcleo CSS e nas introduções.
- [x] `prefers-reduced-motion` validado automaticamente em Hannah e Vagner.
- [x] `localStorage` guarda apenas a conclusão das experiências, sem dados pessoais.
- [x] Traje despojado, piscina infantil com roupa de banho e proibição de bebidas alcoólicas aparecem nas três rotas.
- [x] Informações críticas e Maps permanecem acessíveis sem JavaScript, cobrindo carregamento lento ou falha dos elementos dinâmicos.
- [x] Nenhuma experiência depende de áudio.
- [x] Artefato do GitHub Pages montado e inspecionado localmente sem efetuar publicação.

## Evidências de homologação — 06/09/2026

- Endpoint anônimo respondeu `STATUS`, com `rsvp_open=true`, sem exigir login.
- Resposta manual fictícia Hannah/SIM/3 foi gravada no histórico e consolidado.
- Correção fictícia enviada pelo convite Noah/SIM/2 reutilizou o mesmo telefone: o histórico ficou com duas linhas e o consolidado com uma única linha vigente.
- O consolidado vigente ficou com `origem=NOAH`, `canal=WEB` e `quantidade=2`.
- O painel apresentou uma confirmação única, duas pessoas, Hannah 0, Noah 2 e Vagner 0.
- Suíte local aprovada: 28 testes unitários e 28 testes de navegador em perfis desktop e mobile.
- A URL interna da homologação foi removida do artefato local após o teste; nenhuma ID de planilha, projeto ou implantação foi encontrada na auditoria do repositório.

## Evidências do merge cirúrgico da Hannah — 07/09/2026

- Export do AI Studio usado somente como referência visual e de interação; React, Vite, Gemini, Express, Tailwind, Motion, Lucide e o modo de sucesso fictício foram rejeitados.
- Arquitetura estática, módulo RSVP compartilhado, rotas Noah/Vagner e backend foram preservados.
- Três assets aprovados foram incorporados localmente: palácio, personagem de corpo inteiro e retrato aproximado.
- Inspeção visual aprovada em viewport desktop e em 390 × 844: entrada, revelação, convite principal e painel RSVP.
- Suíte unitária aprovada: 32 testes em 3 arquivos.
- Suíte de navegador aprovada: 34 testes no Chromium desktop e Pixel 7.
- Regressão automatizada aprovada para HANNAH, NOAH e VAGNER, incluindo contrato de origem, jornada, teclado, prazo, relógio incorreto, ausência de JavaScript e falha do backend.
- Auditoria local não encontrou endpoint real, ID de planilha, e-mail antigo, fallback genérico ou alteração de dependências no artefato público.

## Evidências ponta a ponta da Hannah — 07/09/2026

- A rota Hannah conectada somente ao endpoint existente de homologação registrou, com o telefone de teste `5511900000001`, a sequência `SIM/3` → `SIM/2` → `NAO/0`.
- `RESPOSTAS` preservou as três linhas, todas com `origem=HANNAH`, `canal=WEB` e `fora_prazo=FALSE`.
- `CONSOLIDADO` manteve uma única linha para o telefone, vinculada à terceira resposta, com `presenca=NAO` e `quantidade=0`.
- O `PAINEL` passou a mostrar 1 resposta vigente “não irá”, sem acrescentar pessoas confirmadas ou pessoas Hannah; a atualização final ficou em 07/09/2026 05:38:02.
- O cenário de endpoint indisponível manteve as informações do convite visíveis, exibiu mensagem de indisponibilidade e deixou todos os controles de envio desabilitados, sem simular sucesso.
- A produção permaneceu vazia: `RESPOSTAS` e `CONSOLIDADO` somente com cabeçalhos; painel com todas as métricas em zero e sem data de atualização.

## Evidências da experiência Noah — 07/09/2026

- A rota foi redesenhada localmente como missão bíblica “A Armadura de Deus”, usando somente HTML semântico, CSS e JavaScript, com elementos gráficos em SVG/CSS e sem dependências novas.
- Os seis itens e suas mensagens congeladas foram preservados; a seleção continua livre, sem pontuação, derrota ou cronômetro.
- Foram validados início explícito, progresso 0/6–6/6, feedback por item, conclusão, salto da missão, operação por teclado e retorno direto ao convite com opção de refazer.
- O RSVP compartilhado permaneceu conectado ao contrato `origem=NOAH`; indisponibilidade do endpoint continua bloqueando o envio sem simular sucesso.
- A regressão final aprovou 32 testes unitários e 36 testes de navegador no Chromium desktop e no perfil móvel Pixel 7, cobrindo as três origens.
- A regressão revelou e corrigiu uma corrida de foco já existente no painel da Hannah; a correção foi isolada ao cancelamento/adiamento do foco e passou em 5 de 5 repetições móveis antes da suíte integral.
- Nenhuma planilha, Apps Script, implantação, configuração de produção ou artefato de GitHub Pages foi alterado ou publicado nesta etapa.

## Evidências ponta a ponta do Noah — 07/09/2026

- A rota Noah conectada somente ao endpoint existente de homologação registrou, com o telefone fictício `5511900000002`, a sequência `SIM/3` → `SIM/2` → `NAO/0`.
- `RESPOSTAS` preservou exatamente as três linhas, em 07/09/2026 às 06:27:31, 06:27:55 e 06:28:16, todas com `origem=NOAH`, `canal=WEB` e `fora_prazo=FALSE`.
- `CONSOLIDADO` manteve uma única linha para o telefone, vinculada à terceira resposta, com `presenca=NAO`, `quantidade=0`, `origem=NOAH` e `canal=WEB`.
- O `PAINEL` manteve 1 confirmação única e 2 pessoas confirmadas, passou de 1 para 2 respostas vigentes “não irá” e registrou última atualização em 07/09/2026 06:28:16. As 2 pessoas Noah preexistentes permaneceram coerentes com o outro telefone vigente `SIM/2`.
- Com endpoint deliberadamente indisponível apenas na configuração local temporária, as informações continuaram visíveis, o formulário permaneceu desabilitado e foi exibida a mensagem de indisponibilidade; `RESPOSTAS` continuou com somente as três linhas do teste.
- A URL de homologação e a URL inválida foram removidas da configuração local após o teste.
- A produção permaneceu sem respostas: `RESPOSTAS` e `CONSOLIDADO` somente com cabeçalhos; `PAINEL` com todas as métricas em zero e sem data de atualização.
- Nenhuma alteração ou implantação foi feita em produção e nenhum GitHub Pages foi publicado.

## Hotfix de latência do RSVP — 08/09/2026

- A verificação inicial passou a aguardar 30 segundos; a submissão aguarda 45 segundos, com estados e `request_id` separados.
- Respostas `STATUS` atrasadas não interferem em envios já iniciados; o botão de envio permanece desabilitado durante a submissão.
- O cliente só exibe sucesso após `RECORDED` com `ok=true`. Ausência total de retorno não produz falso sucesso e mantém o envio bloqueado, com opção de nova tentativa.
- Regressão aprovada: 32 testes unitários e 42 testes de navegador (Chromium desktop e perfil móvel), incluindo resposta após 13 segundos e ausência total de resposta.

## Trilha ambiente opcional da Hannah — 08/09/2026

- O MP3 aprovado foi preservado sem recompressão em `hannah/assets/trilha-palacio.mp3`: 2.898.128 bytes, 256 kbps e duração estimada em aproximadamente 90,6 segundos.
- A página abre silenciosa; “Entrar no Palácio” inicia uma única faixa em loop a volume `0.18` quando a preferência não está desativada.
- O controle roxo/dourado informa o estado real, funciona por teclado, pausa e retoma sem reiniciar a faixa e usa somente `vnl_hannah_sound=on|off` no armazenamento local.
- Refresh não provoca autoplay nem cria outra instância. Rejeição de `play()`, erro do MP3 e mudança de visibilidade não interrompem o convite.
- O artefato estático local incluiu o MP3 no caminho esperado, sem base64, hotlink, CDN ou dependência nova.
- Testes específicos de áudio: 10 aprovados nos perfis desktop e móvel. Regressão completa: 32 testes unitários e 52 testes de navegador aprovados.
- Hannah manteve Maps, transições, RSVP e `origem=HANNAH`; Noah, Vagner, núcleo compartilhado, backend, planilhas e Apps Script permaneceram sem alteração.
- Publicação deliberadamente pendente: o commit desta etapa ficará somente local até nova autorização para push em `main`.

## Evidências da ativação controlada de produção — 08/09/2026

- O Web App de produção foi implantado na versão 1, executando como `niver.familia.vnl@gmail.com`, com acesso anônimo habilitado para o RSVP; a planilha de produção continuou privada.
- A URL `/exec` de produção respondeu a uma consulta `status` não destrutiva a partir das três rotas, sem gravar dados e com o prazo aberto.
- Após a configuração, `RESPOSTAS` e `CONSOLIDADO` da produção permaneceram somente com cabeçalhos; `PAINEL` permaneceu com todas as métricas em zero e sem última atualização.
- O front-end passou a conter exclusivamente a URL `/exec` vigente de produção. Auditoria do artefato estático não encontrou IDs de planilhas ou projetos, credenciais, dados pessoais, URLs de homologação, placeholders de endpoint ou e-mails antigos.
- Regressão pós-configuração aprovada: 32 testes unitários e 38 testes de navegador; o teste direcionado de foco da Hannah passou em 2 de 2 perfis.
- Nenhuma resposta fictícia foi enviada à produção e nenhum histórico foi apagado.
- A publicação no GitHub Pages não foi executada: o GitHub CLI (`gh`) não está instalado neste ambiente e não foi possível verificar com segurança a conta proprietária. Repositório, remoto, push, workflow e links públicos permanecem pendentes de uma conta/repositório explicitamente definido ou de CLI autenticado.

## Evidências da experiência Vagner — 07/09/2026

- A rota foi redesenhada localmente como “Fé, Família e Legado”, com uma sequência em quatro movimentos: pedra/fundamento, oliveira/raízes, casa/família e luz/fé.
- Josué 24:15 funciona como clímax da abertura e reaparece no primeiro bloco do convite antes das informações e do RSVP.
- A composição usa azul-marinho, dourado de pôr do sol, pedra e oliveira em SVG/CSS locais; o teclado permanece pequeno, periférico e identificado apenas como assinatura pessoal.
- Foram validados o caminho completo, o salto da introdução, o retorno sem repetição automática, a opção “Rever abertura”, foco, movimento reduzido e funcionamento sem áudio.
- A inspeção visual aprovou entrada, clímax e convite no viewport desktop, além de entrada e clímax no perfil móvel Pixel 7.
- A regressão final aprovou 32 testes unitários e 38 testes de navegador no Chromium desktop e no perfil móvel Pixel 7, cobrindo Hannah, Noah, Vagner e os contratos compartilhados.
- O RSVP continuou com `origem=VAGNER`; a integração real foi aprovada na etapa específica de homologação ponta a ponta descrita abaixo.
- Nenhuma planilha, Apps Script, endpoint, configuração de produção ou publicação no GitHub Pages foi alterada nesta etapa.

## Evidências ponta a ponta do Vagner — 07/09/2026

- A rota Vagner conectada somente ao endpoint existente de homologação registrou, com o telefone fictício `5511900000003`, a sequência `SIM/3` → `SIM/2` → `NAO/0`.
- `RESPOSTAS` preservou exatamente as três novas linhas, em 07/09/2026 às 11:22:47, 11:23:27 e 11:24:03, com IDs distintos, `origem=VAGNER`, `canal=WEB` e `fora_prazo=FALSE`.
- O histórico bruto anterior permaneceu íntegro e as três novas linhas foram mantidas em modo append-only.
- `CONSOLIDADO` manteve uma única linha para o telefone, vinculada à terceira resposta, com `presenca=NAO`, `quantidade=0`, `origem=VAGNER` e `canal=WEB`.
- O `PAINEL` manteve 1 confirmação única e 2 pessoas confirmadas, passou de 2 para 3 respostas vigentes “não irá” e registrou última atualização em 07/09/2026 11:24:03. As 2 pessoas Noah preexistentes permaneceram coerentes; pessoas Vagner ficou em 0 porque a resposta vigente é `NAO`.
- Com endpoint deliberadamente indisponível apenas na configuração local temporária, as informações continuaram visíveis, o formulário permaneceu desabilitado e foi exibida a mensagem de indisponibilidade; nenhuma quarta linha foi gravada.
- A URL de homologação e a URL inválida foram removidas da configuração local após o teste.
- A produção permaneceu sem respostas: `RESPOSTAS` e `CONSOLIDADO` somente com cabeçalhos; `PAINEL` com todas as métricas em zero e sem data de atualização.
- A regressão final aprovou 32 testes unitários e 38 testes de navegador. A execução de navegador foi repetida com um processo após contenção de recursos na rodada paralela e terminou integralmente aprovada.
- Nenhuma alteração ou implantação foi feita em produção e nenhum GitHub Pages foi publicado.

## Refinamento fotográfico da rota Vagner — 08/09/2026

- A fotografia aprovada foi tratada exclusivamente por recorte determinístico e conversão WebP, sem geração por IA, retoque facial, ampliação ou filtros agressivos.
- O único asset derivado, `vagner/assets/vagner-hero.webp`, usa o recorte da origem em `left=205`, `top=70`, `350×1080`, mantendo a mesma resolução na saída. Foi codificado em WebP com qualidade 90 e ocupa 66.510 bytes.
- O arquivo ficou abaixo da faixa aspiracional de 300–700 KB porque o recorte estreito comprimiu com eficiência; aumentar artificialmente o peso não melhoraria a fidelidade. A inspeção visual aprovou nitidez, reconhecimento e ausência completa de textos, caixas informativas, teclado e inscrições rasterizadas.
- A mesma fotografia aparece na abertura, recua durante fundamento, raízes, casa e fé, acompanha o clímax de Josué 24:15 e retorna no bloco final do convite. Nome, idade, tema e verso permanecem em HTML.
- Abertura e convite foram inspecionados em 390×844, 430×932 e 1440×900; o clímax também foi inspecionado em 1440×900. Não houve corte de rosto, sobreposição de texto, scroll horizontal ou inacessibilidade dos controles.
- Evidências locais: `docs/evidence/vagner/desktop-abertura.png`, `desktop-climax.png`, `desktop-convite.png`, `mobile-390x844-abertura.png`, `mobile-390x844-convite.png`, `mobile-430x932-abertura.png` e `mobile-430x932-convite.png`.
- O teste fotográfico confirma três usos do asset local, dimensões naturais 350×1080, hierarquia de nome/idade, presença no clímax e no convite e ausência de overflow horizontal.
- Testes focados de Vagner: 8 aprovados nos perfis desktop e móvel. Regressão final: 32 testes unitários e 54 testes de navegador aprovados. O cenário de teclado do Noah foi estabilizado no teste aguardando o foco programado da missão e passou em 5 de 5 repetições desktop antes da suíte integral.
- A montagem estática local incluiu `vagner/assets/vagner-hero.webp` com 66.510 bytes e não incluiu a arte original `Convite-Vagner.png`.
- `vagner/app.js`, `shared/`, `backend/`, Hannah e Noah permaneceram inalterados. O MP3 aprovado da Hannah conservou o SHA-256 `59FC13FF781EBFDFE36545726192B71891B1B1DD8CA8E451DBE9F35597B78FE4`.
- Nenhum push ou publicação foi realizado nesta etapa.

## Reposicionamento esportivo da rota Vagner — 08/09/2026

- A rota passou a seguir três momentos: entrada no estádio, revelação editorial do Vagner e convite com informações/RSVP.
- A direção anterior de pedra, raízes, casa, oliveira, teclado e “uma assinatura pessoal” foi removida. Josué 24:15 permaneceu somente como faixa secundária antes da confirmação.
- `vagner-stadium.webp` preserva 941×1672 e ocupa 234.746 bytes; `vagner-tunnel.webp` preserva 768×1376 e ocupa 150.410 bytes. O antigo `vagner-hero.webp` foi removido.
- A inspeção visual aprovou 1440×900, 390×844 e 430×932; 360×800 também foi medido. Não houve overflow horizontal, e os controles móveis mediram 53 px de altura.
- Evidências desktop e mobile das cenas 1, 2 e convite estão em `docs/evidence/vagner-sport/`. O relatório `design-qa.md` terminou com `final result: passed`.
- Testes focados de Vagner: 8 aprovados. Suíte unitária: 32 aprovados. Regressão E2E: 54 aprovados em Chromium desktop e mobile.
- Maps, avisos, prazo, visitante recorrente, movimento reduzido, falha segura do backend e `origem=VAGNER` permaneceram cobertos.
- `shared/`, `backend/`, Hannah, Noah, planilhas e Apps Script não foram alterados. Nenhum push ou publicação foi realizado.

## Trilha opcional da rota Vagner — 08/09/2026

- O MP3 aprovado foi copiado sem recompressão para `vagner/assets/trilha-vagner.mp3`: 3.964.760 bytes, aproximadamente 123,899 segundos, 256 kbps, estéreo e 44,1 kHz; SHA-256 `852721C24304A023A0BD302EFE8E01B6FD7D95D6804CEFC2B876A0C21F52CCF2`.
- A página permanece silenciosa ao carregar. A reprodução em volume `0.16` depende do gesto em “Entrar na celebração” ou no controle explícito de som, usa uma única instância em loop e não reinicia entre as cenas.
- O controle preserva somente `vnl_vagner_sound=on|off`; refresh não produz autoplay. Ocultar a página pausa a faixa e o retorno só retoma do mesmo ponto quando o som continua habilitado.
- Rejeição de `play()` e erro do MP3 mantêm convite, Maps e RSVP funcionais, refletem o som como desligado e permitem nova tentativa por gesto.
- A cobertura automatizada valida silêncio inicial, volume, loop, instância única, preferência, teclado, mute, retomada, continuidade, refresh, visibilidade e falhas seguras.
