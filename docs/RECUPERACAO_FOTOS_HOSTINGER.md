# Recuperacao provisoria de fotos — Liga 3 Colinas

## Objetivo
Exibir imagens recuperadas manualmente durante restricao do Supabase Storage, sem alterar IDs de atletas nem destruir suas URLs originais na API/banco.

## Requisitos antes de habilitar qualquer mapeamento
1. Dispor da foto original com autorizacao de uso.
2. Hospedar a foto em diretorio publico persistente da Hostinger, **fora da pasta de build efemera**, com acesso HTTPS confirmado. Exemplo de URL desejada: https://liga3colinas.com.br/l3c-media/2027/players/ID_DO_ATLETA/profile.jpg
3. Abrir a URL da imagem em uma aba anonima e verificar que a imagem realmente aparece (HTTP 200 com Content-Type image/jpeg, image/png ou image/webp).
4. Somente apos testar a URL, acrescentar a entrada correspondente no `lib/local-photo-overrides.js`, por exemplo:
   `'l3cstats-player-photos/l3c_org_liga3colinas/ID_DO_ATLETA/profile':'/l3c-media/2027/players/ID_DO_ATLETA/profile.jpg'`.
5. Fazer deploy do portal, verificar a foto em /team/... e /player/..., em desktop e celular.

O caminho acima e **um exemplo**, nao uma afirmacao de que a pasta esta publica na Hostinger. Nao criar mapeamento antes de validar.

## Caracteristicas da correcao
- Mantem as URLs originais no Supabase; substitui somente na exibicao do portal publico.
- O parametro `?v=...` da URL antiga e ignorado na associacao pela chave do objeto.
- Imagens antigas WordPress continuam sendo tratadas como antes.
- Mapeamentos inexistentes deixam o endereco original inalterado.
- Para imagem nova, adicionar **novo mapeamento** e nao apagar o anterior se for necessario restaurar.
- Nao altera upload pelo painel Stats/representante, nem imagens usadas diretamente pela API ou outros dominios: esses fluxos requerem alteracoes na API e testes separados.

## Recuperacao definitiva
Quando o projeto Supabase for liberado:
- Exportar buckets e dados com backup e checksum, sem excluir os originais.
- Conferir vinculacao de cada foto ao ID do atleta.
- Adicionar armazenamento persistente de uploads do L3C Stats e atualizar URLs na API de forma planejada, com rollback.
- Evitar que futuros deploys apaguem as fotos locais. Manter uma copia externa separada.

Nao fazer UPDATE massivo no banco e nao criar novos cadastros para corrigir fotos.
