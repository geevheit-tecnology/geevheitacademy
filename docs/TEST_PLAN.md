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
