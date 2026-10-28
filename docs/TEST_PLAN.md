# Validação

Executado entre 14 e 15/10/2026 (America/Sao_Paulo), Node 24.13.1.

- `npm test`: 14 testes aprovados em domínio, proteção de rota e contrato de persistência. Cobre combustível, pedágio, custo, margem, entrada inválida, rotas distintas, jornada sem duplicação, vinte transições, bloqueio por pane, resolução idempotente, pontuação, conflito de revisão, gravação de resultado/histórico e falha de conexão. O teste do hook verifica preservação de rascunho e limpeza apenas após confirmação remota.
- `npm run test:rules`: 3 testes aprovados no Firestore Emulator Suite com Java 25. Testa usuário não autenticado, UID alheio, perfil com campos extras, revisão inválida, parâmetro inválido e gravação válida. Projeto usado: demo-transportsim360, sem banco real.
- `npm run build`: TypeScript estrito e bundle de produção aprovados.
- Auditoria npm após atualização Vitest e override compatível grpc-js: zero vulnerabilidades reportadas.
- Chrome headless real: landing, login e ajuda em viewport 390×844 sem overflow; screenshot desktop 1440×1000 em docs/qa. Teste de cadastro bloqueado inicialmente por auth/configuration-not-found no projeto externo, não declarado aprovado.

Automação ponta a ponta em `scripts/browser-qa.mjs`: usa Firebase real, conta temporária, vinte etapas, ocorrência, histórico em segunda sessão, logout e limpeza da conta/dados em finally. Não envia e-mails. Requer servidor local `npm run dev`, Firebase configurado e Chromium local (ajustar executablePath para seu ambiente). Executar `node scripts/browser-qa.mjs` com acesso à rede.

Pendente: recuperação de senha com recebimento de e-mail; navegador em dispositivos físicos. Segunda sessão de navegador testa independência de contexto, não substitui teste em dois dispositivos físicos.

O teste ponta a ponta completo também passou com emuladores oficiais Authentication/Firestore: cadastro via SDK, recarga de sessão, pane/resolução, vinte etapas, resultado 92/100, histórico em segundo contexto independente, logout e remoção dos dados sintéticos. Durante essa validação foi corrigida a atualização visual imediata dos checkboxes: a interface confirma a marcação enquanto sincroniza e reverte em caso de falha, preservando o rascunho.

Para reproduzir: `firebase emulators:exec --only auth,firestore --project demo-transportsim360 'node scripts/browser-emulator-suite.cjs'`. Conexões de emulador só são habilitadas em modo DEV; não entram no comportamento do build publicado.

## Firebase real confirmado

Após o proprietário iniciar Authentication, a API confirmou emailEnabled=true. `node scripts/browser-qa.mjs` terminou com sucesso no Chrome contra transportsim360-academy: cadastro, sessão após reload, ocorrência/resolução, vinte etapas, relatório 92/100, histórico e retomada em contexto independente, logout e zero erros JavaScript. Conta e documentos temporários removidos ao final. O teste usou servidor local com SDK apontando para a nuvem real; não visitou a URL Vercel. Capturas em docs/qa incluem resultado desktop e operação mobile.

## Atualização de mapas e trechos — 15/10/2026

`npm test`: 18 testes aprovados, incluindo interpolação geográfica, progressão ponderada dos trechos, seleção da geometria retornada pela API, bloqueio por pane e proibição de concluir viagem incompleta. `npm run test:rules`: quatro testes aprovados, incluindo persistência de routePlan, limite de progresso e bloqueio de alteração de percurso após saída. Build TypeScript/Vite aprovado com Leaflet separado em bundle próprio.

Teste Chrome com APIs reais e Firebase aprovado: seleção de RJ/Resende via IBGE; geocodificação Photon; percurso São Paulo–Resende–Rio via OSRM; aplicação de distância ao orçamento; dois trechos percorridos; cards verificados nas vinte etapas; resultado/histórico em segundo contexto; logout. Nenhum erro JavaScript e nenhum overflow no celular. Conta e missão temporárias removidas. Captura do mapa e dos cards em docs/qa/road-map-truck.png.

## Movimento por etapa e perfil

19 testes locais e build aprovados. Regressões verificam que Transporte não chega ao destino, que o avanço de etapa não teleporta o caminhão, que os incrementos são de até 10%, que manutenção exige liberação e que missões antigas são normalizadas. Perfil removeu o UID e a referência ao provedor de autenticação.

Fluxo completo Chrome/Firebase real aprovado após a revisão: movimento gradual nas quatro etapas, vinte checklists, inspeção antes da continuação, resultado/histórico e perfil sem Firebase/Authentication/UID. Conta e dados sintéticos removidos. Capturas em docs/qa/travel-stage-9.png e travel-stage-12.png.

Layout compacto validado em Chrome 1366×768 e 390×844: fluxo completo e checagens geométricas confirmaram que o canvas do mapa permanece dentro da viewport ao avançar a viagem no desktop e ao rolar até o checklist no celular. Build TypeScript/Vite aprovado. Não houve mudança de cálculos ou regras de negócio. Conta e documentos temporários removidos.

Explicação temporária validada no Chrome: aparece após cada avanço salvo, desaparece automaticamente (checagem com timeout de 7 segundos para timer de 5), reabre por Explicação rápida e fecha pelo X. Fluxo completo, perfil, mapa visível e limpeza dos dados de QA aprovados. Build TypeScript/Vite aprovado.


## 28/10/2026 — correcao.md e administrador geral

- Build TypeScript/Vite aprovado; 31 testes da aplicação e 14 de regras aprovados.
- Navegador com emuladores: landing animada/pausa, manual, teste gratuito, comercial avançado com desafios e cálculo de preço, transporte em 10 etapas e ciclo completo com 40 etapas e negociação.
- Central: exclusividade do proprietário, conta de aluno rejeitada no admin, aprovação Pix, cancelamento/reativação, liberação por prazo, bloqueio/desbloqueio, manutenção, auditoria e celular sem overflow.
- Autenticação: proprietário sai, abre o login padrão e entra novamente, sendo encaminhado diretamente a `/admin`; o teste usa senha fictícia somente no emulador.
- Produção: Vercel READY e domínio principal resolvendo para a versão promovida; Firebase confirmou permissão do proprietário, login e-mail/senha, domínio autorizado e hash idêntico das regras ativas. Evidência: `docs/qa/admin-production-verification.json` e `DEPLOY_VERCEL.md`.
- Não houve pagamento bancário real nem uso da senha real do proprietário. Configuração comercial e primeira conferência bancária permanecem sob controle do proprietário na central.
