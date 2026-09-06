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
- [x] Entrada principal “Entrar no Palácio” conclui a jornada e move o foco ao convite.
- [x] Introdução possui entrada e opção de pular.
- [x] Informações permanecem no HTML sem depender da animação.
- [ ] RSVP validado contra a homologação.

## Noah

- [ ] Rota publicada abre de forma independente.
- [x] Rota local abre de forma independente.
- [x] Seis itens podem ser equipados em qualquer ordem.
- [x] Progresso avança de 0/6 a 6/6.
- [x] Cada item apresenta sua mensagem.
- [x] Missão completa aparece depois do sexto item.
- [x] Jornada completa leva o foco às informações do convite.
- [x] Missão pode ser pulada.
- [x] Implementação usa apenas HTML, CSS e JavaScript.
- [ ] RSVP validado contra a homologação.

## Vagner

- [ ] Rota publicada abre de forma independente.
- [x] Rota local abre de forma independente.
- [x] Entrada principal conclui a jornada e move o foco ao convite.
- [x] Experiência não possui áudio.
- [x] Teclado aparece somente como detalhe de identidade.
- [x] Josué 24:15 tem destaque visual.
- [ ] RSVP validado contra a homologação.

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
