# Convites VNL 2026

Três convites digitais independentes, unidos por um único RSVP em Google Apps Script e Google Sheets.

## Rotas

- `hannah/` — Hannah Lis, 7 anos, Rainha Ester.
- `noah/` — Heitor Noah, 10 anos, Armadura de Deus.
- `vagner/` — Vagner Cunha, 42 anos, Fé · Família · Legado.

O diretório `shared/` contém somente o núcleo comum. `backend/`, `tests/` e `docs/` não fazem parte do artefato publicado.

## Desenvolvimento local

```text
npm install
npm run serve
npm test
npm run test:e2e
```

Abra `http://127.0.0.1:4173/hannah/`, `/noah/` ou `/vagner/`.

Enquanto `shared/event-config.js` contiver o placeholder do Apps Script, os convites exibem as informações normalmente e mantêm o RSVP bloqueado.

## Publicação

Consulte `docs/DEPLOYMENT.md`. O workflow do GitHub Pages só pode ser iniciado manualmente e não publica nada ao simples push.
