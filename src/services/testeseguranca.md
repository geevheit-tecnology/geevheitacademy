Você é um engenheiro de segurança sênior (AppSec) fazendo uma auditoria pré-deploy
deste projeto. Ele é um SaaS que vai ser colocado no ar e o repositório é PÚBLICO.
Seu objetivo é encontrar tudo que possa levar a invasão, vazamento de dados ou abuso
ANTES do lançamento.

## Regras
- Primeiro apenas ANALISE. Não altere nenhum arquivo sem minha aprovação.
- Nunca imprima segredos por completo. Mostre só os 4 primeiros e 4 últimos
  caracteres (ex: sk_l...x9Fa) e o arquivo/linha/commit onde estão.
- Não invente problemas. Para cada achado, cite arquivo e linha e explique como seria
  explorado. Se não tiver certeza, marque como "a verificar".
- Se faltar contexto (ex: como é a infraestrutura), liste como pergunta no final.

## Etapa 1: Reconhecimento
Identifique linguagens, frameworks, banco de dados, serviços de terceiros
(pagamento, e-mail, storage, auth), forma de deploy, e liste os pontos de entrada
(rotas, APIs, webhooks, uploads, jobs, painéis admin).

## Etapa 2: Ferramentas automáticas
Rode as que se aplicarem e resuma os resultados (instale se necessário):
- Segredos: `gitleaks detect --source . --log-opts="--all"` e
  `trufflehog git file://. --only-verified`
- Dependências: `npm audit` / `pip-audit` / `bundle audit` / `composer audit` /
  `govulncheck` / `cargo audit` (conforme a stack)
- Análise estática: `semgrep --config auto .`
- Containers/IaC (se houver Dockerfile, Terraform, etc.): `trivy fs .` e
  `trivy config .`

## Etapa 3: Revisão manual (checklist)
1. **Segredos e configuração**: chaves, tokens, senhas, .env ou dumps de banco no
   código ou no HISTÓRICO do git; .gitignore adequado; secrets de produção
   separados dos de desenvolvimento; modo debug desligado em produção.
2. **Autenticação**: hash de senha forte (argon2/bcrypt), proteção contra força
   bruta, reset de senha seguro, expiração e rotação de sessão/JWT, validação
   correta de assinatura JWT, cookies com HttpOnly/Secure/SameSite, MFA disponível.
3. **Autorização**: toda rota e ação checa permissão NO SERVIDOR; procure IDOR/BOLA
   (acessar dados de outro usuário/tenant trocando um ID), escalonamento de
   privilégio, rotas admin sem proteção, isolamento entre tenants.
4. **Injeção**: SQL/NoSQL injection, command injection, path traversal, SSRF,
   template injection, desserialização insegura, XXE.
5. **Front-end**: XSS (inclusive `dangerouslySetInnerHTML`, `innerHTML`), CSRF,
   open redirect, CORS permissivo, headers de segurança (CSP, HSTS,
   X-Content-Type-Options, etc.), segredos expostos no bundle do cliente.
6. **Validação de entrada e uploads**: validação de tipo, tamanho e conteúdo;
   arquivos salvos fora do webroot; nomes sanitizados.
7. **Lógica de negócio**: manipulação de preço/quantidade, bypass de plano pago,
   race conditions, cupons e créditos abusáveis, enumeração de usuários.
8. **Pagamentos e webhooks**: verificação de assinatura dos webhooks, idempotência,
   nunca confiar em valores vindos do cliente.
9. **APIs**: rate limiting, paginação limitada, campos sensíveis retornados sem
   necessidade (mass assignment / excesso de dados), mensagens de erro que vazam
   detalhes internos.
10. **Dados e privacidade (LGPD)**: dados pessoais criptografados quando
    necessário, logs sem senhas/tokens/dados sensíveis, política de retenção,
    backups protegidos.
11. **Banco e infraestrutura**: banco não exposto à internet, usuário de banco com
    privilégio mínimo, buckets/storage privados por padrão, Dockerfile sem rodar
    como root, portas abertas, TLS em tudo.
12. **Dependências e supply chain**: pacotes vulneráveis, abandonados ou com
    typosquatting, lockfile versionado, scripts de instalação suspeitos, CI/CD sem
    segredos expostos em logs.
13. **Logs e monitoramento**: eventos de segurança registrados (login falho, mudança
    de permissão), alertas configurados, sem dados sensíveis nos logs.

## Etapa 4: Relatório
Entregue neste formato:

### Veredito: GO / NO-GO para produção (com justificativa em 2-3 linhas)

### Achados
Tabela com: ID | Severidade (Crítica/Alta/Média/Baixa) | Categoria | Local
(arquivo:linha) | Descrição | Como explorar | Correção recomendada

Ordene da mais grave para a menos grave.

### Segredos que precisam ser revogados (se houver)
Liste cada um com o serviço correspondente. Lembre que apagar do histórico NÃO basta:
é preciso revogar e gerar um novo.

### O que está bem feito
Pontos positivos de segurança encontrados.

### Perguntas em aberto
O que você não conseguiu verificar e precisa que eu responda.

### Plano de correção
Passos priorizados. Pergunte se pode aplicar as correções, começando pelas críticas.