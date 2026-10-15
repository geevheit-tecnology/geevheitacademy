# Arquitetura

React → useMissionSync → contrato MissionRepository → Firestore.
ServicesProvider injeta o contrato na raiz; telas usam useMissionRepository sem instanciar infraestrutura. useMissionSync concentra concorrência, cache temporário e estados de sincronização. As páginas do painel estão separadas em src/pages/workspace.
O domínio contém funções puras e não importa React/Firebase. Repositórios implementam persistência, enquanto a interface depende de contratos. Autenticação usa exclusivamente onAuthStateChanged do SDK oficial. Componentes compõem telas sem herança.

SOLID: responsabilidades separadas, estratégias de rota compostas por parâmetros, contrato substituível de repositório, interfaces pequenas e dependência do contrato. Missões usam schemaVersion=1 e revision incremental; transações rejeitam revisão obsoleta. Conclusão grava missão, resultado e histórico atomicamente. Falhas preservam rascunho temporário por UID e exigem reconciliação explícita.
