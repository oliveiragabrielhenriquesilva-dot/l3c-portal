# L3C — correções RC6: divisões, tabela e duplicações Master

13/11/2026. Substitui a RC5 e mantém as correções de cadastro, foto, camisa e retirada do representante.

## Divisões e fases

A apresentação da RC5 misturava divisão com fase e o gerador da tela usava o total de 20 equipes para as duas divisões. Isso foi uma falha da entrega anterior.

Agora a hierarquia visível é **Competição → Temporada → Divisão → Fase**. Elite e Acesso ficam em seletores e blocos separados. Dentro da divisão há Classificação e Mata-mata, com rodadas próprias (play-in onde se aplica, quartas, semifinais e final). Os registros internos de fase continuam vinculados à divisão para manter classificação e chaveamento independentes. Não foi necessário alterar IDs de jogos ou criar uma nova tabela de banco.

- Elite: 8 equipes, 14 rodadas e 56 jogos classificatórios.
- Acesso: 12 equipes, 11 rodadas e 66 jogos classificatórios.
- O gerador genérico de 2027 foi bloqueado também na API: ele não deve substituir os confrontos e horários do PDF.
- As fases antigas com os nomes exatos Classificação · Elite/Acesso são reaproveitadas e vinculadas às divisões ao aplicar a tabela oficial, em vez de criar outras cópias. Contagem prevista passa a 8/12 e os nomes das fases passam a Classificação/Mata-mata.
- Cadastro e mudança de equipe/fase de um jogo validam a divisão das duas equipes quando a fase tem divisão definida.

A inicial do Stats mostra as divisões antes dos indicadores gerais, com equipes, jogos, finalizados, ao vivo, fases, próximo confronto e links de classificação próprios. Os indicadores gerais ficam identificados como consolidados. A página inicial de pré-temporada 2027 do portal também separa as equipes por divisão oficial, com links próprios. O histórico de 2026 mantém suas séries antigas.

## Onde estão os jogos de 2027

O print enviado mostrava a prévia dos 145 horários, com o botão Aplicar tabela, fases e chaveamentos ainda disponível. Exibir uma prévia não grava partidas.

Após a implantação, em Stats → Jogos → Adulto Livre 2027, conferir a quadra e clicar **Aplicar tabela, fases e chaveamentos**. Isso cria/reaproveita 122 jogos classificatórios e reserva os 23 horários de pós-temporada. Os jogos devem então aparecer na divisão correspondente. A rotina preserva jogos que já possuem operação e bloqueia divergências em vez de apagá-las.

A prévia agora distingue Divisão, Fase e Rodada. O painel não apresenta 380/190 como tabelas válidas de Elite/Acesso. A gravação do calendário não foi executada remotamente nesta sessão.

## Duplicações reais do Master

A consulta pública ao servidor retornou 22 registros. A comparação de horário, equipes, situação e placar identificou 9 grupos duplicados: 8 com IDs externos e jogos históricos correspondentes, mais o play-in de 31/10. São 13 partidas canônicas nesse conjunto.

Causa confirmada no importador: a procura de um jogo existente era limitada à fase escolhida. Uma partida já cadastrada em outra fase podia ser criada de novo. A procura agora independe da fase, e um jogo com estatísticas, súmula ou outros dados operacionais é preservado e recebe o vínculo externo, sem ser sobrescrito.

A sincronização Master inclui uma reconciliação transacional e auditada:

1. Agrupa somente partidas de mesmo horário exato, mesmas equipes (inclusive lados invertidos), mesma situação e placar equivalente.
2. Prioriza o registro com operação; se houver operação em mais de uma cópia, sinaliza revisão e não arquiva nenhuma delas.
3. Só arquiva uma cópia cuja origem externa seja confirmada e que não tenha eventos, estatísticas, elenco de jogo, arbitragem, assinaturas, relatório, finalização ou mesa iniciada.
4. Mantém o registro no banco como NOT_REQUIRED, com referência ao jogo canônico; não executa DELETE.
5. Acrescenta novos registros de auditoria/mapeamento externo apontando para o jogo canônico, preservando os logs anteriores.
6. As cópias arquivadas deixam a listagem operacional e os contadores de fase; partidas não necessárias de MD3 continuam tendo seu comportamento normal.

