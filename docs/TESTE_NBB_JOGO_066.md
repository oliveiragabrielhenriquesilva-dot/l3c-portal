# NBB 2026/2027 — Jogo 066 para testes da Mesa L3C

## Origem
- Partida: **Itatiaiuçu Cruzeiro Basquete x Basquete Cearense**.
- Data: **16/11/2026, 19h30 (America/Sao_Paulo)**.
- Local: **Ginásio Dona Salomé — Barro Preto, Belo Horizonte/MG**.
- NBB: **jogo 066, 6ª rodada do 1º turno**.
- Fonte: https://lnb.com.br/partidas/nbb-2026-2027-itatiaiucu-cruzeiro-basquete-x-basquete-cearense-16112026-1930/

## Artefato
A carga em `data/testes/nbb-2026-2027-jogo-066.json` contém:
- competição fictícia **NBB 2026/2027 — TESTE DA MESA**, não pública;
- temporada 2026/2027 e fase 1º turno;
- um jogo agendado, iniciado em **0 x 0**, 4 períodos de 10 minutos e posse de 24 s;
- equipes CRU e BCE, treinadores e os **13 jogadores por equipe** identificados no elenco publicado pela LNB;
- 12 relacionados simulados por equipe e 5 titulares sugeridos por equipe (não representa escalação oficial);
- **sem datas de nascimento fabricadas**; as datas são `null`.

Validar localmente: `node scripts/validate-nbb-fixture.mjs`.

## Implantação controlada no Stats (ainda NÃO executada)
O repositório `l3c-portal` é somente o site público Next.js, não contém a implementação operacional da API NestJS/Prisma nem credenciais de banco. Portanto, adicionar este manifesto **não cadastra** o campeonato ou o jogo na API. O importador que roda na API deve:
1. Confirmar **base de homologação ou isolamento verificável** antes de executar; interromper se o ambiente for a base oficial ou se o isolamento não puder ser garantido.
2. Fazer upsert por `externalKey` de competição, temporada, fase, equipes e atletas.
3. Criar participações das duas equipes na temporada; vincular os 13 jogadores a cada equipe e relacionar somente os 12 selecionados na configuração de treinamento.
4. Criar **um único jogo** `TEST_NBB_GAME_066`, com mandante CRU, visitante BCE, 16/11/2026 19h30 UTC-3, status agendado e placar zero.
5. Preparar os 5 iniciais simulados e liberar acesso de **Mesa**, arbitragem e transmissão de testes. Não usar a escalação simulada como súmula oficial.
6. Aplicar as regras de teste sem inventar nascimento nem contornar as regras das inscrições oficiais. Se data de nascimento for obrigatória, ajustar o validador **somente na área de treinamento**.
7. Impedir publicação no site público, classificação real, ranking oficial, estatísticas agregadas ou qualquer exportação GoChamps/LNB.
8. Reexecutar a carga e confirmar **idempotência**: continuar existindo exatamente 1 campeonato de teste, 1 temporada, 2 equipes, 26 cadastros de atleta e 1 jogo `TEST_NBB_GAME_066`.
9. Testar mesa offline: iniciar, parar, registrar pontos, faltas, substituições, conferir transmissão, recuperar conexão e validar sync sem duplicar eventos.

**Não** enviar tokens, segredos ou backups SQL ao GitHub. Antes de importar, comparar os campos do manifesto com o schema Prisma e endpoints internos da versão realmente implantada na Hostinger; `externalKey`, `isTest` e demais atributos são identificadores semânticos do manifesto e não se deve presumir que são campos existentes no banco.

## Fonte dos elencos
- https://lnb.com.br/equipes/cruzeiro-basquete/
- https://lnb.com.br/equipes/basq-cearense/
