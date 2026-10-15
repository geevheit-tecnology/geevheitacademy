# Mapas, cidades e trechos

Atualização de 15/10/2026.

A aplicação usa Leaflet e tiles OpenStreetMap, com atribuição permanente, carregamento normal no navegador e sem download offline ou prefetch. Serviços públicos são best-effort, sem garantia de disponibilidade ou gratuidade ilimitada. Uso em grande escala exige provedor adequado ou infraestrutura própria.

- Estados e municípios: API oficial de localidades IBGE, consultada por UF; cache de sessão evita repetição.
- Coordenadas dos centros municipais: Photon/Komoot, somente ao calcular rota, com identificação do município e UF. São referências de treinamento, não localização real de um armazém.
- Trajetos: OSRM público, GeoJSON simplificado, distâncias dos trechos e pontos intermediários. Sem chave paga. Falhas são apresentadas e não geram distâncias inventadas.
- Base visual: OpenStreetMap. Caminhão e armazéns são SVG próprios. Tooltips usam texto escapado.

Em Nova missão/Configurações, selecione origem, destino e até seis cidades intermediárias. É possível reordenar/remover pontos. Calcular e aplicar rota atualiza origem, destino e distância utilizada pelo orçamento. Uma nova missão exige um percurso calculado. A estratégia rápida escolhe a alternativa mais rápida retornada; curta/econômica escolhem a menor distância entre as retornadas. Não se garante uma alternativa diferente quando o serviço só fornece uma. Pedágios, velocidade educativa e custos permanecem parâmetros editáveis: OSRM driving usa perfil de automóvel e não certifica rotas para caminhão, restrições de altura/peso ou tarifas.

Missões antigas continuam compatíveis. Sem routePlan, mostram aviso para configuração em vez de exibir um corredor falso. Use Configurar trechos antes da etapa Transporte. Depois da liberação, alterações de input são bloqueadas pelas regras.

O caminhão permanece na origem durante preparação/coleta/carregamento. Entre Transporte e Chegada ao destino, Avançar na viagem movimenta gradualmente e salva journeyProgress. A geometria orienta a animação, e nenhuma atualização de frame é gravada. Pane impeditiva bloqueia o movimento. Cada etapa exige seu marco de progresso; o percurso só termina completamente na Chegada ao destino. Depois da chegada, o caminhão permanece no destino. Reiniciar missão zera o progresso.

Cards de orientação aparecem em cada uma das vinte etapas: objetivo, ação e consequência. A confirmação de etapa aparece após gravação bem-sucedida.

Segurança: regras validam lista de pontos/trechos e seus limites, provider, timestamps e coordenadas extremas. A validação completa de cada ponto e geometria está no schema de domínio. Dados são privados por UID, sem certificação antifraude; o limite de expressões do Firestore impede repetir a validação detalhada da geometria em cada atualização. Input inalterado não é revalidado a cada checkbox.

Referências:

- https://servicodados.ibge.gov.br/api/docs/localidades
- https://photon.komoot.io/
- https://project-osrm.org/docs/v5.5.1/api/
- https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy
- https://operations.osmfoundation.org/policies/tiles/

## Ajuste de movimento por etapa

O progresso não é mais forçado a 100% após Transporte. O limite educativo é 40% em Transporte, 70% em Monitoramento, 90% em Manutenção corretiva/liberação e 100% em Chegada ao destino. Cada comando avança até 10% ou até o próximo ponto, respeitando o limite atual. Concluir a etapa exige alcançar seu limite e cumprir o checklist. Na manutenção corretiva, o movimento exige liberação do veículo no checklist e resolução de panes. A animação retoma da posição visual atual quando interrompida por outro avanço. Missões antigas com 100% antecipado têm o progresso limitado à etapa; avançar normaliza o valor salvo.
