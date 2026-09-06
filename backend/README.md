# Backend — Google Sheets e Apps Script

O projeto usa um Apps Script vinculado à própria planilha. Assim, nenhum ID de planilha precisa existir no front-end ou no repositório.

## Arquivos do projeto Apps Script

- `Domain.gs`: normalização, validação e regra de prazo.
- `Code.gs`: setup das abas, endpoint, persistência, painel e menu manual.
- `Sidebar.html`: formulário administrativo dentro da planilha.
- `appsscript.json`: manifesto com o fuso do evento.

## Inicialização

1. Crie uma planilha vazia na conta proprietária.
2. Abra **Extensões → Apps Script** e adicione os arquivos acima.
3. Salve e execute `setupProject` uma vez, aceitando apenas as permissões solicitadas pelo Google.
4. Volte à planilha e confirme as abas `CONFIGURACAO`, `RESPOSTAS`, `CONSOLIDADO` e `PAINEL`.
5. Para testar, use **Implantar → Testar implantações**. A URL `/dev` funciona apenas para editores.
6. Com autorização explícita, crie uma implantação de **App da Web**, executando como o proprietário e permitindo acesso a qualquer pessoa.
7. Copie a URL terminada em `/exec` para `shared/event-config.js`.

Use primeiro uma planilha de homologação. Crie a produção limpa somente depois que todos os testes forem aprovados.
