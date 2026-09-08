# Implantação

## 1. Homologação Google

1. Entre na conta `niver.familia.vnl@gmail.com`.
2. Crie a planilha **Convites VNL 2026 — Homologação**.
3. Em **Extensões → Apps Script**, copie `Domain.gs`, `Code.gs`, `Sidebar.html` e `appsscript.json`.
4. Execute `setupProject`, confira o fuso `America/Fortaleza` e autorize os escopos solicitados.
5. Teste o menu **Convites VNL → Registrar resposta manual**.
6. Em **Implantar → Testar implantações**, valide a aplicação como editor.
7. Somente após autorização explícita, crie uma implantação **App da Web**, executando como proprietário e com acesso para qualquer pessoa.
8. Use a URL `/exec` apenas no ambiente local durante os testes de integração.

## 2. Produção Google

1. Após homologação aprovada, crie **Convites VNL 2026 — Produção** limpa.
2. Repita a instalação do mesmo código e execute `setupProject`.
3. Confira todas as chaves na aba `CONFIGURACAO` e mantenha `RSVP_ATIVO=TRUE`.
4. Com autorização explícita, implante como App da Web anônima.
5. Confirme que `shared/event-config.js` contém exclusivamente a URL `/exec` da implantação vigente de produção.
6. Não registre respostas fictícias na produção. Use o `doGet` para o teste de saúde final.

## 3. GitHub Pages

1. Crie, com autorização explícita, o repositório público `convites-vnl-2026`.
2. Envie este projeto para a branch `main`.
3. Em **Settings → Pages**, selecione **GitHub Actions** como origem.
4. O push não publica: abra **Actions → Test and deploy GitHub Pages → Run workflow**.
5. O workflow testa, monta um artefato contendo apenas os arquivos públicos e então publica.
6. Confirme HTTPS e teste:
   - `https://<conta>.github.io/convites-vnl-2026/hannah/`
   - `https://<conta>.github.io/convites-vnl-2026/noah/`
   - `https://<conta>.github.io/convites-vnl-2026/vagner/`

## 4. Operação

- Para interromper antecipadamente as confirmações, altere `RSVP_ATIVO` para `FALSE`.
- Nunca edite ou apague linhas de `RESPOSTAS`.
- Correções devem ser registradas como novas respostas; a mais recente passa a valer.
- Respostas telefônicas devem entrar pelo menu manual, nunca diretamente nas abas.
- Depois de qualquer mudança do Apps Script, crie uma nova versão da implantação e repita o teste de saúde.
