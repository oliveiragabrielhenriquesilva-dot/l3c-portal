# Portal da Equipe — Atualização de representantes (06/11/2026)

## O que mudou
- `Painel da Equipe > Elenco`: botão **Retirar vínculo** aparece somente quando a API confirma janela aberta.
- `Painel da Equipe > Comissão Técnica`: opção **Alterar foto** nos profissionais ativos e pendentes, com upload JPG/PNG/WEBP até 5 MB.
- Novas rotas BFF que utilizam a sessão do representante, sem expor o token no navegador:
  - `/api/team-portal/roster` (GET policy / DELETE vínculo)
  - `/api/team-portal/staff/photo` (POST multipart)
- As validações de equipe, janela e permissão são feitas **também na API**.

## Instalação
- Aplicação Next.js, Node.js conforme `package.json`.
- Instale as dependências na Hostinger (`npm install`), compile (`npm run build`) e inicie (`npm start`).
- **Publique a API atualizada primeiro**, depois o Portal. O novo Portal sem as novas rotas da API não permitirá retirada/foto.
- Preserve a configuração de API e sessão existente.
- Não substitua `hbuilds/current` manualmente. Faça backup e use a implantação Node.js da Hostinger.

## Limite de validação
Os arquivos alterados passaram na validação de sintaxe. **Build completo e integração com API/DB reais não foram executados** neste ambiente.
