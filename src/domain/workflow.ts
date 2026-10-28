export interface ProcessField {
  key: string;
  label: string;
  type?: "number" | "select";
  options?: string[];
  min?: number;
  max?: number;
  optional?: boolean;
  inputKey?:
    | "client"
    | "vehicle"
    | "driver"
    | "freight"
    | "diesel"
    | "toll"
    | "maintenance"
    | "shiftHours"
    | "deadline";
}
export interface ProcessStage {
  name: string;
  department: string;
  action: string;
  impact: string;
  checks: string[];
  fields: ProcessField[];
}
const text = (
  key: string,
  label: string,
  inputKey?: ProcessField["inputKey"],
): ProcessField => ({ key, label, ...(inputKey ? { inputKey } : {}) });
const number = (
  key: string,
  label: string,
  min = 0,
  inputKey?: ProcessField["inputKey"],
  max = 1000000000,
): ProcessField => ({
  key,
  label,
  type: "number",
  min,
  max,
  ...(inputKey ? { inputKey } : {}),
});
const select = (
  key: string,
  label: string,
  options: string[],
): ProcessField => ({ key, label, type: "select", options });
const stage = (
  name: string,
  department: string,
  action: string,
  impact: string,
  checks: string[],
  fields: ProcessField[],
): ProcessStage => ({ name, department, action, impact, checks, fields });
export const enterpriseWorkflow: ProcessStage[] = [
  stage(
    "Captação do cliente",
    "Comercial",
    "Registre a empresa prospectada, a pessoa de contato e o canal de origem da oportunidade.",
    "O funil começa antes do frete: cada oportunidade precisa de um responsável e de um contato.",
    ["Oportunidade e contato registrados"],
    [
      text("company", "Empresa prospectada", "client"),
      text("contact", "Contato comercial"),
      select("channel", "Canal de captação", [
        "Prospecção ativa",
        "Indicação",
        "Site",
        "Licitação privada",
      ]),
    ],
  ),
  stage(
    "Qualificação da oportunidade",
    "Comercial",
    "Identifique o segmento, a demanda mensal e a necessidade do cliente.",
    "Volume e recorrência orientam a prioridade e o modelo de atendimento.",
    ["Demanda e perfil do cliente qualificados"],
    [
      text("segment", "Segmento do cliente"),
      number("monthlyLoads", "Viagens estimadas por mês", 1),
      text("need", "Necessidade logística"),
    ],
  ),
  stage(
    "Cadastro do cliente",
    "Cadastro",
    "Monte o cadastro fictício da empresa e indique o contato de faturamento.",
    "Dados consistentes conectam contrato, operação e cobrança.",
    ["Cadastro e contato de faturamento conferidos"],
    [
      text("registration", "Identificação cadastral fictícia"),
      text("address", "Endereço cadastral de treinamento"),
      text("billingContact", "Contato de faturamento"),
    ],
  ),
  stage(
    "Levantamento da carga",
    "Comercial e operações",
    "Declare peso, volume e valor da carga para dimensionar atendimento e risco.",
    "A capacidade do veículo será comparada com o peso informado aqui.",
    ["Características e restrições da carga registradas"],
    [
      number("weight", "Peso da carga em toneladas", 0.01, undefined, 1000),
      number("volume", "Volume em m³", 0.01),
      number("cargoValue", "Valor declarado da carga em R$", 0.01),
      text("restrictions", "Restrições de manuseio e entrega"),
    ],
  ),
  stage(
    "Viabilidade operacional",
    "Planejamento",
    "Avalie recursos, prazo e necessidade de parceiros antes de prometer atendimento.",
    "A venda precisa caber na capacidade operacional disponível.",
    ["Operação considerada viável e justificativa registrada"],
    [
      select("model", "Modelo de atendimento", [
        "Frota própria",
        "Agregado",
        "Parceiro contratado",
      ]),
      text("resources", "Recursos e disponibilidade"),
      text("feasibility", "Justificativa de viabilidade"),
    ],
  ),
  stage(
    "Planejamento da rota",
    "Roteirização",
    "Configure e aplique os trechos no planejador. Registre pontos de apoio e restrições do percurso.",
    "Distância e percurso alimentam o custo, o prazo e o movimento do caminhão.",
    ["Rota aplicada e pontos de apoio conferidos"],
    [
      text("support", "Pontos de apoio previstos"),
      text("routeRisk", "Restrições e contingência da rota"),
    ],
  ),
  stage(
    "Composição dos custos",
    "Custos",
    "Revise diesel, pedágios e manutenção. Os valores salvos atualizam o orçamento da missão.",
    "Custos subestimados podem transformar um frete aparentemente bom em prejuízo.",
    ["Orçamento operacional revisado"],
    [
      number("diesel", "Diesel em R$/litro", 0.01, "diesel", 100),
      number("toll", "Pedágios previstos em R$", 0, "toll"),
      number("maintenance", "Reserva de manutenção em R$", 0, "maintenance"),
    ],
  ),
  stage(
    "Formação do preço",
    "Precificação",
    "Defina o preço de venda e a margem mínima desejada com base no custo calculado.",
    "O preço será bloqueado se não cobrir a margem mínima declarada.",
    ["Preço mínimo e margem avaliados"],
    [
      {
        ...select("pricingMethod", "Método de precificação", [
          "Preço definido",
          "Margem sobre a receita",
          "Acréscimo sobre o custo",
        ]),
        optional: true,
      },
      {
        ...number(
          "pricingRate",
          "Percentual para cálculo do preço",
          0,
          undefined,
          80,
        ),
        optional: true,
      },
      number("freight", "Preço proposto em R$", 0.01, "freight"),
      number("targetMargin", "Margem mínima desejada em %", 0, undefined, 80),
    ],
  ),
  stage(
    "Envio da proposta",
    "Comercial",
    "Formalize escopo, validade da proposta e condições de pagamento.",
    "Uma proposta clara reduz divergências entre o que foi vendido e o que será executado.",
    ["Proposta comercial registrada"],
    [
      text("proposal", "Número da proposta simulada"),
      number("validityDays", "Validade da proposta em dias", 1),
      text("paymentTerms", "Condições de pagamento propostas"),
    ],
  ),
  stage(
    "Negociação e aceite do preço",
    "Comercial",
    "Registre o frete final aceito e a concessão negociada. Confira a margem antes de fechar.",
    "O frete final substitui o preço proposto e recalcula o resultado.",
    ["Preço final e condições aceitos pelo cliente"],
    [
      number("freight", "Frete final negociado em R$", 0.01, "freight"),
      text("concession", "Concessões e contrapartidas acordadas"),
    ],
  ),
  stage(
    "Análise de crédito",
    "Crédito e cobrança",
    "Defina limite e modalidade de pagamento. O limite a prazo precisa cobrir o frete.",
    "O risco de inadimplência deve ser tratado antes da mobilização da frota.",
    ["Crédito ou antecipação aprovados"],
    [
      select("paymentMode", "Modalidade aprovada", ["A prazo", "Antecipado"]),
      number("creditLimit", "Limite de crédito aprovado em R$"),
      text("creditAnalysis", "Fundamento da análise de crédito"),
    ],
  ),
  stage(
    "Contrato e nível de serviço",
    "Contratos",
    "Formalize responsabilidades, prazo de entrega e canal de escalonamento.",
    "O contrato converte a promessa comercial em compromissos para as equipes.",
    ["Contrato e SLA aprovados"],
    [
      text("contract", "Referência do contrato simulado"),
      number("deadline", "Prazo contratado em horas", 0.25, "deadline", 10000),
      text("sla", "Compromissos de atendimento e entrega"),
      text("escalation", "Responsável pelo escalonamento"),
    ],
  ),
  stage(
    "Ordem de transporte",
    "Programação",
    "Abra a ordem vinculando cliente, proposta e instruções operacionais.",
    "A ordem é o elo de rastreabilidade entre comercial e execução.",
    ["Ordem liberada para programação"],
    [
      text("order", "Número da ordem de transporte"),
      text("instructions", "Instruções da ordem"),
    ],
  ),
  stage(
    "Dimensionamento da frota",
    "Frota",
    "Selecione a configuração adequada para peso, volume e tipo de carga.",
    "A escolha do equipamento considera capacidade e restrições de acesso.",
    ["Configuração e capacidade planejadas"],
    [
      select("equipment", "Configuração do equipamento", [
        "VUC",
        "Toco",
        "Truck",
        "Carreta",
        "Bitrem",
      ]),
      text("adequacy", "Justificativa do equipamento"),
    ],
  ),
  stage(
    "Alocação do veículo",
    "Frota",
    "Designe o veículo e declare a capacidade disponível. O sistema bloqueia capacidade abaixo do peso da carga.",
    "Uma alocação incompatível impede a continuidade da operação.",
    ["Veículo compatível reservado para a ordem"],
    [
      text("vehicle", "Identificação do veículo de treinamento", "vehicle"),
      number("capacity", "Capacidade útil em toneladas", 0.01, undefined, 1000),
      text("availability", "Disponibilidade e programação do veículo"),
    ],
  ),
  stage(
    "Manutenção preventiva",
    "Manutenção",
    "Confira pneus, freios e iluminação e registre a ordem de inspeção.",
    "Falhas impeditivas precisam ser registradas e resolvidas antes da saída.",
    ["Pneus e freios conferidos", "Iluminação e inspeção aprovadas"],
    [
      text("inspection", "Número da inspeção simulada"),
      text("maintenanceReport", "Condições e serviços preventivos"),
    ],
  ),
  stage(
    "Motorista e jornada",
    "Gestão de motoristas",
    "Designe o motorista e revise as horas de direção planejadas e os descansos.",
    "A jornada educativa afeta o tempo calculado da missão.",
    ["Motorista disponível e jornada planejada"],
    [
      text("driver", "Nome do motorista", "driver"),
      number(
        "shiftHours",
        "Horas de direção por jornada planejada",
        0.25,
        "shiftHours",
        24,
      ),
      text("driverPlan", "Plano de pausas, descansos e substituição"),
    ],
  ),
  stage(
    "Gerenciamento de risco e seguro",
    "Risco",
    "Registre a análise da carga, a cobertura simulada e o plano de comunicação.",
    "Risco e cobertura precisam ser avaliados antes da coleta.",
    ["Análise de risco e cobertura de treinamento conferidas"],
    [
      text("coverage", "Referência da cobertura simulada"),
      text("riskPlan", "Plano de gerenciamento de risco"),
    ],
  ),
  stage(
    "Agendamento da coleta",
    "Agendamento",
    "Combine janela de coleta e contato no embarcador.",
    "Atrasos de apresentação podem consumir a folga do prazo negociado.",
    ["Janela e responsável pela coleta confirmados"],
    [
      text("pickupWindow", "Janela de coleta combinada"),
      text("shipper", "Responsável no embarcador"),
    ],
  ),
  stage(
    "Documentação de transporte",
    "Fiscal e expedição",
    "Confira os dados nos documentos demonstrativos. Registre referências de treinamento.",
    "Documentação divergente bloqueia a liberação até o tratamento da ocorrência.",
    [
      "CT-e simulado conferido",
      "MDF-e simulado conferido",
      "Nota de treinamento conferida",
    ],
    [
      text("cte", "Referência de CT-e simulado"),
      text("mdfe", "Referência de MDF-e simulado"),
      text("invoice", "Referência da nota de treinamento"),
    ],
  ),
  stage(
    "Apresentação para coleta",
    "Coleta",
    "Registre a chegada e a condição de atendimento no embarcador.",
    "O apontamento permite avaliar espera e pontualidade da coleta.",
    ["Apresentação ao embarcador registrada"],
    [
      text("pickupArrival", "Data e hora de apresentação"),
      text("queue", "Situação da fila e atendimento"),
    ],
  ),
  stage(
    "Conferência na origem",
    "Armazém de origem",
    "Compare quantidade e condição da carga com a ordem antes do carregamento.",
    "Divergências registradas na origem evitam aceite indevido na entrega.",
    ["Quantidade e condição da carga conferidas"],
    [
      number("packages", "Volumes conferidos", 1),
      text("cargoCondition", "Condição da carga na origem"),
    ],
  ),
  stage(
    "Carregamento e distribuição",
    "Armazém de origem",
    "Registre a equipe e o plano de distribuição da carga no equipamento.",
    "Distribuição e acondicionamento inadequados aumentam risco de avaria.",
    ["Carregamento e distribuição aprovados"],
    [
      text("loadingTeam", "Equipe responsável pelo carregamento"),
      text("distribution", "Plano de distribuição e acondicionamento"),
    ],
  ),
  stage(
    "Amarração e lacração",
    "Expedição",
    "Confira fixação, lacres e identificação da unidade de carga.",
    "A integridade da expedição depende de registros verificáveis na entrega.",
    ["Fixação e lacres conferidos"],
    [
      text("seal", "Identificador do lacre simulado"),
      text("securing", "Conferência da fixação da carga"),
    ],
  ),
  stage(
    "Liberação operacional",
    "Torre de controle",
    "Revise a ordem, documentos, inspeção e autorização de saída.",
    "Após a saída, parâmetros e registros anteriores ficam preservados.",
    ["Liberação operacional autorizada"],
    [
      text("releaseBy", "Responsável pela liberação"),
      text("departure", "Data e hora da saída autorizada"),
    ],
  ),
  stage(
    "Transporte e execução",
    "Operações",
    "Percorra a rota até 40%, usando o controle da viagem, e registre o primeiro posicionamento.",
    "O progresso só avança com as pendências impeditivas resolvidas.",
    ["Primeira parte da viagem realizada com pausas"],
    [
      text("position", "Primeiro posicionamento comunicado"),
      text("journeyLog", "Registro de direção e pausas"),
    ],
  ),
  stage(
    "Monitoramento e comunicação",
    "Torre de controle",
    "Avance até 70% e registre a previsão atualizada de chegada e a comunicação ao cliente.",
    "A torre mantém cliente, motorista e destino alinhados sobre desvios.",
    ["Posicionamento e previsão comunicados"],
    [
      text("eta", "Previsão atualizada de chegada"),
      text("communication", "Comunicação realizada ao cliente"),
    ],
  ),
  stage(
    "Contingências e liberação mecânica",
    "Manutenção e torre",
    "Trate ocorrências, confirme a liberação do veículo e avance até 90%. Se não houver falhas, registre a inspeção sem anormalidades.",
    "A resolução libera o movimento, mantendo os custos e atrasos já incorridos.",
    ["Veículo liberado após inspeção"],
    [
      text("contingency", "Avaliação de contingências"),
      text("releaseReport", "Registro da liberação mecânica"),
    ],
  ),
  stage(
    "Chegada ao destino",
    "Entrega",
    "Complete os últimos trechos e registre a apresentação no destino.",
    "A chegada encerra o percurso, mas ainda não encerra o serviço.",
    ["Horário de chegada registrado"],
    [
      text("destinationArrival", "Data e hora de chegada ao destino"),
      text("destinationContact", "Contato no destino"),
    ],
  ),
  stage(
    "Agendamento da doca",
    "Armazém de destino",
    "Registre doca, janela de descarga e orientações de segurança.",
    "A gestão de doca reduz espera e mantém a descarga organizada.",
    ["Doca e janela de descarga confirmadas"],
    [
      text("dock", "Doca designada"),
      text("unloadingWindow", "Janela de descarga"),
    ],
  ),
  stage(
    "Descarga e conferência",
    "Armazém de destino",
    "Confira quantidades descarregadas e integridade. Trate avarias na central de ocorrências.",
    "O recebimento deve refletir o que foi efetivamente descarregado.",
    ["Descarga e condição da carga conferidas"],
    [
      number("receivedPackages", "Volumes recebidos", 1),
      text("unloadingReport", "Condição e divergências na descarga"),
    ],
  ),
  stage(
    "Aceite do recebedor",
    "Entrega",
    "Identifique o recebedor e registre o aceite ou as ressalvas tratadas.",
    "O aceite documenta a conclusão física do atendimento.",
    ["Recebedor confirmou aceite"],
    [
      text("receiver", "Nome do recebedor fictício"),
      text("acceptance", "Condição de aceite e ressalvas"),
    ],
  ),
  stage(
    "Veículo vazio e reprogramação",
    "Frota",
    "Confirme veículo vazio e defina retorno ou próxima programação.",
    "O ciclo da frota continua após a entrega e precisa de visibilidade.",
    ["Motorista comunicou veículo vazio"],
    [
      text("emptyReport", "Comunicação do veículo vazio"),
      select("nextAssignment", "Próxima programação", [
        "Retorno à base",
        "Nova coleta",
        "Manutenção programada",
      ]),
    ],
  ),
  stage(
    "Comprovante de entrega — POD",
    "Documentação",
    "Registre o comprovante demonstrativo com referência e data de recebimento.",
    "O POD conecta o aceite físico à liberação do faturamento.",
    ["Comprovante demonstrativo completo"],
    [
      text("podReference", "Referência do comprovante simulado"),
      text("podDate", "Data de recebimento do comprovante"),
    ],
  ),
  stage(
    "Auditoria logística",
    "Qualidade operacional",
    "Confira ordem, comprovantes e pendências antes de encaminhar ao financeiro.",
    "A auditoria evita cobranças sem evidência de entrega.",
    ["Logística aprovou comprovante e ordem"],
    [
      text("auditor", "Responsável pela conferência logística"),
      text("auditReport", "Conclusão da auditoria"),
    ],
  ),
  stage(
    "Conciliação dos custos",
    "Controladoria",
    "Compare orçamento, despesas e ocorrências na aba Financeiro e explique os desvios.",
    "Custos de ocorrências já estão incluídos no cálculo e não devem ser somados novamente.",
    ["Custos e desvios conciliados"],
    [
      text("costReview", "Conciliação das despesas"),
      text("variance", "Causa dos desvios em relação ao plano"),
    ],
  ),
  stage(
    "Faturamento do frete",
    "Faturamento",
    "Registre a fatura demonstrativa e o vencimento acordado.",
    "A fatura deve respeitar o frete aceito e o comprovante aprovado.",
    ["Receita e fatura de treinamento conferidas"],
    [
      text("billingReference", "Número da fatura simulada"),
      text("dueDate", "Data de vencimento acordada"),
    ],
  ),
  stage(
    "Recebimento e baixa",
    "Contas a receber",
    "Registre o recebimento simulado. O valor precisa corresponder ao frete contratado para encerrar sem saldo.",
    "Faturar não é receber: a baixa confirma a conclusão financeira da ordem.",
    ["Recebimento simulado conciliado e baixado"],
    [
      number("receivedAmount", "Valor recebido de treinamento em R$", 0.01),
      text("settlement", "Referência da baixa simulada"),
    ],
  ),
  stage(
    "Encerramento e indicadores",
    "Controladoria",
    "Revise prazo, margem e ocorrências e registre a análise dos indicadores.",
    "O encerramento reúne o desempenho operacional e o resultado econômico.",
    ["Relatório e indicadores revisados"],
    [
      text("kpiReview", "Análise de prazo, margem e qualidade"),
      text("closing", "Conclusão do encerramento"),
    ],
  ),
  stage(
    "Melhoria contínua e relacionamento",
    "Gestão e pós-venda",
    "Registre o retorno ao cliente e uma ação de melhoria com responsável.",
    "O aprendizado retorna para a prospecção e para as próximas operações.",
    ["Lições aprendidas e ação de melhoria registradas"],
    [
      text("customerFeedback", "Retorno do cliente no treinamento"),
      text("improvement", "Ação de melhoria para a próxima operação"),
      text("improvementOwner", "Responsável pela melhoria"),
    ],
  ),
];
export const enterpriseStages = enterpriseWorkflow.map((stage) => stage.name);
export type ProcessRecord = { values: Record<string, string>; savedAt: string };
