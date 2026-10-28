import { FooterCredit } from "../components/FooterCredit";
import { Link } from "react-router-dom";
export function Help() {
  return (
    <main className="help section">
      <Link to="/">← TransportSim 360</Link>
      <span className="eyebrow">CENTRAL DE AJUDA</span>
      <h1>Uma transportadora. Quarenta processos.</h1>
      <p>
        Cadastre-se, crie uma missão e ajuste os parâmetros de treinamento. Cada
        etapa possui registros e checklist obrigatórios. Salve os dados e
        confira as condições antes de avançar.
      </p>
      {[
        [
          "Como funcionam os 40 processos?",
          "Você pode escolher 12 processos comerciais, 10 de transporte ou a operação completa com 40. Na operação completa, as missões começam na captação do cliente, passam por cadastro, preço, crédito, contrato, frota, coleta, transporte, entrega, faturamento e recebimento. Cada área deixa um registro salvo na missão. Missões antigas preservam o fluxo original de 20 etapas.",
        ],
        [
          "Posso corrigir o planejamento?",
          "Antes da saída, use os botões para retornar à rota, negociação ou alocação. Os registros posteriores precisam ser refeitos; as ocorrências e seus custos permanecem. Após a saída, o plano é preservado.",
        ],
        [
          "Quem configura o preço da assinatura?",
          "A administração é exclusiva da conta do proprietário. Alunos acessam Minha assinatura, pagam pela chave Pix configurada e informam pagador e transação. O acesso é liberado após a conferência manual do recebimento.",
        ],
        [
          "Como são calculados os custos?",
          "Combustível = distância ÷ consumo × preço. O tempo total inclui direção, pausas, descanso, carga, descarga e ocorrências. Custos são discriminados no painel financeiro.",
        ],
        [
          "O que fazer em uma pane?",
          "Registre a ocorrência e descreva a ação corretiva na central. Ocorrências impeditivas bloqueiam a continuação. Resolver não apaga custos ou atrasos já causados.",
        ],
        [
          "Como continuar em outro computador?",
          "Entre com a mesma conta Firebase. Somente missões confirmadas como sincronizadas estão disponíveis em outro dispositivo. Rascunhos pendentes precisam ser enviados ou descartados explicitamente.",
        ],
        [
          "Como interpretar a pontuação?",
          "A base é 100. São descontados processo incompleto (até 20), impactos das ocorrências, pendências não resolvidas (5 cada), atraso (até 15) e prejuízo (10). O relatório mostra cada desconto.",
        ],
        [
          "Estes documentos têm validade fiscal?",
          "Não. CT-e, MDF-e e POD são registros demonstrativos. Jornada e pausas são parâmetros educativos e não certificam conformidade legal.",
        ],
        [
          "Por que o acesso está indisponível?",
          "O administrador precisa configurar as seis variáveis Firebase, ativar e-mail/senha, publicar as regras e índices e autorizar o domínio da Vercel.",
        ],
      ].map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <Link className="secondary" to="/manual">
        Ler manual de treinamento
      </Link>
      <Link className="primary" to="/app">
        Abrir minha central →
      </Link>
      <FooterCredit />
    </main>
  );
}
