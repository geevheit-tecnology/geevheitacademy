# Central do administrador geral

A central `/admin` pertence exclusivamente a `getuliopedromoreirafilho@gmail.com`. O Firebase exige o e-mail da conta autenticada e a permissão `admins/UID` com `granted: true`; o navegador não concede essa permissão. A conta foi novamente localizada e sua permissão confirmada por leitura do Firebase em 28/10/2026. Nenhuma senha do proprietário foi acessada ou alterada.

Ao entrar pelo login padrão com a conta do proprietário, o aplicativo encaminha para a central. Um destino explicitamente solicitado, como uma missão ou assinatura, é preservado. Outras contas não entram na administração, mesmo que tenham um documento de permissão com outro e-mail.

## O que controlar

- **Visão geral:** total de cadastros, pedidos pendentes, pagamentos aprovados e cancelamentos. Os indicadores usam contagem no servidor e são atualizados pelo botão da central.
- **Alunos e acessos:** busca por e-mail exato e páginas de 25 cadastros, com datas de teste, pagamento e liberação administrativa. A liberação manual cria um período a partir do momento da ação e não registra pagamento. Bloqueio impede os treinamentos mesmo com assinatura vigente; desbloqueio preserva as datas existentes. Remover a liberação manual mantém eventual teste ou período pago. O motivo de cada alteração fica registrado.
- **Plano e Pix:** nome, valor, duração em dias, chave Pix, favorecido e ativação da contratação. O proprietário precisa definir esses dados antes de vender; não foram inventados valores comerciais ou dados bancários.
- **Pagamentos:** até 100 pendências na primeira visão, conferência manual no extrato, aprovação/rejeição e histórico paginado. Aprovação soma o período contratado ao acesso pago vigente. O sistema não consulta extrato bancário automaticamente.
- **Histórico administrativo:** registros imutáveis de alterações de acesso, plano, manutenção e revisão de pagamento, com autor e horário do servidor.
- **Controles gerais:** e-mail de suporte e pausa dos treinamentos para manutenção. Alunos continuam acessando a conta e a assinatura; a conta administrativa permanece liberada.

O acesso do proprietário não depende de teste ou assinatura e não pode ser bloqueado pelos controles de alunos. As restrições também são aplicadas nas gravações do Firestore, além da interface. Nenhuma função do painel permite promover outros administradores.

A lista representa os perfis cadastrados na plataforma. Senhas e administração da infraestrutura Firebase/Vercel não são expostas ao navegador. As missões e os resultados detalhados continuam privados ao aluno nas regras existentes.

## Publicação e verificação

Mudanças na interface e nas regras devem ser publicadas de forma coordenada. A autenticação real e a permissão do proprietário já existem, mas o painel novo precisa da versão atual do cliente e das novas regras para funcionar no ambiente publicado. Conferir build, testes de regras, navegação no navegador, controles de alunos, pagamentos, manutenção, auditoria e responsividade antes da publicação.


Publicação concluída em 28/10/2026: https://geevheitacademy.vercel.app/admin . Vercel `dpl_5WSh6Pb4NaurwXm9FhDTftNQmAZj`, produção READY e domínio principal resolvendo para essa versão por consulta à API da Vercel/CLI. O Firebase confirmou `adminGranted`, `emailSignInEnabled`, `primaryDomainAuthorized` e `firestoreRulesMatchLocal`. A senha real do proprietário não foi solicitada nem usada nos testes. Os fluxos autenticados completos foram exercidos em emuladores locais com contas de teste; o primeiro recebimento bancário real depende da configuração e conferência pelo proprietário.

O fluxo de sair e entrar novamente pelo login padrão, com encaminhamento direto a `/admin`, também passou no navegador com conta de proprietário emulada.
