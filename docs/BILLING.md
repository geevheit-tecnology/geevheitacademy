# Assinaturas e Pix manual

A área `/admin` permite configurar um plano: nome, valor em reais, duração em dias, chave Pix e favorecido. A cobrança inicia desativada. Criar e atualizar missões exige teste gratuito, período pago ou liberação administrativa vigente; os registros anteriores permanecem disponíveis. O aluno acessa `/app/assinatura`, copia a chave e informa que pagou. Não há débito automático ou confirmação bancária automática.

Confira o extrato, valor, identidade do pagador e solicitação antes de confirmar. A transação confirma o pedido uma única vez e soma os dias ao acesso ainda vigente, ou inicia o período na confirmação. Rejeite pedidos sem recebimento. Valores e duração ficam registrados no pedido e não mudam quando o preço do plano muda.

## Conceder o primeiro acesso administrativo

1. O responsável cria sua conta normalmente na plataforma.
2. Um proprietário autorizado do projeto Firebase identifica o UID da conta exclusiva `getuliopedromoreirafilho@gmail.com` em Authentication e cria, pelo console confiável, o documento `admins/UID` com `granted: true`.
3. Acesse `/admin` com essa conta. Usuários não podem conceder a si mesmos essa permissão. Outros e-mails não recebem acesso mesmo com documento de permissão. Remover o documento revoga acesso nas regras.

Não use e-mail ou variável pública como autorização. O painel mostra o UID da conta quando não há permissão, para facilitar a configuração pelo proprietário do Firebase.

## Publicação

Publique `firestore.rules` junto da aplicação antes de habilitar vendas. As regras protegem preços, pedidos, assinaturas e permissões no servidor. Regras e aplicação foram publicadas em 28/10/2026, com permissão do proprietário e versão READY confirmadas conforme `DEPLOY_VERCEL.md`. O plano é por período fixo em dias, com renovação manual por Pix. Não equivale a mês-calendário.

O painel também pode receber a primeira permissão pelo script administrativo existente: `FIREBASE_CLI_ROOT=/caminho/firebase-tools node scripts/configure-firebase.cjs grant-admin EMAIL`. Exige sessão CLI autorizada no projeto `transportsim360-academy` e conta já cadastrada. Não cria usuário nem envia mensagens.

Validação local: `npm run build`, `npm test`, `npm run test:rules`. Fluxo de navegador: `firebase emulators:exec --only auth,firestore --project demo-transportsim360 'node scripts/billing-qa.mjs'`. As contas, preços e permissões criadas pelo teste ficam exclusivamente nos emuladores. O teste usa o Chrome local indicado no script.