**A validação local usando os 22 registros públicos como cenário resultou em 9 cópias arquivadas e 13 partidas preservadas. Os dados operacionais reais não são expostos pela API pública; o número efetivamente arquivado em produção depende da checagem dessas relações no servidor.** Casos ambíguos são exibidos como revisão, não resolvidos por exclusão silenciosa.

Depois de publicar a API, abrir **Stats → Jogos → Liga Master 2026**. A sincronização já é chamada pela tela e passa a executar essa reconciliação antes de atualizar as semifinais. O aviso informa a quantidade arquivada e os casos pendentes. Recarregar o portal após a conclusão. A página pública não executa alterações administrativas por GET.

Também foi removida a repetição visual da seção Finais em destaque na página de jogos: uma partida aparece na lista correspondente à sua situação.

## Validação

- Builds de API, Stats e portal aprovados no Node 22.
- 14 verificações específicas de divisão/fase e totais 56/66.
- 4 verificações de bloqueio do gerador incorreto/confronto entre divisões.
- 32 verificações de calendário, incluindo reaproveitamento das duas fases antigas sem duplicar registros.
- 12 verificações da reconciliação Master 22 → 13, incluindo preservação de operação, proteção de relatórios e divergência de placar.
- 7 verificações de reimportação entre fases sem duplicar nem sobrescrever estatísticas.
- Regressões de inscrição, homologação, identidade, janelas, GoChamps, impedimento de arbitragem e permissões do portal aprovadas.

Não houve deploy ou escrita no banco de produção nesta sessão. A auditoria geral de banco e as limitações de segurança residual documentadas na RC5 permanecem pendentes.

## Implantação

Ordem: **API RC6 → Stats RC6 → Portal RC6**. Manter banco, storage e variáveis privadas existentes. Node 22; build `npm ci && npm run build`; API inicia com `npm run start:prod`, interfaces com `npm run start`. A versão visível do Stats passa a 2.9.0-RC6.

Após publicar: abrir Master 2026 no Stats para executar a reconciliação; abrir Adulto 2027 e aplicar o calendário oficial se ainda estiver somente na prévia. Não trocar o domínio principal durante esta correção.

---

## Registro da auditoria anterior (RC5)

# L3C Stats — auditoria integrada RC5

Data: 13/11/2026. Abrangência: código da API, backoffice Stats e portal público/representante. Esta entrega consolida as correções RC4 e as melhorias de integração preparadas durante a auditoria.

**Estado: validação local concluída para os cenários descritos; homologação e auditoria do banco de produção pendentes. Nenhum deploy, alteração de DNS ou atualização do banco de produção foi executado nesta sessão.**

## Resultado principal

A inconsistência City Reapers/XD envolvia três vínculos diferentes: franquia permanente, identidade esportiva e participação na temporada. A RC5 usa a participação da temporada para nome, escudo e divisão; mantém a franquia para histórico, direitos e limite de inscrições. Alterar uma identidade não deve renomear retroativamente temporadas anteriores.

A consulta atual ao GoChamps confirmou que as duas semifinais do Master foram movidas para a fase `Semi Final`, ID `d7389551-52b1-4f0d-9a52-fef5ddfa5767`. A fase antiga passou a retornar 11 jogos e não continha essas semifinais. O adaptador corrigido consultou todas as fases do torneio e retornou 13 jogos, incluindo Amazonas × Marathon e Ravelli × Clube dos Bagres. Agora o hub descobre as fases pelo torneio, em vez de ficar preso à primeira fase.

## Correções e verificações por fluxo

