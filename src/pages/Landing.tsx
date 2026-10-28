import { currency, useBilling } from "../services/billing";
import { FooterCredit } from "../components/FooterCredit";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  MoveUpRight,
  Route,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedRoutePreview } from "../components/AnimatedRoutePreview";
export function Landing() {
  const { config, loading, error, admin } = useBilling();
  return (
    <>
      <header className="public-header">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Truck size={23} />
          </span>
          TransportSim <b>360</b>
        </Link>
        <nav>
          <a href="#metodo">Como funciona</a>
          <a href="#aprendizado">O que você aprende</a>
          <a href="#assinatura">Planos</a>
          <Link to="/manual">Manual de treinamento</Link>
        </nav>
        <Link className="small-button" to="/login">
          Acessar plataforma <ArrowRight size={16} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <i /> APRENDER. DECIDIR. EVOLUIR.
            </span>
            <h1>
              Na logística,
              <br />
              cada decisão
              <br />
              <em>move o resultado.</em>
            </h1>
            <p>
              Da captação do cliente à negociação, frota, entrega e recebimento:
              viva uma operação de transporte completa, antes de assumir uma de
              verdade.
            </p>
            <div className="actions">
              <Link className="primary" to="/cadastro">
                Testar grátis por 3 dias <ArrowRight size={18} />
              </Link>
              <a className="text-link" href="#metodo">
                Conhecer o simulador <MoveUpRight size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <ShieldCheck size={18} /> Ambiente seguro para aprender
              </span>
              <span>
                <Check size={18} /> Sem cartão e sem cobrança automática
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-top">
              <span>
                <i /> CENTRAL DE OPERAÇÕES
              </span>
              <span className="tag">Treinamento</span>
            </div>
            <div className="visual-title">
              <div>
                <small>MISSÃO EM DESTAQUE</small>
                <h3>Expresso Sudeste</h3>
                <p>
                  São Paulo <ArrowRight size={14} /> Rio de Janeiro
                </p>
              </div>
              <span className="round-icon">
                <Truck />
              </span>
            </div>
            <AnimatedRoutePreview />
            <div className="visual-metrics">
              <div>
                <small>Distância planejada</small>
                <strong>
                  485 <span>km</span>
                </strong>
              </div>
              <div>
                <small>Etapas da operação</small>
                <strong>
                  40 <span>etapas</span>
                </strong>
              </div>
              <div>
                <small>Seu próximo passo</small>
                <strong className="metric-small">
                  Planejar a rota <ArrowRight size={18} />
                </strong>
              </div>
            </div>
            <div className="floating-note">
              <ShieldCheck />
              <div>
                <b>Experiência prática. Risco zero.</b>
                <small>Dados e documentos de treinamento.</small>
              </div>
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <span>UMA VISÃO DE PONTA A PONTA</span>
          <b>Comercial</b>
          <ArrowRight />
          <b>Operação</b>
          <ArrowRight />
          <b>Entrega</b>
          <ArrowRight />
          <b>Financeiro</b>
        </section>
        <section className="section" id="metodo">
          <div className="section-title">
            <div>
              <span className="eyebrow">APRENDIZADO QUE SAI DO PAPEL</span>
              <h2>
                Entenda o processo.
                <br />
                Assuma o controle.
              </h2>
            </div>
            <p>
              Mais do que acompanhar um caminhão no mapa, entenda o impacto de
              cada escolha sobre prazo, segurança e rentabilidade.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: Route,
                n: "01",
                title: "Planeje com critério",
                text: "Negocie o frete, escolha a rota e confira o orçamento antes da partida.",
              },
              {
                icon: Truck,
                n: "02",
                title: "Opere com confiança",
                text: "Confira documentos, libere o veículo e resolva ocorrências durante a viagem.",
              },
              {
                icon: ChartNoAxesCombined,
                n: "03",
                title: "Aprenda com o resultado",
                text: "Feche a operação e descubra como suas decisões impactaram custos e desempenho.",
              },
            ].map((f) => (
              <article className="feature-card" key={f.n}>
                <div>
                  <f.icon />
                  <span>{f.n}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="learning section" id="aprendizado">
          <div>
            <span className="eyebrow">DA TEORIA À DECISÃO</span>
            <h2>
              O caminho completo
              <br />
              para uma boa operação.
            </h2>
            <p>
              Cenários com três níveis de dificuldade e parâmetros editáveis
              para diferentes treinamentos.
            </p>
            <Link className="primary" to="/cadastro">
              Criar minha primeira missão <ArrowRight size={18} />
            </Link>
          </div>
          <div className="learning-list">
            {[
              "Captação, cadastro e análise do cliente",
              "Custos, proposta, negociação e contrato",
              "Dimensionamento da frota e programação",
              "Documentação e liberação operacional",
              "Jornada, custos e tratamento de ocorrências",
              "Aceite, comprovante, faturamento e recebimento",
            ].map((s, i) => (
              <div key={s}>
                <span>0{i + 1}</span>
                {s}
                <Check size={20} />
              </div>
            ))}
          </div>
        </section>
        <section className="section training-benefits" id="treine-sua-equipe">
          <span className="eyebrow">
            TREINAMENTO PARA A ROTINA DA SUA EMPRESA
          </span>
          <h2>Pratique antes de colocar a operação em risco.</h2>
          <p>
            Treine decisões comerciais e operacionais em um cenário seguro. A
            equipe entende como uma negociação influencia a margem, como um
            atraso afeta a entrega e como registrar a solução.
          </p>
          <div className="feature-grid">
            {[
              [
                "Escolha o foco",
                "12 processos comerciais, 10 de transporte ou o ciclo completo com 40.",
              ],
              [
                "Aumente a dificuldade",
                "Comece pelo fluxo guiado e evolua para desafios de documentos, custos, pane e comprovante.",
              ],
              [
                "Transforme o resultado em ação",
                "Use os registros e o relatório para discutir decisões, alinhar procedimentos e repetir o treino.",
              ],
            ].map(([title, text]) => (
              <article className="feature-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <Link className="text-link" to="/manual">
            Ler o manual e preparar minha equipe <ArrowRight size={17} />
          </Link>
        </section>
        <section className="section commercial-offer" id="assinatura">
          <div>
            <span className="eyebrow">COMECE COM 3 DIAS GRÁTIS</span>
            <h2>
              {!loading && !error && config.enabled
                ? config.name
                : "Sua equipe pronta para a próxima operação."}
            </h2>
            <p>
              Explore os três modos de treinamento. Sem cartão, sem cobrança
              automática e com cancelamento a qualquer momento.
            </p>
            <ul>
              <li>Comercial, transporte ou operação completa</li>
              <li>Três níveis com desafios progressivos</li>
              <li>Negociação simulada, mapa, registros e relatório</li>
            </ul>
            <Link className="primary" to="/cadastro">
              Criar conta e testar por 3 dias <ArrowRight size={18} />
            </Link>
          </div>
          <div className="commercial-price">
            <span>Após o período gratuito</span>
            {!loading && !error && config.enabled ? (
              <>
                <strong>{currency(config.priceCents)}</strong>
                <span>por {config.days} dias de acesso</span>
                <p>
                  Pagamento por Pix, liberado após conferência. Renove somente
                  quando quiser continuar.
                </p>
                <Link className="secondary" to="/app/assinatura">
                  Ver minha assinatura
                </Link>
              </>
            ) : (
              <>
                <strong>Valores em definição</strong>
                <p>
                  Os valores serão disponibilizados pelo administrador antes de
                  qualquer contratação. Você não será cobrado ao criar a conta.
                </p>
              </>
            )}
            <small>
              Cancele pelo seu perfil de assinatura. O acesso vigente permanece
              até o vencimento.
            </small>
          </div>
        </section>
        <section className="section platform-evolution">
          <span className="eyebrow">UMA PLATAFORMA EM EVOLUÇÃO</span>
          <h2>Cada vez mais perto da rotina de uma transportadora.</h2>
          <p>
            Hoje você treina o ciclo de uma ordem de transporte. A visão de
            evolução inclui cenários mais detalhados, operações simultâneas e
            novos exercícios para aproximar a aprendizagem da rotina da sua
            empresa. Recursos futuros serão apresentados conforme forem
            disponibilizados.
          </p>
        </section>
      </main>
      <footer>
        <Link className="brand" to="/">
          <Truck />
          TransportSim <b>360</b>
        </Link>
        <p>Preparando pessoas. Movendo conhecimento.</p>
        <Link to="/app/assinatura">Assinatura e Pix</Link>
        {admin && <Link to="/admin">Administração</Link>}
        <a href="#">Voltar ao topo ↑</a>
        <small>
          Simulação educacional. Não representa rastreamento, emissão fiscal ou
          conformidade legal.
        </small>
        <FooterCredit />
      </footer>
    </>
  );
}
