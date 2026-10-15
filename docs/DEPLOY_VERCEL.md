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
