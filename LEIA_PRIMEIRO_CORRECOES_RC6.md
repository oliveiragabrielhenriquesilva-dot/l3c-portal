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

