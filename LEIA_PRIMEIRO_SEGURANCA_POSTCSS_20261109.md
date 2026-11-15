# L3C — Correção PostCSS (09/11/2026)

## Escopo

Base: L3C_Portal_Seguranca_Node_20261109_RC1.zip. A atualização altera apenas:
- `package.json`: adiciona dependência explícita `postcss: 8.5.32` e `overrides.postcss: 8.5.32` para forçar essa versão inclusive em dependências indiretas;
- `scripts/verify-security-versions.mjs`: verifica também PostCSS e o override;
- Este documento de implantação.

Permanecem os mesmos Next.js 15.5.29, React e React DOM 19.1.10. Todo o código funcional do Portal (inscrições, representantes, comissão técnica e perfis públicos) permanece sem alterações.

## Importante — Como instalar sem derrubar o Portal

1. Faça backup da implantação atual e tenha um rollback disponível. **Não exclua variáveis de ambiente da Hostinger.**
2. Faça build na área de homologação, preferencialmente com Node.js 22.x.
3. Como o ZIP não inclui `node_modules` nem `package-lock.json`, execute:

```bash
npm install
npm run security:versions
npm ls postcss --all
npm run build
npm run security:check
```

4. Em `npm ls postcss --all` confira se TODAS as versões resolvidas são `8.5.32`. Caso apareça versão antiga, não publique.
5. Teste Portal da Equipe (login, inscrições, novas solicitações, homologação, troca de fotos, desvinculação durante janela), páginas públicas de atletas e navegação geral.
6. Faça deploy do ZIP completo **somente depois** do build e dos testes. Mantenha as variáveis de ambiente atuais.
7. Verifique logs e execute nova varredura de vulnerabilidades da Hostinger. Se algo falhar, utilize rollback.

## Limitações dos testes efetuados aqui

Não foi possível instalar pacotes nem executar `next build`/`npm audit`: o registro npm retornou falha DNS (`EAI_AGAIN`). O pacote foi verificado quanto a estrutura, JSON, sintaxe do script de conferência, integridade e preservação dos arquivos funcionais. É **um projeto-fonte para build**, não um build já executado, e não foi publicado.

## Referências de versão

https://www.npmjs.com/package/postcss — versão 8.5.32 publicada em outubro de 2026.
https://security.snyk.io/package/npm/postcss — ausência de vulnerabilidades conhecidas em 8.5.32, à data da consulta.
