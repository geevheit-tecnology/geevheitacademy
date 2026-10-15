import { Link } from "react-router-dom";
export function Help() {
  return (
    <main className="help section">
      <Link to="/">← TransportSim 360</Link>
      <span className="eyebrow">CENTRAL DE AJUDA</span>
      <h1>Uma operação. Vinte aprendizados.</h1>
      <p>
        Cadastre-se, crie uma missão e ajuste os parâmetros de treinamento. Cada
        etapa possui um checklist obrigatório. Avance somente após verificar as
        condições.
      </p>
      {[
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
      <Link className="primary" to="/app">
        Abrir minha central →
      </Link>
    </main>
  );
}