| Área | Problema ou risco identificado | Resultado no código RC5 | Validação e limite |
|---|---|---|---|
| Franquia e identidade | Nome mais recentemente editado poderia prevalecer sobre a inscrição da temporada | Acessos e portal usam a identidade efetivamente inscrita; franquia é exibida separadamente | Testes de identidade City/XD e exclusão de temporadas privadas |
| Divisão pública | Série histórica poderia aparecer como divisão atual de 2027 | Divisão vem da participação oficial na temporada; sem inferência de Ouro/Prata | Testes de divisão, identidade herdada e ausência de divisão |
| Elenco por temporada | Elenco antigo poderia preencher uma temporada nova vazia | Temporada vazia permanece vazia; vínculos anteriores ficam no histórico | Teste integrado e revisão das consultas públicas |
| Novo atleta | Rota de política de inscrição ausente bloqueava o cadastro | Política e solicitação de cadastro implementadas; cadastro definitivo somente após homologação | 23 cenários HTTP, incluindo aprovação, rejeição, duplicidade e acesso indevido |
| Elenco do representante | Controles de foto/camisa ausentes e retirada bloqueada indevidamente | Foto, camisa, posição e desvinculação preservados da RC4; autorização validada na API | Rotas HTTP exercitadas com armazenamento de foto simulado; upload real ainda depende da configuração do servidor |
| Janela de inscrição | Estado PLANNING não acompanhava automaticamente o período regulamentar | Janelas de novembro e março em Brasília; configuração explícita tem prioridade; temporada encerrada bloqueia retirada | Testes nas fronteiras de abertura/fechamento e em temporadas arquivadas |
| Limite de atletas | Retirada, troca de identidade e homologação poderiam contornar a contagem | Histórico de inscrições ordinárias contado por franquia; retirada não devolve vaga; validação comum na homologação | Testes do limite de 20 e conflito de transações |
| Remoção da temporada | Exclusão física poderia apagar o histórico de inscrições | Participação e vínculos encerrados sem apagar o livro de inscrições | Testes de preservação de histórico e exceções de presença |
| Arbitragem | Cadastros misturados com atletas e comissão | Área própria de arbitragem e redirecionamento das entradas antigas | Build do Stats; 7 cenários de impedimento por vínculo vigente |
| Conflito na arbitragem | Declaração isolada não garantia ausência de vínculo com equipe | Verificação repetida na inscrição, homologação e escala; histórico inativo não gera bloqueio automático | Cenários de atleta, comissão e representante em organizações diferentes |
| Central de acessos | Perfil de transmissão sem ação operacional no portal | Acesso à transmissão pelo portal, com autorização por organização | 16 verificações de temporada/permissões; produção ainda não homologada |
| Hub GoChamps | Jogos agendados poderiam ser interpretados como ao vivo; nomes e relógio ausentes poderiam ser preenchidos indevidamente | Estado normalizado; preserva nomes; relógio/período ausentes ficam indisponíveis | 15 verificações de adaptação para OBS |
| Fases do GoChamps | Consulta fixa à primeira fase deixou de localizar as semifinais | Descoberta das fases pelo torneio Master; seleção rejeita jogos de torneios externos | 9 verificações e consulta real de 13 jogos/2 semifinais |
| Semifinais no Stats | Integração antiga poderia recolocar semifinal na primeira fase | IDs conhecidos direcionados à fase Play Off/Semifinal; importação reaproveita o vínculo externo | Código compilado; escrita no banco real não executada |
| Reimportação | Sincronização poderia duplicar partidas ou sobrescrever operação local | IDs determinísticos, reaproveitamento de mapeamentos e proteção de eventos/finalizações locais | Testes de reaplicação do calendário; concorrência real multi-instância não simulada integralmente |
| Calendário 2027 | Tabela, fases e chaves exigiam lançamentos separados | Aplicação única cria/reutiliza fases e 122 confrontos; mantém 23 horários reservados | 30 verificações do calendário e motor de chaveamento |
| Avanço de fases | Necessidade de geração manual de cada rodada | Verificação periódica avança somente com resultados oficiais suficientes; bloqueios aparecem no status | Simulações completas de Elite e Acesso |
| Final MD3 | Terceiro jogo poderia existir mesmo após 2–0 | Jogos 1 e 2 inicialmente; jogo 3 somente em 1–1 | Cenários de 2–0 e 1–1 |
| Permanência | Automação poderia continuar após revogação de permissão | Permissão do operador revalidada; falha de uma temporada não interrompe as demais | Teste de permissão revogada; criação efetiva em produção pendente |
| Dependências Stats | Consulta npm identificou vulnerabilidade crítica no Next.js | Next atualizado de 15.5.25 para 15.5.29 | Consulta posterior: zero vulnerabilidades reportadas |
| Dependências API | Consulta npm identificou 7 dependências com severidade alta | Atualizações direcionadas de deepmerge-ts, glob, picomatch e tmp | Consulta posterior: zero altas/críticas; permanecem 12 moderadas e 3 baixas |
| Validador legado | Verificação antiga rejeitava páginas que agora delegam a componentes compartilhados | Validador reconhece a arquitetura atual e o redirecionamento de Recordes | Validação estrutural e dos dados históricos passou; isso não substitui testes de uso |

