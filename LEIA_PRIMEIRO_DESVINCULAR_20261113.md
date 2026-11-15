Desvincular jogador — painel do representante

Em Elenco, o botão Desvincular jogador fica disponível durante o período de inscrições. Solicita confirmação, encerra apenas o vínculo da temporada e mantém cadastro e histórico. A API valida o acesso à franquia, equipe, temporada e período, mesmo em requisição direta.

Publicar o portal e a API. A implementação já estava presente nos pacotes anteriores; esta atualização explicita o botão no portal e inclui as instruções de configuração.

O período é reconhecido pelo status REGISTRATION_OPEN da temporada. Uma janela com datas, quando configurada, tem prioridade. Pode ser definida em season.preSeason.teamPortalRosterReleaseWindow com startsAt e endsAt em ISO 8601 com fuso explícito. Alternativamente, na API, definir L3C_ROSTER_RELEASE_SEASON_ID, L3C_ROSTER_RELEASE_START_AT e L3C_ROSTER_RELEASE_END_AT. Não foram inventadas nem alteradas datas nesta atualização.

Validação: sete verificações da lógica de janela passaram (aberta por status, bloqueada em ACTIVE/PLANNING, período vigente/futuro/encerrado e datas invertidas). Não foi executado build nem teste autenticado contra o banco publicado. O validador legado do portal tem falhas preexistentes em outras páginas.
