# Segurança de persistência

Regras versionadas em firestore.rules negam acesso sem autenticação, isolam UID, validam chaves, tipos e limites dos parâmetros, preservam criação e input da missão e exigem revisão crescente. Missões concluídas não aceitam update. Resultados e histórico são criados junto à conclusão usando getAfter, sem updates posteriores. Subcoleções desconhecidas são negadas.

Limites: conteúdo interno de cada ocorrência/checklist e cada métrica financeira não é integralmente validado em rules; são dados de treinamento do próprio usuário. O domínio valida operações normais da interface, mas clientes modificados podem forjar seu resultado. Para certificações e resultados confiáveis, adicionar validação autoritativa em integração futura. Não tratar pontuação como prova antifraude.

Execute `npm run test:rules -- --project demo-transportsim360` conforme TEST_PLAN (ou comando Firebase explícito). Testes nunca apontam para banco real. Publique regras antes de expor dados privados. App Check não substitui rules.