## Calendário oficial 2027

Fonte: `APRESENTAÇÃO - TABELA L3C 2027.pdf`. A designação Ouro do PDF foi associada à Divisão Elite, preservando os códigos esportivos ELITE/ACCESS no Stats.

| Componente | Quantidade/regra |
|---|---|
| Elite classificatória | 8 equipes, 56 jogos, 14 jogos por equipe |
| Acesso classificatória | 12 equipes, 66 jogos, 11 jogos por equipe |
| Classificatória total | 122 jogos |
| Pós-temporada | 23 horários reservados, incluindo terceiros jogos condicionais |
| Julho | Sem jogos na tabela fornecida |
| Restrição de deslocamento | Permuta de horários nas quartas do Acesso quando Guará/Sharks ocupariam o primeiro horário restrito |
| Finais | Todas indicadas como transmissão prevista na conferência da tabela; terceiro jogo condicionado a 1–1 |
| Permanência | 7º geral pós-quartas da Elite × vice do Acesso, no horário reservado |

Para iniciar: no Stats, selecionar Adulto Livre 2027 → Jogos → **Conferir tabela oficial**. Conferir os 20 participantes, suas divisões e a quadra. Selecionar a quadra quando houver mais de uma e conferir novamente. **Aplicar tabela, fases e chaveamentos** faz a aplicação inicial e ativa o acompanhamento periódico.

O sistema não cria equipes fictícias para preencher horários futuros. Os classificados entram nos horários reservados à medida que os resultados oficiais permitem. A API precisa permanecer em execução para o acompanhamento a cada 60 segundos. Empates ou inconsistências que impedem classificação não são resolvidos por escolha arbitrária.

## Hub e Master 2026

O hub pode selecionar jogos de todas as fases do torneio GoChamps Master configurado, inclusive novas fases adicionadas no mesmo torneio. A validação por torneio impede selecionar um jogo externo sem relação com o Master.

Ao abrir Jogos no Master 2026, a sincronização das duas semifinais conhecidas é solicitada. Uma única fase de destino Play Off/Semifinal precisa existir. Mapeamentos ambíguos de equipes são bloqueados; o sistema não escolhe por aproximação.

**Limite importante:** descoberta de jogos para transmissão e importação oficial são fluxos diferentes. Novas finais do GoChamps aparecerão na listagem do hub quando existirem em uma fase do torneio; sua importação automática como resultado/chaveamento oficial ainda exige uma regra de destino definida. Não foi criado um confronto final imaginado nem alterado um placar oficial pela seleção de uma transmissão.

O GoChamps consultado não forneceu relógio/período utilizável para as semifinais agendadas. O overlay não inventa esses valores. A convenção de horário do piloto Master, que envia horário local com sufixo Z, foi preservada em Brasília.

## Testes executados

| Conjunto | Verificações aprovadas |
|---|---:|
| Fluxos integrados de temporada, identidade, janela e inscrição | 43 |
| HTTP de cadastro/homologação e operações de elenco | 23 |
| Calendário, fases, chaveamento e permissão da permanência | 30 |
| Adaptação GoChamps/OBS | 15 |
| Descoberta dinâmica das fases Master | 9 |
| Impedimento da arbitragem por vínculo vigente | 7 |
| Escopo e permissões do portal | 16 |
| **Total** | **143** |

Builds de API, Stats e portal executados no Node 22.23.5. Validação estrutural do portal e configuração local de domínio/API aprovadas. Os testes usam dados isolados e serviços simulados onde indicado; não representam uma operação completa com usuários reais no banco de produção.

Inventário identificado: 33 controladores e 38 serviços na API, 75 páginas de código no Stats, 45 páginas e 19 rotas de API no portal. Inventariar um arquivo não equivale a testar todas as suas combinações. As evidências acima delimitam a cobertura efetivamente demonstrada.

## Pendências para encerrar a auditoria em produção

