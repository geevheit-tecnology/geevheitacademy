# Configuração Firebase

1. Crie ou selecione um projeto no console Firebase, mantendo Spark; não habilite faturamento.
2. Cadastre aplicativo Web e copie a configuração pública para `.env.local`, conforme `.env.example`.
3. Ative Authentication → E-mail/senha. Adicione localhost e o domínio Vercel em domínios autorizados.
4. Crie Firestore em modo produção. Escolha a região de acordo com o público e as políticas da empresa.
5. Execute `firebase login` e `firebase deploy --only firestore:rules,firestore:indexes --project SEU_ID`.
6. Configure as mesmas seis variáveis VITE_FIREBASE_* na Vercel e faça novo build.
7. Opcional: cadastre reCAPTCHA v3 no App Check e preencha VITE_FIREBASE_APPCHECK_SITE_KEY. Só ative enforcement após conferir métricas de solicitações válidas.
8. Teste cadastro, recuperação, logout, login após recarregar e retomada da missão em outro computador.

Não colocar service account ou chave administrativa no frontend. Configuração pública Firebase não substitui regras privadas. API key Web é pública por desenho do SDK; restrições devem ser revisadas no console.

Sincronização: apenas ações importantes geram gravação; não há listeners de animação. Revisão otimista validada em transação, que usa a política de repetição do SDK. Falhas mantêm rascunho por UID no navegador; reenvio e descarte explícitos, sem sobrescrever revisão remota. Não há autenticação local alternativa. Listagem inicial limitada a 30 missões em andamento; histórico paginado em dez e operação aberta por ID. Rascunhos não são backup: limpar o navegador remove esse apoio temporário.

Monitore Usage/quotas no console. Quotas, elegibilidade e condições podem mudar; consulte documentação oficial antes de estimar capacidade. Leituras, transações e repetição consomem cota. App Check é complementar. Nenhuma ativação Blaze é feita por este projeto.

Cotas gratuitas documentadas em 14/10/2026: 1 GiB armazenado, 50.000 leituras/dia, 20.000 gravações/dia, 20.000 exclusões/dia e 10 GiB de saída/mês, para um banco elegível por projeto. Fonte: https://firebase.google.com/docs/firestore/quotas . Não se trata de cota por usuário nem de gratuidade ilimitada.
Referência de sessão oficial: https://firebase.google.com/docs/auth/web/manage-users .
