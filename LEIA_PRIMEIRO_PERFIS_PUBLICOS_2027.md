# L3C — Perfis públicos de atletas recém-homologados (correção RC1)

## Defeito identificado

O perfil `/player/[slug]` procurava os atletas na lista `players` do resumo estatístico da temporada. Esse resumo considera somente atletas com jogos finalizados. Por isso, um atleta novo, cadastrado pelo representante e homologado pela Liga, podia estar no elenco e ainda assim retornar 404 na página pública enquanto não tivesse estatísticas.

## Correção aplicada

- `lib/site.js`: `getUnifiedPlayerProfile` consulta também `GET /v1/public/seasons/:seasonId/players`, a lista pública do elenco que já inclui atletas com zero jogos. Em seguida busca os dados individuais existentes na API.
- `lib/site.js`: `publicSearchExtra` usa a mesma lista de atletas inscritos, permitindo localizar esses atletas na busca do Portal.
- Não cria perfis duplicados no banco. A página pública é renderizada a partir do cadastro existente (pessoa/atleta) e do vínculo na temporada.
- Páginas de atletas históricos e de 2026 permanecem preservadas.

## Requisitos / publicação

- Este pacote altera **somente o Portal da Equipe / site público** (`liga3colinas.com.br`). A API anterior já possui as rotas públicas exigidas. O Stats não foi alterado.
- Projeto de código-fonte Next.js, destinado ao build com Node.js 22 na Hostinger: `npm install`, `npm run build`, `npm start`.
- Conserve na Hostinger todas as variáveis de ambiente da instalação atual (principalmente `L3C_API_URL`). Não inclua arquivos `.env` com credenciais no ZIP.
- **Antes de substituir o projeto**, compare a versão instalada com esta base (Portal `0.6.0-rc2`), e faça backup. Se a produção já contiver código mais novo, aplique apenas a alteração de `lib/site.js` à base atual para evitar regressões.
- Após publicar, homologue um atleta novo, ainda com 0 jogos, visite `/player/slug-do-nome/` e confirme que aparece na busca e no elenco.
- Não publique no lugar da aplicação da API ou do Stats.

## Testes executados

- `node --check lib/site.js`: passou.
- Teste isolado com respostas simuladas da API: aprovado, perfil com zero jogos resolve, busca encontra o atleta, nome inexistente permanece sem perfil.
- `npm run validate` no projeto herdado reporta falhas preexistentes de verificação de arquitetura unificada em páginas não modificadas por esta correção. Não tratamos esse validador como aprovação completa.
- **Não executado:** `next build` e testes com a API ou banco reais (dependências e ambiente de produção indisponíveis neste pacote).