1. **Banco real:** não há DATABASE_URL configurada neste ambiente. A tentativa de auditoria foi interrompida sem conexão ou alteração. Executar `node scripts/audit-production.cjs` na API implantada, usando o ambiente privado já existente do servidor. O script abre transação somente leitura e não imprime dados pessoais.
2. **Índices e integridade:** confirmar os índices de unicidade de atuação financeira da arbitragem, participação por franquia/temporada e acesso de representante. Conferir atletas ativos em múltiplas equipes, elenco sem participação ativa, equipes sem divisão, duplicidade financeira, limite de 20 e jogos com o mesmo time nos dois lados. Não há evidência suficiente para afirmar que esses erros existem no banco.
3. **Segurança residual API:** a consulta npm ainda aponta 12 moderadas e 3 baixas, incluindo a cadeia NestJS e ferramentas de build. A atualização principal de NestJS/Express requer uma entrega própria de compatibilidade e regressão; não foi aplicada silenciosamente neste pacote. A API não deve ser descrita como livre de vulnerabilidades.
4. **Operação real:** homologar um cadastro, foto, camisa, retirada, rejeição e acesso sem permissão com contas de teste no servidor. Validar storage real, sessão, status do schema e o comportamento da automação com os registros existentes.
5. **Mesa offline/sincronização:** retomada após queda, conflito entre dispositivos, partida suspensa/retomada, assinaturas e auditoria pós-jogo precisam de ensaio operacional dedicado. Não foram certificados nesta execução.
6. **Financeiro:** conciliação, estornos, fechamento/reabertura e DRE foram incluídos na revisão de estrutura/permissões, mas não tiveram liquidação real ou conciliação bancária executadas. Manter essas verificações pendentes, sem declarar homologação financeira completa.
7. **Presença/elegibilidade:** o código existente mantém as regras 25%/50%/70% e bloqueio de playoff, mas a aplicação sobre a base real e exceções regulamentares precisa ser confrontada com os registros oficiais. Não foi substituída a regra por cálculo estimado.
8. **Transmissão:** testar a URL OBS e o painel autenticado com o produtor. Listagem externa foi verificada; vídeo/narração e credenciais do canal não são criados pela API esportiva.

## Implantação da RC5

Os pacotes são uma versão integrada para homologação, contendo as correções RC4. Ordem: **API → Stats → Portal**. Manter os três ambientes na mesma entrega para evitar botões novos apontando para API antiga.

| Pacote | Aplicação |
|---|---|
| L3C_API_Auditoria_20261113_RC5.zip | api-stats.liga3colinas.com.br |
| L3C_Stats_Auditoria_20261113_RC5.zip | stats.liga3colinas.com.br |
| L3C_Portal_Auditoria_20261113_RC5.zip | liga3colinas.com.br |

Preservar banco, variáveis privadas e armazenamento atuais. Node 22. Build `npm ci && npm run build`. API inicia com `npm run start:prod`; interfaces com `npm run start`, conforme configuração atual da Hostinger. Não enviar node_modules, dist ou .next como fonte; os pacotes já os excluem.

Antes da ativação operacional, conferir o status do schema e o diagnóstico somente leitura. Nenhum script destrutivo, reset de banco ou recarga de seed faz parte desta implantação. Em caso de incompatibilidade, retornar ao pacote anterior sem apagar o banco. As importações do calendário só ocorrem ao aplicar a tabela; a sincronização do Master só deve ser acionada no ambiente correto.

## Migração para liga3colinas.com.br

O código foi preparado para origem canônica configurável, CORS dos domínios envolvidos, logout no domínio atual e redirecionamento opcional do host antigo. Nenhuma troca de domínio foi realizada.

Sequência prevista: homologar RC5 em `novo` → preservar backup do WordPress, uploads, banco e integrações atuais → confirmar domínio/SSL e variáveis da aplicação principal na Hostinger → configurar NEXT_PUBLIC_SITE_URL e a API independente → validar login, páginas, sitemap, links de mídia, representante e transmissão no domínio principal → ativar redirecionamento do domínio novo. Manter um caminho de retorno durante a troca.

O verificador `portal/scripts/check-migration.mjs` valida a configuração local; `--online` verifica as rotas no domínio indicado. A verificação local passou; o corte de DNS, cookies no domínio principal, migração editorial e funcionamento das integrações WordPress após a troca continuam pendentes. Não remover o WordPress antes de validar os serviços que ele ainda atende.

## Critério de conclusão

A auditoria geral só poderá ser encerrada como **sistema homologado em produção** após resolver os itens de banco, compatibilidade residual e operação real acima. Esta RC5 entrega correções verificadas e os instrumentos para essa etapa; não constitui declaração de que todas as telas, todos os dados e todas as situações possíveis foram certificados.
