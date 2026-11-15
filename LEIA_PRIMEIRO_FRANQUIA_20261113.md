Atualização do painel da equipe — 13/11/2026

Publicar este pacote no aplicativo Node do portal liga3colinas.com.br pelo mesmo processo da versão anterior. Executar npm ci e npm run build antes de reiniciar. Não requer alteração da API nem migração do banco.

O painel mantém a identidade da participação selecionada e exibe o nome institucional (internalName) e o código permanente (code) da franquia fornecidos pela API. Não deduz a franquia a partir do nome da equipe. Caso o nome institucional esteja incorreto, revisar o cadastro da franquia no Stats.

Validação: conferência dos campos no contrato da API e verificações estáticas do arquivo alterado. O validador legado do projeto apresenta erros de arquitetura em páginas não alteradas. Build e validação autenticada no navegador não executados neste ambiente.
