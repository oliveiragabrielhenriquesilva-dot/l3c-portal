# RC5 — Auditoria integrada L3C

Entrega para homologação. Inclui as correções RC4 do representante.

Ordem de implantação: API (api-stats) → Stats (stats) → Portal (novo).
Node 22. Build: npm ci && npm run build.
API: npm run start:prod. Interfaces: npm run start.
Preservar as variáveis privadas, banco e storage do servidor.
Não trocar o domínio principal nesta implantação.

Na API, executar node scripts/audit-production.cjs com o ambiente privado já configurado. A verificação é somente leitura e não realiza reparos.
No Stats, a aplicação da tabela 2027 exige conferência dos participantes/divisões e da quadra, antes de ativar o acompanhamento automático.
No Master, as fases externas agora são descobertas pelo torneio GoChamps; a importação oficial automática foi definida para as duas semifinais conhecidas.

Ler AUDITORIA_GERAL_RC5.md para evidências, limites, segurança residual e pendências de homologação.
