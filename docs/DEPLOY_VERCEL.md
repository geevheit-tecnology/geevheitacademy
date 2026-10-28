# Publicação

Projeto Firebase exclusivo: transportsim360-academy. App Web: 1:840394415853:web:e24ef645520b9ce41236e4. Firestore padrão em southamerica-east1, Standard, freeTier=true, sem PITR ou faturamento habilitado pelo agente. Regras e índice composto publicados com sucesso.

Projeto Vercel: geevheits-projects/geevheitacademy. Arquivo vercel.json configura build Vite, saída dist e fallback SPA.

## Reproduzir

1. `npm ci`.
2. Configurar `.env.local` usando `.env.example` e aplicativo Firebase Web.
3. `npm test`; `npm run test:rules`; `npm run build`.
4. `vercel link -y --scope geevheits-projects`.
5. `node scripts/deploy-preview.cjs`: passa a configuração pública Firebase ao build de preview sem credenciais administrativas. Para deploy pelo GitHub, configure as mesmas variáveis no painel Vercel.
6. Autorizar o hostname exato retornado na configuração Authentication. O script configure-firebase.cjs usa a sessão oficial local do Firebase CLI em memória e não exporta token.
7. Testar cadastro, sessão, missões e relatórios. Não há deploy de Cloud Functions ou backend próprio.

O assistente CLI de variáveis preview retornou git_branch_required mesmo omitindo branch; o script de deploy usa --build-env explicitamente. Não há GitHub remoto definido neste diretório. Integração contínua via GitHub requer escolha do repositório pelo proprietário.

Preview final confirmado READY em 15/10/2026: https://geevheitacademy-l8369xwad-geevheits-projects.vercel.app . Deployment dpl_9dFSJuSFni39yKFDjzqkSm9GKpdr. Build remoto TypeScript/Vite concluído. Esta é a versão final validada; a URL estável inicial corresponde ao primeiro build.

Authentication iniciado pelo proprietário no console e confirmado via API: signIn.email.enabled=true e passwordRequired=true. Domínios autorizados incluem localhost, Firebase Hosting e geevheitacademy.vercel.app. Publicação inicial confirmada READY em https://geevheitacademy.vercel.app (deployment dpl_ECsDqEyyMkhVydJM6gfPmuHDvCXc). A CLI tratou o primeiro deploy sem target como produção; os próximos usam --target preview explicitamente.

Revisão de mapas publicada em 15/10/2026, READY: https://geevheitacademy-pc3hiy1n5-geevheits-projects.vercel.app . Deployment dpl_9Vs7gRWLo3xErtw1PEEfTdSGCJSp. Inclui Leaflet/OSM, IBGE/Photon/OSRM, trechos e cards de orientação. Este preview substitui o anterior como versão de revisão atual.

Toolbar removida no projeto por API oficial Vercel: enablePreviewFeedback=false e enableProductionFeedback=false, confirmados por leitura após PATCH. Nenhuma alteração em outros projetos ou na equipe. Referência: https://vercel.com/docs/vercel-toolbar/managing-toolbar . Script reprodutível: scripts/disable-toolbar.cjs.

Revisão de movimento por etapas e perfil publicada READY em 15/10/2026: https://geevheitacademy-iaewjw3jl-geevheits-projects.vercel.app . Deployment dpl_J6QKPd8P8pm215PhjW3zr6FAeKn1. Toolbar desligada no projeto para preview/produção. Build remoto aprovado.

Layout operacional compacto publicado READY em 15/10/2026: https://geevheitacademy-21ulx82ax-geevheits-projects.vercel.app . Deployment dpl_9KXCq7RHx33Ewg1Cqj9tdnQDBt1u. Build remoto aprovado.

Explicações transitórias de etapa publicadas READY: https://geevheitacademy-ddlgt6puh-geevheits-projects.vercel.app . Deployment dpl_13wXcNdJphF2pfnfWPyGZ6uKRKX3. Build remoto aprovado e comportamento validado no Chrome local.


## Central geral e correcao.md — 28/10/2026

Publicação de produção autorizada pelo proprietário nesta sessão. Build enviado pela CLI a partir da cópia de trabalho, com configuração pública Firebase validada para `transportsim360-academy`. Não houve commit ou push pelo agente.

- Produção: https://geevheitacademy.vercel.app ; central: https://geevheitacademy.vercel.app/admin .
- Deployment: `dpl_5WSh6Pb4NaurwXm9FhDTftNQmAZj`, `target=production`, `READY`.
- URL da versão: https://geevheitacademy-ndt3ybhqh-geevheits-projects.vercel.app .
- Sequência: `node scripts/deploy-release.cjs --production --hold-domains`, publicação de `firestore:rules` no projeto autorizado e `vercel promote` da versão READY. Consulta `vercel inspect geevheitacademy.vercel.app` confirmou o mesmo deployment.
- Ruleset ativo: `projects/transportsim360-academy/rulesets/07779836-8eda-474b-be3a-1e3e3ae7868c`. SHA-256 do conteúdo canônico: `908910d42f74b63a8e9f60bb8698534c929048ae32b28f35e2abcd9355564f19`.
- Verificação por leitura: proprietário habilitado, login e-mail/senha ativo, domínio principal autorizado e regras ativas idênticas às locais.
- Validação local: build aprovado, 31 testes da aplicação, 14 de regras e três fluxos de navegador (modos/dificuldades, 40 processos/negociação, central/Pix/cancelamento/manutenção/auditoria). Responsividade exercida por viewport de celular no Chrome.
- Evidência estruturada: `docs/qa/admin-production-verification.json`; capturas da central em `docs/qa/admin-general-*.png`.

Os valores comerciais e a chave Pix devem ser definidos pelo proprietário em Plano e Pix. Pagamentos reais não foram feitos pelo agente. A senha real do proprietário não foi usada; a autenticação/autorizações publicadas foram conferidas pelas APIs e o fluxo autenticado foi validado em emuladores.
