# L3C - Atualização de segurança do Portal (09/11/2026)

## O que mudou

Base: L3C_Portal_Perfis_Publicos_Atletas_2027_Node_RC1.zip (último pacote enviado).
Alterações pontuais: package.json e scripts/verify-security-versions.mjs.

- Next.js: 15.5.6 -> 15.5.29 (correções críticas e moderadas de 2026)
- React: 19.1.1 -> 19.1.10
- React DOM: 19.1.1 -> 19.1.10
- Mantida a mesma versão principal de Next.js (15) e React (19).
- scripts `security:check` e `security:versions` adicionados.
- Node.js recomendado: 22.x.
- O código de cadastro, representantes, comissão técnica, perfis públicos e APIs permaneceu intacto.

## Importante antes de subir

1. **Não publicar direto em produção antes de um teste de build em ambiente de homologação.**
2. Backup da implantação atual e das variáveis de ambiente no painel, sem incluir segredos no ZIP.
3. Conferir se esta base corresponde ao código em produção; alterações posteriores podem ser revertidas pelo redeploy.
4. Faça instalação limpa das dependências. Este pacote não leva node_modules nem um package-lock gerado, porque a conexão com npm Registry não estava disponível neste ambiente.
5. Na raiz do projeto, com Node 22: `npm install`, depois `npm run security:versions`, `npm run build` e `npm run security:check`.
6. Testar login, acesso dos representantes, nova inscrição, aprovação/homologação, foto da comissão técnica, desvinculação do atleta e perfis públicos.
7. Só então publique via Hostinger, preservando as variáveis de ambiente já configuradas e acompanhando logs.
8. Se aparecer erro, volte para a implantação anterior e analise os logs antes de repetir.

### Alcance da correção

A atualização resolve vulnerabilidades relatadas para versões antigas do Next.js, incluindo GHSA-2464-fhr4-w9xw, mas **não comprova que os 42 alertas da Hostinger desapareceram**; o relatório inclui dependências transitivas ainda não auditadas.

O relatório de segurança pós-deploy deve ser lido de novo para encontrar dependências ainda vulneráveis.

Fontes do fornecedor: https://github.com/vercel/next.js/releases/tag/v15.5.29 ; https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw
