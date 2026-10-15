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
import { RouteMap } from "../components/RouteMap";
export function Landing() {
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
          <Link to="/ajuda">Central de ajuda</Link>
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
              Do primeiro contato comercial ao fechamento financeiro: viva uma
              operação de transporte completa, antes de assumir uma de verdade.
            </p>
            <div className="actions">
              <Link className="primary" to="/cadastro">
                Começar meu treinamento <ArrowRight size={18} />
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
                <Check size={18} /> Sem operação real
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
            <RouteMap progress={0.45} />
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
                  20 <span>etapas</span>
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
              "Negociação e planejamento de frete",
              "Documentação e liberação operacional",
              "Jornada, custos e tratamento de ocorrências",
              "Aceite, comprovante e fechamento financeiro",
            ].map((s, i) => (
              <div key={s}>
                <span>0{i + 1}</span>
                {s}
                <Check size={20} />
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <Link className="brand" to="/">
          <Truck />
          TransportSim <b>360</b>
        </Link>
        <p>Preparando pessoas. Movendo conhecimento.</p>
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
