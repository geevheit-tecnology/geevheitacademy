# Design system

Paleta: verde floresta #194c3c, verde claro #daeea5, fundo #f7f8f3. Tipografia Manrope nos títulos e DM Sans nos textos, com fallback sans-serif. Espaçamento 8/16/24/32 px. Bordas discretas, cartões claros, ícones Lucide. Avisos âmbar, sucesso verde e texto explícito para pendências.

Layout responsivo em 1100/800/550 px, formulários de três a uma coluna, navegação móvel horizontal. Foco visível, labels nos campos e botões com estados de carregamento. Modo apresentação oculta navegação e amplia números. Impressão do POD remove controles. Fontes externas são opcionais; o fallback mantém o conteúdo legível.

Painel operacional compacto: indicadores menores, mapa em coluna fixa e controles em coluna lateral com rolagem própria no desktop. Explicação complementar, trechos e timeline ficam recolhidos por padrão. No celular, mapa sticky no topo enquanto os controles rolam. Orientação e checklist continuam disponíveis. Ao mudar de etapa, a coluna de controles retorna ao início.

Explicação transitória de etapa: aviso informativo discreto no topo, sem modal ou bloqueio. Aparece após avanço salvo e desaparece após 5 segundos. O botão Explicação rápida reabre a informação; X fecha imediatamente. Timer substituído a cada aviso, aria-live polite e animação respeitando preferência por movimento reduzido. Estado apenas de interface, sem gravações adicionais.
