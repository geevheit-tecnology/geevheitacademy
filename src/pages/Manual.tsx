import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Target, RotateCcw } from "lucide-react";
import { FooterCredit } from "../components/FooterCredit";
import { trainingModes, difficultyRules } from "../domain/training";
export function Manual() {
  return (
    <main className="section manual-page">
      <Link to="/">← Voltar ao início</Link>
      <span className="eyebrow">
        <BookOpen size={17} /> GUIA DO TREINAMENTO
      </span>
      <h1>Uma equipe preparada começa pela prática.</h1>
      <p className="manual-lead">
        O TransportSim 360 permite praticar as decisões de uma transportadora em
        um ambiente de treinamento, com consequências visíveis em custo, prazo e
        qualidade.
      </p>
      <section>
        <h2>Por que usar este método?</h2>
        <div className="feature-grid">
          {[
            [
              Users,
              "Alinhar a equipe",
              "Comercial, frota, operação e financeiro passam a enxergar o mesmo ciclo e suas dependências.",
            ],
            [
              Target,
              "Tornar decisões visíveis",
              "Preço, crédito, capacidade, ocorrências e entrega deixam um registro que pode ser discutido com o instrutor.",
            ],
            [
              RotateCcw,
              "Repetir para melhorar",
              "A equipe pode revisar o resultado, escolher uma ação de melhoria e testar outra estratégia em uma nova missão.",
            ],
          ].map(([Icon, title, description]) => {
            const Symbol = Icon as typeof Users;
            return (
              <article className="feature-card" key={String(title)}>
                <Symbol size={26} />
                <h3>{String(title)}</h3>
                <p>{String(description)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section>
        <h2>Escolha um objetivo por sessão</h2>
        <div className="manual-mode-list">
          {Object.values(trainingModes).map((mode) => (
            <article key={mode.label}>
              <h3>
                {mode.label} · {mode.count} processos
              </h3>
              <p>{mode.summary}</p>
            </article>
          ))}
        </div>
        <p>
          No modo transporte, a ordem já chega planejada: configure roteiro,
          carga, volumes previstos, veículo e motorista antes de iniciar. No
          modo comercial, o treinamento termina no contrato. A operação completa
          percorre as 40 etapas.
        </p>
      </section>
      <section>
        <h2>Avance de acordo com a experiência</h2>
        {Object.entries(difficultyRules).map(([name, rule]) => (
          <article className="manual-difficulty" key={name}>
            <h3>{name}</h3>
            <p>{rule.description}</p>
          </article>
        ))}
        <p>
          O grau e o modo ficam fixos na missão. Para trocar o exercício, crie
          uma nova missão. No avançado, as ações corretivas precisam explicar a
          solução com pelo menos 20 caracteres.
        </p>
      </section>
      <section>
        <h2>Como conduzir uma sessão com sua equipe</h2>
        <ol>
          <li>
            <b>Defina o objetivo.</b> Escolha uma área, um cenário e a
            dificuldade adequada ao participante.
          </li>
          <li>
            <b>Prepare o cenário.</b> Revise cliente, carga, rota, veículo,
            motorista e parâmetros. Os valores são configuráveis para seu
            treinamento.
          </li>
          <li>
            <b>Execute e registre.</b> Leia a orientação, preencha o registro e
            confirme o checklist. Nas ocorrências, descreva o que aconteceu e
            como foi tratado.
          </li>
          <li>
            <b>Discuta a decisão.</b> Durante a negociação, compare preço, custo
            e margem. No transporte, acompanhe o caminhão e trate as pendências
            antes de continuar.
          </li>
          <li>
            <b>Revise o resultado.</b> Compare custos, prazo, ocorrências e
            registros. Peça que o participante explique uma decisão que manteria
            e outra que mudaria.
          </li>
          <li>
            <b>Planeje a próxima rodada.</b> Registre a melhoria e repita o
            exercício com outro foco ou dificuldade.
          </li>
        </ol>
      </section>
      <section>
        <h2>Configure a precificação da missão</h2>
        <p>
          Na formação do preço, escolha valor definido, margem sobre a receita
          ou acréscimo sobre o custo. Informe o percentual, aplique o cálculo e
          revise o preço resultante. A margem mínima é uma proteção separada e
          continua valendo na negociação. Os valores de venda da assinatura da
          plataforma são configurados exclusivamente pelo administrador.
        </p>
      </section>
      <section>
        <h2>Teste gratuito, assinatura e cancelamento</h2>
        <p>
          Contas novas recebem 3 dias de teste a partir do cadastro, sem cartão
          e sem cobrança automática. Contas que ainda não utilizaram o teste
          podem ativá-lo em Minha assinatura. Depois, o acesso é renovado por
          Pix com conferência manual. O preço e a duração aparecem antes do
          pagamento.
        </p>
        <p>
          O cancelamento está disponível a qualquer momento em Minha assinatura.
          Ele cancela pedidos pendentes e mantém o acesso até o fim do período
          já liberado. Reativar não realiza cobrança nem reinicia os 3 dias
          gratuitos.
        </p>
      </section>
      <section>
        <h2>O que o exercício representa</h2>
        <p>
          A plataforma simula uma ordem de transporte e a passagem por
          diferentes áreas da empresa. Documentos, análise de crédito, seguro e
          recebimentos da missão são educativos. O relatório ajuda o instrutor a
          avaliar e discutir a prática; a pontuação não substitui sua avaliação
          profissional.
        </p>
        <p>
          A plataforma evoluirá com novos cenários e processos. Use os recursos
          disponíveis hoje e incorpore futuras funcionalidades ao treinamento
          conforme forem lançadas.
        </p>
      </section>
      <div className="actions">
        <Link className="primary" to="/cadastro">
          Começar meus 3 dias grátis <ArrowRight size={18} />
        </Link>
        <Link className="secondary" to="/app/nova">
          Preparar um treinamento
        </Link>
        <button className="text-link" onClick={() => window.print()}>
          Imprimir manual
        </button>
      </div>
      <FooterCredit />
    </main>
  );
}
