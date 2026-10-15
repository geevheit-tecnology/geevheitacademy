# TransportSim 360

Simulador educacional React + TypeScript estrito + Vite + Firebase. Escopo original em `sprit001`.

## Executar

Use Node 22+ e npm. `npm ci`, copie `.env.example` para `.env.local`, configure Firebase, execute `npm run dev`. `npm test` verifica domínio e interface; `npm run build` faz typecheck e produção. Consulte `docs/FIREBASE_SETUP.md` antes de testar a nuvem.

Sem configuração Firebase, landing e ajuda funcionam; autenticação e missões privadas permanecem indisponíveis. Não existe login fictício nem persistência local usada como substituto da nuvem.

## Organização

`src/domain`: cálculos e máquina de estados puros. `src/repositories`: contrato e implementação Firestore. `src/services`: infraestrutura. `src/features/auth`: sessão, serviço e guarda. `src/components`: mapa ilustrativo. `src/pages`: interface e composição dos fluxos. `src/styles`: design responsivo.

## Documentação

PRD, TASKS, ARCHITECTURE, DESIGN_SYSTEM, BUSINESS_RULES, FIREBASE_SETUP, FIRESTORE_SECURITY, TEST_PLAN, DEPLOY_VERCEL e FUTURE_INTEGRATIONS em `docs/`. A evidência de testes e o estado externo constam nos respectivos documentos. Foram aprovados 19 testes locais, 4 testes de regras e o fluxo completo no navegador contra Firebase real.

Documentos, valores e rotas são demonstrativos. Não há rastreamento real ou emissão fiscal. Regras educativas de jornada não certificam conformidade legal.

Preview final: https://geevheitacademy-ddlgt6puh-geevheits-projects.vercel.app

Mapas e trechos: consulte docs/MAPS_AND_ROUTES.md. Origem/destino e pontos intermediários são configuráveis; caminhão percorre os trechos na etapa Transporte, com cards explicativos em cada passo.
