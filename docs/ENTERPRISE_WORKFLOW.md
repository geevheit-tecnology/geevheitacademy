# Simulação de uma transportadora — 40 processos

Novas missões usam `schemaVersion: 2`. Missões existentes com `schemaVersion: 1` conservam os 20 passos e a numeração dos checklists, sem migração silenciosa.

Cada etapa possui equipe responsável, orientação, consequência, checklist e registro próprio com dados obrigatórios. O resultado e a exportação JSON incluem os registros salvos; a retomada em outro navegador usa a missão persistida no Firestore.

| Etapa | Processo | Área responsável |
| --- | --- | --- |
| 1 | Captação do cliente | Comercial |
| 2 | Qualificação da oportunidade | Comercial |
| 3 | Cadastro do cliente | Cadastro |
| 4 | Levantamento da carga | Comercial e operações |
| 5 | Viabilidade operacional | Planejamento |
| 6 | Planejamento da rota | Roteirização |
| 7 | Composição dos custos | Custos |
| 8 | Formação do preço | Precificação |
| 9 | Envio da proposta | Comercial |
| 10 | Negociação e aceite do preço | Comercial |
| 11 | Análise de crédito | Crédito e cobrança |
| 12 | Contrato e nível de serviço | Contratos |
| 13 | Ordem de transporte | Programação |
| 14 | Dimensionamento da frota | Frota |
| 15 | Alocação do veículo | Frota |
| 16 | Manutenção preventiva | Manutenção |
| 17 | Motorista e jornada | Gestão de motoristas |
| 18 | Gerenciamento de risco e seguro | Risco |
| 19 | Agendamento da coleta | Agendamento |
| 20 | Documentação de transporte | Fiscal e expedição |
| 21 | Apresentação para coleta | Coleta |
| 22 | Conferência na origem | Armazém de origem |
| 23 | Carregamento e distribuição | Armazém de origem |
| 24 | Amarração e lacração | Expedição |
| 25 | Liberação operacional | Torre de controle |
| 26 | Transporte e execução | Operações |
| 27 | Monitoramento e comunicação | Torre de controle |
| 28 | Contingências e liberação mecânica | Manutenção e torre |
| 29 | Chegada ao destino | Entrega |
| 30 | Agendamento da doca | Armazém de destino |
| 31 | Descarga e conferência | Armazém de destino |
| 32 | Aceite do recebedor | Entrega |
| 33 | Veículo vazio e reprogramação | Frota |
| 34 | Comprovante de entrega — POD | Documentação |
| 35 | Auditoria logística | Qualidade operacional |
| 36 | Conciliação dos custos | Controladoria |
| 37 | Faturamento do frete | Faturamento |
| 38 | Recebimento e baixa | Contas a receber |
| 39 | Encerramento e indicadores | Controladoria |
| 40 | Melhoria contínua e relacionamento | Gestão e pós-venda |

## Decisões e dependências

- Captação atualiza o cliente; levantamento define peso, volume e valor da carga.
- Trechos e custos atualizam o orçamento; preço e negociação alteram o frete. Margem abaixo do mínimo declarado bloqueia o registro.
- Crédito a prazo precisa cobrir o frete; capacidade do veículo precisa comportar o peso declarado. Motorista e jornada atualizam o planejamento.
- Contrato define prazo em horas. A saída exige prazo viável e margem mínima preservada.
- Antes da saída é possível retornar à rota, negociação ou alocação do veículo. Registros posteriores precisam ser refeitos, mantendo ocorrências e seus impactos.
- Movimento ocorre nos passos 26–29, com limites de 40%, 70%, 90% e 100%; os passos anteriores e posteriores preservam o caminhão na origem/destino.
- Diferença entre volumes de origem e destino exige ocorrência de divergência resolvida.
- Recebimento simulado precisa quitar o frete antes da baixa. O Pix da assinatura da plataforma é separado desse recebimento educativo.
- Registros anteriores não podem ser reescritos durante o avanço; o Firestore impede saltos, mudança de versão, acesso de outro UID e edição após conclusão.

A simulação representa o ciclo de uma ordem dentro de uma grande transportadora, passando por suas áreas. Não é um ERP de múltiplas filiais com programação simultânea de toda uma frota. Documentos, análise de crédito, seguro, contratos e recebimentos são registros educativos; não executam operações externas. Cálculos, pontuação e decisões são educativos, sem certificação antifraude das respostas do aluno.

## Administração exclusiva

Somente `getuliopedromoreirafilho@gmail.com`, com documento de permissão do UID criado por operação confiável, administra preços e pagamentos. Outro e-mail é rejeitado mesmo que exista um documento `admins/UID`. Clientes não concedem permissões nem pelo painel nem diretamente nas regras. O script administrativo rejeita outro e-mail. A exclusividade se refere ao painel da aplicação; permissões de infraestrutura Firebase são geridas pelo proprietário do projeto.

## Verificação

`npm test`, `npm run build`, `npm run test:rules` e o fluxo `firebase emulators:exec --only auth,firestore --project demo-transportsim360 'node scripts/enterprise-qa.mjs'`. O teste de navegador usa contas locais e uma resposta de roteamento determinística; não faz pagamentos ou emissões reais.

Evidência local em 27/10/2026: build aprovado; 24 testes da aplicação e 8 de regras aprovados. Navegador percorreu os 40 processos, exerceu erros de preço/capacidade/baixa, concluiu a missão, recuperou 40 registros após reload e validou histórico e acesso em segundo contexto. O fluxo de assinatura Pix com administrador exclusivo também passou nos emuladores. Capturas: `docs/qa/enterprise-stage-1.png`, `enterprise-stage-15.png`, `enterprise-stage-26.png` e `enterprise-stage-38.png`. Publicação da aplicação e das regras permanece pendente; não houve alteração de missões reais.

## Sala de negociação

Na etapa 10 das novas missões, a janela abre com os dois participantes: comercial da transportadora e cliente. O cliente pede 8% de desconto sobre a proposta enviada. O aluno pode defender o preço, avaliar o desconto ou informar contraproposta com justificativa. A conversa é roteirizada para treinamento, sem serviço de IA ou contato externo.

Ofertas abaixo do frete mínimo calculado são devolvidas com orientação; ofertas acima da proposta recebem objeção do cliente. O acordo aceito é salvo explicitamente com valor e concessão no registro da etapa e atualiza o frete da missão. Fechar a janela não grava um acordo. O aluno pode reabrir a conversa e o registro salvo é recuperado após reload. Na fase de transporte, o mapa e o movimento por trechos continuam disponíveis normalmente.
