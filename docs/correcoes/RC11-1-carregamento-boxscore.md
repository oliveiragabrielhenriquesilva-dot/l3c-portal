# Correções RC11.1 — revisão antes do deploy

**Base:** `L3C_Portal_Abertura_2027_20261113_RC11.zip`  
**Pacote preparado:** `L3C_Portal_RC11_1_Correcao_Carregamento_Estatisticas.zip`

Este PR documenta as alterações já preparadas, mas **não é o código completo nem deve ser implantado**. Primeiro importar e validar o snapshot do portal que está efetivamente em produção.

## Arquivos alterados
- `app/loading.js`: retorna `null` em vez de mostrar uma tela centralizada "Carregando página..."; erros continuam tratados em `app/error.js`.
- `app/event/[slug]/page.js`: só exibe totais de equipes quando existe `data.boxScore`; quando ausente, mostra "Dados aguardando sincronização" e não sugere que existe box score oficial.

## Validações obrigatórias
- Confirmar que o portal implantado corresponde ao pacote RC11.
- Testar home 2027, Elite/Acesso, Master Amazonas × Marathon e páginas de partidas.
- Confirmar que a ausência de estatísticas não produz zeros falsos.
- Não alterar domínio, DNS, banco, GoChamps, API ou Hostinger neste PR.
- Não habilitar deploy automático até o código completo estar versionado e testado.

## Limites
A correção não importa estatísticas do GoChamps; isso depende da API e da validação do mapeamento dos jogos.
