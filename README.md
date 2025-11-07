# Sistema de Gestão de Tarefas Colaborativo

Sistema completo de gerenciamento de tarefas com arquitetura de microserviços, autenticação JWT, notificações em tempo real via WebSocket e interface moderna em React.

## 📋 Índice

- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Funcionalidades](#-funcionalidades)
- [Decisões Técnicas](#-decisões-técnicas)
- [Timeline de Desenvolvimento](#-timeline-de-desenvolvimento)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar](#-como-executar)
- [Documentação da API](#-documentação-da-api)
- [Testes](#-testes)
- [Health Checks & Observabilidade](#-health-checks--observabilidade)
- [Requisitos vs Entregue](#-requisitos-vs-entregue)
- [Problemas Conhecidos](#-problemas-conhecidos)

---

## 🏗 Arquitetura

### Visão Geral

```mermaid
graph TB
    subgraph Client["🖥️ Frontend (React 19)"]
        UI[TanStack Router + Query<br/>Zustand + shadcn/ui<br/>Tailwind CSS 4]
    end

    subgraph Gateway["🚪 API Gateway :3001"]
        APIGW[NestJS HTTP Server<br/>JWT Guards<br/>Rate Limiting<br/>Swagger Docs]
    end

    subgraph Services["⚙️ Microserviços"]
        AUTH[Auth Service :3002<br/>JWT + argon2<br/>User Management]
        TASKS[Tasks Service :3003<br/>CRUD + Comments<br/>Audit Logs<br/>RabbitMQ Publisher]
        NOTIF[Notifications Service :3004<br/>WebSocket Gateway<br/>RabbitMQ Consumer<br/>Real-time Delivery]
    end

    subgraph Data["💾 Infraestrutura"]
        DB[(PostgreSQL :5432<br/>challenge_db)]
        MQ[RabbitMQ :5672<br/>Message Broker]
    end

    UI -->|HTTP| APIGW
    UI -.->|WebSocket| NOTIF

    APIGW -->|RPC TCP| AUTH
    APIGW -->|RPC TCP| TASKS
    APIGW -->|HTTP| NOTIF

    AUTH --> DB
    TASKS --> DB
    NOTIF --> DB

    TASKS -->|Publish Events| MQ
    MQ -->|Consume Events| NOTIF
    NOTIF -.->|Emit WS| UI

    style Client fill:#e1f5ff
    style Gateway fill:#fff4e1
    style Services fill:#e8f5e9
    style Data fill:#f3e5f5
```

### Fluxo de Comunicação

```mermaid
sequenceDiagram
    participant U as Frontend
    participant G as API Gateway
    participant A as Auth Service
    participant T as Tasks Service
    participant M as RabbitMQ
    participant N as Notifications Service
    participant D as PostgreSQL

    Note over U,D: Fluxo de Autenticação
    U->>G: POST /api/auth/register
    G->>A: RPC createUser()
    A->>D: Save user (argon2 hash)
    A-->>G: Return tokens
    G-->>U: accessToken + refreshToken

    Note over U,D: Fluxo de Criação de Tarefa
    U->>G: POST /api/tasks (with JWT)
    G->>A: RPC validateToken()
    A-->>G: User validated
    G->>T: RPC createTask()
    T->>D: Save task
    T->>M: Publish task.created
    T-->>G: Task created
    G-->>U: 201 Created

    Note over U,D: Fluxo de Notificação
    M->>N: Consume task.created
    N->>D: Persist notification
    N->>U: WebSocket emit task:created
    U->>U: Invalidate query cache
```

### Camadas de Comunicação

1. **HTTP (Frontend ↔ API Gateway)**: REST API com autenticação JWT
2. **RPC TCP (Gateway ↔ Services)**: Comunicação síncrona entre microserviços
3. **RabbitMQ (Services ↔ Services)**: Eventos assíncronos para desacoplamento
4. **WebSocket (Notifications ↔ Frontend)**: Notificações em tempo real

---

## 🛠 Stack Tecnológica

### Frontend

| Tecnologia           | Versão                    | Função                                                                                                             |
| -------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **React**            | 19.2                      | UI library com Suspense nativo                                                                                     |
| **TypeScript**       | 5.7 (web) / 5.9 (backend) | Type safety end-to-end                                                                                             |
| **Vite**             | 7.1                       | Build tool performático                                                                                            |
| **TanStack Router**  | 1.132                     | Type-safe file-based routing                                                                                       |
| **TanStack Query**   | 5.66                      | Data fetching, cache e sincronização                                                                               |
| **Zustand**          | 5.0                       | State management minimalista                                                                                       |
| **shadcn/ui**        | latest                    | 12+ componentes (Button, Card, Dialog, Avatar, Badge, Calendar, Input, Label, Select, Textarea, Dropdown, Popover) |
| **Tailwind CSS**     | 4.0                       | Utility-first styling                                                                                              |
| **react-hook-form**  | 7.66                      | Form management                                                                                                    |
| **zod**              | 4.1                       | Schema validation                                                                                                  |
| **socket.io-client** | 4.8                       | WebSocket client                                                                                                   |
| **axios**            | 1.13                      | HTTP client                                                                                                        |
| **date-fns**         | 4.1                       | Date utilities                                                                                                     |
| **sonner**           | 2.0                       | Toast notifications                                                                                                |

### Backend

| Tecnologia            | Versão | Função                                           |
| --------------------- | ------ | ------------------------------------------------ |
| **NestJS**            | 11.1   | Framework de microserviços                       |
| **TypeORM**           | 0.3.27 | ORM com suporte a migrations                     |
| **PostgreSQL**        | 17.5   | Database relacional                              |
| **RabbitMQ**          | 3.13   | Message broker                                   |
| **amqplib**           | 0.10   | RabbitMQ client                                  |
| **Passport JWT**      | 4.0    | Authentication strategy                          |
| **argon2**            | 0.43   | Password hashing (mais seguro que bcrypt)        |
| **Pino**              | 10.1   | Structured logging (~5x mais rápido que Winston) |
| **nestjs-pino**       | 4.4    | Pino integration para NestJS                     |
| **class-validator**   | 0.14   | DTO validation                                   |
| **class-transformer** | 0.6    | DTO transformation                               |
| **Swagger**           | 11.0   | API documentation                                |

### Infraestrutura & DevOps

| Tecnologia         | Versão | Função                             |
| ------------------ | ------ | ---------------------------------- |
| **Docker**         | latest | Containerização                    |
| **Docker Compose** | latest | Orquestração de serviços           |
| **Turborepo**      | 2.5.8  | Monorepo build system com cache    |
| **pnpm**           | 8.15.6 | Package manager rápido e eficiente |
| **Jest**           | 30.2   | Backend testing                    |
| **Vitest**         | 3.0    | Frontend testing                   |

### Packages Compartilhados (Monorepo)

- **@repo/types**: Tipos TypeScript compartilhados (Task, User, Comment, Notification)
- **@repo/dto**: DTOs com class-validator para validação consistente
- **@repo/decorators**: Custom decorators NestJS (@CurrentUser, @Public)
- **@repo/utils**: Utilitários (error handling, formatters)
- **@repo/messaging**: RabbitMQ configuration e patterns
- **@repo/logger**: Pino configuration centralizada

---

## ✨ Funcionalidades

### ✅ Requisitos Obrigatórios

#### Autenticação & Autorização

- [x] Registro de usuários com validação (email, username, password)
- [x] Login com JWT (accessToken 15min + refreshToken 7 dias)
- [x] Refresh token endpoint para renovação
- [x] Hash de senha com **argon2** (mais seguro que bcrypt)
- [x] JWT Guards protegendo rotas privadas
- [x] Rate limiting (10 req/sec global + 5 req/min em auth)
- [x] Passport strategies para validação

#### Tarefas (CRUD Completo)

- [x] Criar tarefa com todos os campos obrigatórios
- [x] Listar tarefas com paginação
- [x] Filtros (prioridade, status, busca textual)
- [x] Visualizar detalhes de tarefa
- [x] Atualizar tarefa (título, descrição, prazo, prioridade, status)
- [x] Deletar tarefa
- [x] Atribuir tarefa a múltiplos usuários
- [x] Campos: título, descrição, deadline, prioridade (LOW/MEDIUM/HIGH/URGENT), status (TODO/IN_PROGRESS/REVIEW/DONE)

#### Comentários

- [x] Adicionar comentário em tarefa
- [x] Listar comentários com paginação
- [x] Exibir autor e timestamp
- [x] Integração com sistema de notificações

#### Notificações em Tempo Real

- [x] RabbitMQ para eventos assíncronos
- [x] Persistência de notificações em banco
- [x] WebSocket Gateway para entrega em tempo real
- [x] Eventos: tarefa criada, atualizada, status alterado, comentário adicionado
- [x] Notificações por usuário (rooms)
- [x] Marcar notificação como lida
- [x] Marcar todas como lidas

#### Frontend

- [x] Página de Login com validação
- [x] Página de Registro com validação
- [x] Lista de tarefas com filtros e busca
- [x] Página de detalhes da tarefa com comentários
- [x] 12+ componentes shadcn/ui (Button, Card, Dialog, Input, Select, etc)
- [x] Tailwind CSS para styling
- [x] TanStack Router (file-based routing)
- [x] react-hook-form + zod para validação
- [x] Zustand para state management (auth)
- [x] Skeleton loaders durante carregamento
- [x] Toast notifications (sonner)

#### Infraestrutura

- [x] Docker Compose com todos os serviços
- [x] PostgreSQL containerizado
- [x] RabbitMQ containerizado com management UI
- [x] Monorepo com Turborepo
- [x] Swagger/OpenAPI no API Gateway

#### Backend

- [x] NestJS com arquitetura de microserviços
- [x] TypeORM com entidades e relations
- [x] DTOs com class-validator em todos os endpoints
- [x] Microservices pattern com RabbitMQ
- [x] WebSocket Gateway para notificações
- [x] Rate limiting no API Gateway

### 🎁 Funcionalidades Bônus (Diferenciais)

#### TanStack Query

- [x] Cache automático de requisições
- [x] Background refetch
- [x] Optimistic updates
- [x] Invalidação de cache via WebSocket events
- [x] React Query DevTools

#### Health Checks

- [x] Endpoint /health em todos os serviços
- [x] API Gateway: verifica conectividade com microserviços
- [x] Auth Service: verifica database
- [x] Tasks Service: verifica database + RabbitMQ
- [x] Notifications Service: verifica database + RabbitMQ
- [x] Integração com Docker healthcheck

#### Logging Estruturado (Pino)

- [x] Package @repo/logger compartilhado
- [x] Logs JSON estruturados para produção
- [x] Pretty-print para desenvolvimento
- [x] Service names em todos os logs
- [x] Request/response serializers
- [x] Filtragem de health check logs
- [x] Context-aware logging

#### Testes

- [x] **60+ testes** distribuídos entre unit e E2E
- [x] AuthService: 15 unit tests (register, login, refresh, sign-out)
- [x] TasksService: 20 unit tests (CRUD, filters, assignments)
- [x] NotificationsGateway: 10 unit tests (WebSocket lifecycle)
- [x] E2E tests: 15 tests (auth flow completo)
- [x] Jest para backend
- [x] Vitest para frontend

### 🚀 Funcionalidades Extras (Além dos Requisitos)

#### Backend

- [x] Sign-out endpoint com invalidação de token
- [x] Audit logs tracking todas as alterações em tarefas
- [x] Custom decorators (@CurrentUser para extrair user do JWT)
- [x] Error handling padronizado com error codes
- [x] RPC exception filter para melhor debug
- [x] Shared packages para code reuse e type-safety

#### Frontend

- [x] Dark mode com persistência (light/dark/system)
- [x] Error boundary para catch de erros
- [x] Notification bell com badge de contagem
- [x] Status quick-update dropdown
- [x] Task edit dialog
- [x] Task delete confirmation
- [x] Authenticated layout com user dropdown
- [x] Real-time query invalidation via WebSocket
- [x] Responsive design
- [x] Portuguese error messages

---

## 🎯 Decisões Técnicas

### 1. Arquitetura de Microserviços

**Por quê?**

- **Separação de responsabilidades**: Cada serviço tem domínio claro (Auth, Tasks, Notifications)
- **Escalabilidade**: Serviços podem ser escalados independentemente
- **Manutenibilidade**: Mudanças isoladas não afetam outros serviços
- **Resiliência**: Falha em um serviço não derruba todo o sistema
- **Deploy independente**: CI/CD mais flexível

**Trade-offs**:

- ❌ Maior complexidade operacional (mais containers, mais configs)
- ❌ Overhead de comunicação entre serviços (RPC, eventos)
- ❌ Eventual consistency em alguns fluxos
- ✅ Sistema mais robusto e profissional
- ✅ Facilita trabalho em equipe
- ✅ Melhor isolamento de falhas

**Alternativa considerada**: Monolito modular

- ✅ Mais simples de deployar
- ❌ Acoplamento maior
- ❌ Escalabilidade limitada

### 2. RabbitMQ para Comunicação Assíncrona

**Por quê?**

- **Desacoplamento**: Tasks Service não precisa conhecer Notifications Service
- **Confiabilidade**: Mensagens são persistidas até serem consumidas
- **Performance**: Operações pesadas não bloqueam resposta HTTP
- **Flexibilidade**: Fácil adicionar novos consumidores sem alterar publishers
- **Reprocessamento**: Dead letter queues para mensagens com falha

**Trade-offs**:

- ❌ Complexidade adicional (broker, exchanges, queues)
- ❌ Sistema eventualmente consistente (notificações não são imediatas)
- ❌ Requer gestão do broker
- ✅ Sistema mais escalável e resiliente
- ✅ Permite processamento em batch

**Alternativa considerada**: HTTP webhooks

- ✅ Mais simples
- ❌ Acoplamento direto
- ❌ Sem garantia de entrega

### 3. WebSocket para Notificações

**Por quê?**

- **Baixa latência**: Notificações chegam em tempo real (<100ms)
- **Bidirectional**: Servidor pode enviar dados sem polling
- **Eficiente**: Mantém conexão persistente, evita overhead de HTTP
- **UX superior**: Usuário vê atualizações instantaneamente

**Trade-offs**:

- ❌ Requer gestão de conexões (reconexão, heartbeat, rooms)
- ❌ Mais complexo que polling
- ❌ Pode ter problemas com proxies/firewalls
- ✅ Experiência muito melhor
- ✅ Menor uso de banda que long polling

**Alternativa considerada**: Server-Sent Events (SSE)

- ✅ Mais simples (unidirecional)
- ❌ Só servidor → cliente
- ❌ Menos suportado

### 4. Monorepo com Turborepo

**Por quê?**

- **Code sharing**: Tipos, DTOs, utils compartilhados via @repo/*
- **Type-safety end-to-end**: Mesmos tipos entre frontend e backend
- **Build otimizado**: Cache inteligente, builds paralelos, affected tasks
- **DX melhorado**: Um `pnpm install`, scripts centralizados
- **Refactoring seguro**: Mudanças em tipos refletem em todo o codebase

**Trade-offs**:

- ❌ Repositório maior (mais arquivos)
- ❌ Configuração inicial mais complexa (tsconfig, paths, workspace)
- ✅ Zero duplicação de código
- ✅ Refactorings mais fáceis e seguros
- ✅ Single source of truth para tipos

**Alternativa considerada**: Polyrepo

- ✅ Repositórios independentes
- ❌ Duplicação de código
- ❌ Dificulta sincronização de tipos

### 5. TanStack Router para Frontend

**Por quê?**

- **Type-safe routing**: Rotas tipadas, parâmetros validados em compile-time
- **File-based routing**: Estrutura intuitiva (`_authenticated/`, `$taskId.tsx`)
- **Suspense nativo**: Suporte completo para React Suspense
- **Search params**: Gestão automática de query strings tipadas
- **Code splitting**: Lazy loading automático por rota

**Trade-offs**:

- ❌ Curva de aprendizado (menos conhecido que React Router)
- ❌ Ecossistema menor
- ✅ Type-safety superior
- ✅ Menos boilerplate
- ✅ Melhor integração com TanStack Query

**Alternativa considerada**: React Router v7

- ✅ Mais maduro e conhecido
- ❌ Menos type-safe
- ❌ Requer mais configuração

### 6. TanStack Query para Data Fetching

**Por quê?**

- **Cache automático**: Reduz chamadas desnecessárias, melhora performance
- **Background refetch**: Dados sempre frescos sem loading spinners
- **Optimistic updates**: UX mais responsiva
- **Retry logic**: Tenta novamente em caso de falha
- **DevTools**: Debug facilitado com React Query DevTools
- **Invalidação inteligente**: Integração com WebSocket para refresh automático

**Trade-offs**:

- ❌ Biblioteca adicional (~50kb)
- ✅ Reduz drasticamente boilerplate de useEffect
- ✅ Performance melhor que gerenciar manualmente

**Alternativa considerada**: SWR

- ✅ Mais leve (~15kb)
- ❌ Menos features (mutations, infinite queries, placeholders)
- ❌ Ecossistema menor

### 7. Zustand para Estado Global

**Por quê?**

- **Simples**: API minimal, sem boilerplate, apenas JavaScript
- **Performance**: Re-renders otimizados com selectors
- **DevTools**: Integração com Redux DevTools
- **Persistence**: Middleware para localStorage (auth state)
- **TypeScript**: Excelente suporte a tipos

**Trade-offs**:

- ❌ Menos features que Redux (sem middleware ecosystem grande)
- ✅ Muito mais simples para casos de uso comuns
- ✅ Menos código (80% menos que Redux)

**Alternativa considerada**: Context API

- ✅ Built-in no React
- ❌ Re-renders desnecessários
- ❌ Sem persistence, sem devtools

### 8. Pino para Logging

**Por quê?**

- **Performance**: ~5x mais rápido que Winston (assíncrono por padrão)
- **Estruturado**: JSON nativo, ideal para observability tools
- **Pretty print**: Desenvolvimento amigável com pino-pretty
- **Production-ready**: Níveis de log, contexts, serializers
- **Child loggers**: Context propagation (request ID, user ID)

**Trade-offs**:

- ❌ Menos transports built-in que Winston
- ✅ Muito mais rápido
- ✅ Melhor para produção (JSON estruturado)

**Alternativa considerada**: Winston

- ✅ Mais maduro, mais transports
- ❌ Mais lento (~5x)
- ❌ Configuração mais verbosa

### 9. argon2 para Hash de Senha

**Por quê?**

- **Segurança**: Vencedor do Password Hashing Competition (2015)
- **Resistente a GPU**: Protege contra ataques de força bruta massivos
- **Memory-hard**: Dificulta ataques com hardware especializado (ASICs)
- **Configurável**: Time cost, memory cost, parallelism

**Trade-offs**:

- ❌ Menos conhecido que bcrypt
- ✅ Significativamente mais seguro
- ✅ Recomendado por OWASP

**Alternativa considerada**: bcrypt

- ✅ Mais conhecido e testado no tempo
- ❌ Vulnerável a ataques GPU
- ❌ Menos seguro que argon2

### 10. TypeORM com Migrations

**Por quê?**

- **Versionamento**: Schema versionado no código
- **Segurança**: `synchronize: false` em produção previne perda de dados
- **Controle**: Mudanças explícitas e rastreáveis
- **CI/CD**: Migrations podem ser testadas antes do deploy
- **Rollback**: Revert de migrations em caso de problema

**Trade-offs**:

- ❌ Requer gestão manual de migrations
- ❌ Mais trabalho que synchronize: true
- ✅ Zero chance de perda de dados em produção
- ✅ Deploy seguro e confiável

**Alternativa considerada**: Prisma

- ✅ Type-safety melhor
- ❌ Menos maduro no ecossistema NestJS
- ❌ Sintaxe própria para queries

---

## 📅 Timeline de Desenvolvimento

Total: **13 dias** de desenvolvimento

```mermaid
gantt
    title Timeline de Desenvolvimento (13 dias)
    dateFormat  YYYY-MM-DD
    section Infraestrutura
    Setup Docker + Turborepo + Monorepo    :done, infra, 2025-01-01, 1d

    section Auth Service
    JWT + argon2 + Guards                   :done, auth, 2025-01-02, 5d
    Aprendizado NestJS                      :done, learn, 2025-01-02, 5d

    section Tasks Service
    CRUD + Comments + Audit                 :done, tasks, 2025-01-07, 2d

    section Notifications Service
    WebSocket + RabbitMQ Consumer           :done, notif, 2025-01-09, 3d
    Debugging WebSocket                     :done, debug, 2025-01-09, 3d

    section Frontend
    React + TanStack + shadcn/ui            :done, front, 2025-01-12, 2d

    section Testes & Docs
    Unit Tests + E2E + Health Checks        :done, tests, 2025-01-13, 1d
```

### Fase 1: Infraestrutura (Dia 1)

**Duração**: 1 dia

**Objetivo**: Preparar base do monorepo e containers

**Atividades**:

- Setup Turborepo com workspace pnpm
- Configuração Docker Compose (PostgreSQL, RabbitMQ)
- Estrutura inicial dos 4 apps + shared packages
- Configuração TypeScript, ESLint, Prettier
- Scripts de build e dev

**Resultado**: Monorepo funcional com hot reload

**Desafios**:

- Nunca havia trabalhado com monorepos antes, tive que aprender, mas achei muito mais fácil do que eu imaginava

### Fase 2: Auth Service (Dias 2-6)

**Duração**: 4-5 dias (incluindo aprendizado de NestJS)

**Objetivo**: Sistema de autenticação completo

**Contexto**: Não tinha experiência prévia com NestJS, precisei estudar:

- Módulos, providers, controllers
- Dependency injection
- Decorators customizados
- Microservices pattern
- Passport strategies

**Atividades**:

- Setup NestJS com TypeORM
- Entities: User
- Hash de senha com argon2
- JWT accessToken (15 min) + refreshToken (7 dias)
- Endpoints: register, login, refresh, sign-out
- Passport JWT strategy
- RPC controller para validação
- Unit tests (15 testes)

**Desafios**:

- Entender decorators e metadata do NestJS
- Configurar microservices transport (TCP)
- Aprender conceitos de separação de responsabilidades
- Aprender configurações do TypeORM
- Gestão de refresh tokens

**Resultado**: Auth service completo com testes

### Fase 3: Tasks Service (Dias 7-8)

**Duração**: 2 dias

**Objetivo**: CRUD de tarefas com comentários e audit

**Atividades**:

- Entities: Task, Comment, TaskAssignee, AuditLog
- CRUD completo com filtros e paginação
- Sistema de comentários
- Audit log para tracking de changes
- RabbitMQ publisher para eventos
- RPC controller
- Unit tests (20 testes)

**Desafios**:

- Relação entre User e Task entre microserviços
- Filtros dinâmicos com query builder
- Audit log automático

**Resultado**: Tasks service funcional com eventos

### Fase 4: Notifications Service (Dias 9-11)

**Duração**: 3 dias (com bugs complexos)

**Objetivo**: Notificações em tempo real via WebSocket

**Atividades**:

- WebSocket Gateway com socket.io
- JWT authentication para WebSocket
- User rooms para notificações direcionadas
- RabbitMQ consumer
- Persistência de notificações
- Endpoints para mark as read
- Unit tests (10 testes)

**Desafios (principais bugs)**:

- **Autenticação WebSocket**: Extrair e validar JWT do handshake
- **Room management**: Garantir que notificações vão só para usuários certos
- **Reconexão**: Garantir que cliente reconecta e se junta aos rooms corretos
- **RabbitMQ consumer**: Configurar acknowledgements e error handling corretamente

**Debugging**:

- Erro de ModuleRef, demorei dias para conseguir entender o motivo
- Configuração das filas no RabbitMQ

**Resultado**: Sistema de notificações real-time funcional

### Fase 5: API Gateway (Paralelo às Fases 2-4)

**Duração**: Desenvolvido em paralelo

**Atividades**:

- Routes para auth, tasks, user, notifications
- JWT Guards em rotas protegidas
- Rate limiting (10 req/sec + 5 req/min auth)
- Swagger/OpenAPI documentation
- Global exception filter
- Response interceptor
- E2E tests (15 testes)

**Resultado**: Gateway completo com documentação

### Fase 6: Frontend (Dias 12-13)

**Duração**: 2 dias

**Objetivo**: Interface completa e funcional

**Atividades**:

- Setup Vite + React 19 + TypeScript
- TanStack Router (file-based routing)
- TanStack Query (data fetching)
- Zustand store (auth state)
- shadcn/ui components (12+ componentes)
- Páginas: Login, Register, Task List, Task Detail
- WebSocket integration
- Dark mode
- Error boundary
- Forms com react-hook-form + zod

**Desafios**:

- Sincronização cache TanStack Query com WebSocket events
- Type-safe routing com parâmetros
- Otimização de re-renders

**Resultado**: UI moderna e responsiva

### Fase 7: Testes & Finalização (Durante todo o período)

**Duração**: Contínuo

**Atividades**:

- Health checks em todos os serviços
- Logging com Pino
- Unit tests (60+ testes total)
- E2E tests (auth flow)
- Documentação (README)
- .env.example files
- Docker optimization

**Resultado**: Sistema testado e documentado

### Aprendizados

**Técnicos**:

- NestJS facilita muito a comunicação entre microserviços
- TypeORM relations requerem atenção (eager loading, circular dependencies)
- WebSocket debugging é complexo
- Monorepo com Turborepo torna mais facil o desenvolvimento inicial de diferentes microserviços

**Processo**:

- Começar com auth foi boa decisão (base para tudo)
- Bugs com WebSocket tomaram mais tempo que esperado
- Bugs de dependências entre microserviços tomaram bastante tempo (Ex: ModuleRef)
- Configuração dos health checks no docker acabou sendo mais complicado do que imaginado
- Build dos types dentro do package foi bem chato, principalmente ao tentar usar os tipos no frontend

**Distribuição do Tempo**:

- Setup/Infra: 8%
- Auth (incluindo aprendizado): 38%
- Tasks: 15%
- Notifications (incluindo debugging): 23%
- Frontend: 15%
- Testes/Docs: contínuo

---

## 📁 Estrutura do Projeto

### Visão Geral

```
fullstack-challenge/
├── apps/                           # Aplicações
│   ├── web/                        # Frontend React
│   ├── api-gateway/                # HTTP Gateway
│   ├── auth-service/               # Microservice de autenticação
│   ├── tasks-service/              # Microservice de tarefas
│   └── notifications-service/      # Microservice de notificações
├── packages/                       # Shared packages
│   ├── types/                      # Tipos TypeScript
│   ├── dto/                        # DTOs compartilhados
│   ├── utils/                      # Utilitários
│   ├── logger/                     # Pino config
│   ├── messaging/                  # RabbitMQ config
│   ├── decorators/                 # Custom decorators
│   ├── ui/                         # shadcn/ui components
│   ├── typescript-config/          # tsconfig base
│   └── eslint-config/              # ESLint config
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

### Frontend (apps/web)

```
apps/web/
├── src/
│   ├── components/
│   │   ├── auth/                   # Login, Register
│   │   ├── tasks/                  # TaskList, TaskCard, TaskDetail, TaskForm
│   │   ├── notifications/          # NotificationBell
│   │   ├── layout/                 # Header, Sidebar, AuthenticatedLayout
│   │   ├── ui/                     # shadcn/ui components (12+)
│   │   ├── theme-provider.tsx      # Dark mode provider
│   │   └── error-boundary.tsx      # Error boundary
│   ├── hooks/
│   │   ├── use-auth.ts             # Auth hook
│   │   ├── use-socket.ts           # WebSocket hook
│   │   └── use-tasks.ts            # Tasks queries hook
│   ├── lib/
│   │   ├── api-client.ts           # Axios instance
│   │   ├── socket.ts               # Socket.io client
│   │   ├── query-keys.ts           # TanStack Query keys
│   │   ├── api/                    # API functions (auth, tasks, notifications)
│   │   └── validations/            # Zod schemas
│   ├── routes/
│   │   ├── __root.tsx              # Root layout
│   │   ├── index.tsx               # Home
│   │   ├── login.tsx               # Login page
│   │   ├── register.tsx            # Register page
│   │   ├── _authenticated.tsx      # Authenticated layout
│   │   └── _authenticated/
│   │       ├── tasks.tsx           # Task list
│   │       └── tasks/
│   │           └── $taskId.tsx     # Task detail
│   ├── stores/
│   │   └── auth-store.ts           # Zustand auth store
│   ├── main.tsx
│   ├── routeTree.gen.ts            # Generated routes
│   └── styles.css                  # Global styles
├── Dockerfile
├── vite.config.ts
└── package.json
```

### API Gateway (apps/api-gateway)

```
apps/api-gateway/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts      # POST register, login, refresh, sign-out
│   │   ├── auth.module.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts     # Passport JWT
│   ├── tasks/
│   │   ├── tasks.controller.ts     # CRUD endpoints
│   │   └── tasks.module.ts
│   ├── user/
│   │   ├── user.controller.ts      # GET /me, /users
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   ├── notifications/
│   │   ├── notifications.controller.ts
│   │   └── notifications.module.ts
│   ├── health/
│   │   ├── health.controller.ts    # GET /health
│   │   └── health.module.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # JWT Guard
│   │   └── public.guard.ts         # Public routes
│   ├── interceptors/
│   │   └── response.interceptor.ts # Transform responses
│   ├── filters/
│   │   └── global-exception.filter.ts
│   ├── app.module.ts               # Root module com rate limiting
│   └── main.ts                     # Bootstrap com Swagger
├── test/
│   ├── auth.e2e-spec.ts            # E2E tests (15 testes)
│   └── jest-e2e.json
├── Dockerfile
└── package.json
```

### Auth Service (apps/auth-service)

```
apps/auth-service/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts      # RPC controller
│   │   ├── auth.service.ts         # Business logic (JWT, argon2)
│   │   ├── auth.service.spec.ts    # 15 unit tests
│   │   └── auth.module.ts
│   ├── user/
│   │   ├── user.entity.ts          # TypeORM entity
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── config/
│   │   ├── data-source.ts          # TypeORM CLI config
│   │   └── database.config.ts      # TypeORM runtime config
│   ├── constants/
│   │   └── config.constants.ts
│   ├── app.module.ts
│   └── main.ts                     # TCP microservice
├── migrations/                     # TypeORM migrations
├── Dockerfile
└── package.json
```

### Tasks Service (apps/tasks-service)

```
apps/tasks-service/
├── src/
│   ├── tasks/
│   │   ├── tasks.controller.ts     # RPC controller
│   │   ├── tasks.service.ts        # Business logic
│   │   ├── tasks.service.spec.ts   # 20 unit tests
│   │   └── tasks.module.ts
│   ├── comments/
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── comments.module.ts
│   ├── audit/
│   │   ├── audit.service.ts        # Audit log tracking
│   │   └── audit.module.ts
│   ├── events/
│   │   ├── event-publisher.service.ts  # RabbitMQ publisher
│   │   └── events.module.ts
│   ├── entities/
│   │   ├── task.entity.ts          # Task entity
│   │   ├── comment.entity.ts       # Comment entity
│   │   ├── task-assignee.entity.ts # Many-to-many
│   │   └── audit-log.entity.ts     # Audit log
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── config/
│   │   ├── data-source.ts          # TypeORM CLI config
│   │   ├── database.config.ts      # TypeORM runtime config
│   │   └── rabbitmq.config.ts
│   ├── constants/
│   │   └── config.constants.ts
│   ├── app.module.ts
│   └── main.ts
├── migrations/
├── Dockerfile
└── package.json
```

### Notifications Service (apps/notifications-service)

```
apps/notifications-service/
├── src/
│   ├── notifications/
│   │   ├── notifications.controller.ts     # HTTP controller
│   │   ├── notifications.service.ts        # Business logic
│   │   ├── notifications.gateway.ts        # WebSocket Gateway
│   │   ├── notifications.gateway.spec.ts   # 10 unit tests
│   │   ├── notifications.consumer.ts       # RabbitMQ consumer
│   │   └── notifications.module.ts
│   ├── entities/
│   │   └── notification.entity.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── config/
│   │   ├── data-source.ts          # TypeORM CLI config
│   │   ├── database.config.ts      # TypeORM runtime config
│   │   └── rabbitmq.config.ts
│   ├── constants/
│   │   └── config.constants.ts
│   ├── app.module.ts
│   └── main.ts                             # HTTP + TCP
├── migrations/
├── Dockerfile
└── package.json
```

### Shared Packages

#### @repo/types

```
packages/types/
├── src/
│   ├── user.ts                     # User type
│   ├── task.ts                     # Task, Priority, Status types
│   ├── comment.ts                  # Comment type
│   ├── notification.ts             # Notification type
│   ├── errors.ts                   # Error types
│   ├── error-codes.ts              # Error code enum
│   ├── type-guards.ts              # Type guards
│   └── index.ts
└── package.json
```

#### @repo/dto

```
packages/dto/
├── src/
│   ├── auth/                       # RegisterDto, LoginDto, RefreshDto
│   ├── tasks/                      # CreateTaskDto, UpdateTaskDto, FilterDto
│   ├── comments/                   # CreateCommentDto
│   └── index.ts
└── package.json
```

#### @repo/logger

```
packages/logger/
├── src/
│   ├── logger.config.ts            # Pino configuration
│   └── index.ts
└── package.json
```

### Serviços e Portas

| Serviço                   | Porta | Protocolo | Função                           |
| ------------------------- | ----- | --------- | -------------------------------- |
| **web**                   | 3000  | HTTP      | Frontend React                   |
| **api-gateway**           | 3001  | HTTP      | API Gateway + Swagger            |
| **auth-service**          | 3002  | TCP       | Auth microservice (RPC)          |
| **tasks-service**         | 3003  | TCP       | Tasks microservice (RPC)         |
| **notifications-service** | 3004  | HTTP/WS   | Notifications + WebSocket        |
| **notifications-service** | 3005  | TCP       | Notifications microservice (RPC) |
| **db** (PostgreSQL)       | 5432  | TCP       | Database                         |
| **rabbitmq**              | 5672  | AMQP      | Message broker                   |
| **rabbitmq** (UI)         | 15672 | HTTP      | RabbitMQ Management              |

---

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8.15.6+ (`npm install -g pnpm`)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### 1. Clone o repositório

```bash
git clone <repository-url>
cd fullstack-challenge
```

### 2. Configure as variáveis de ambiente

Copie os arquivos `.env.example` para `.env` em cada serviço:

```bash
# Windows (PowerShell)
Copy-Item apps\web\.env.example apps\web\.env
Copy-Item apps\api-gateway\.env.example apps\api-gateway\.env
Copy-Item apps\auth-service\.env.example apps\auth-service\.env
Copy-Item apps\tasks-service\.env.example apps\tasks-service\.env
Copy-Item apps\notifications-service\.env.example apps\notifications-service\.env

# Linux/Mac
cp apps/web/.env.example apps/web/.env
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/auth-service/.env.example apps/auth-service/.env
cp apps/tasks-service/.env.example apps/tasks-service/.env
cp apps/notifications-service/.env.example apps/notifications-service/.env
```

> **Nota**: Os `.env.example` já contêm valores para desenvolvimento local. Apenas copie-os!

### 3. Execute com Docker Compose (Recomendado)

```bash
# Build e inicie todos os serviços
docker-compose up --build

# Ou em modo detached (background)
docker-compose up --build -d
```

Aguarde até ver as mensagens de sucesso:

```
✅ db                | database system is ready to accept connections
✅ rabbitmq          | Server startup complete
✅ auth-service      | Nest application successfully started
✅ tasks-service     | Nest application successfully started
✅ notifications     | WebSocket Gateway initialized
✅ api-gateway       | Nest application successfully started
✅ web               | ready in XXX ms
```

### 4. Acesse a aplicação

| Serviço         | URL                              | Descrição                |
| --------------- | -------------------------------- | ------------------------ |
| **Frontend**    | <http://localhost:3000>          | Interface React          |
| **API Gateway** | <http://localhost:3001>          | API REST                 |
| **Swagger**     | <http://localhost:3001/api/docs> | Documentação interativa  |
| **RabbitMQ UI** | <http://localhost:15672>         | Management (admin/admin) |

### 5. Teste a aplicação

1. Acesse <http://localhost:3000>
2. Clique em "Criar conta" e registre um usuário
3. Faça login com as credenciais criadas
4. Crie uma tarefa
5. Abra em outra aba/browser e veja a notificação em tempo real

### Executar Localmente (Sem Docker)

#### 1. Inicie as dependências (PostgreSQL e RabbitMQ)

```bash
docker-compose up db rabbitmq
```

#### 2. Instale as dependências

```bash
pnpm install
```

#### 3. Execute os serviços

**Opção A: Todos os serviços de uma vez (recomendado)**

```bash
# Inicia todos os services do backend
pnpm dev
```

O Turborepo irá iniciar todos os serviços em paralelo.

**Opção B: Serviços individuais**

```bash
# Terminal 1 - Auth Service
cd apps/auth-service
pnpm dev

# Terminal 2 - Tasks Service
cd apps/tasks-service
pnpm dev

# Terminal 3 - Notifications Service
cd apps/notifications-service
pnpm dev

# Terminal 4 - API Gateway
cd apps/api-gateway
pnpm dev

# Terminal 5 - Frontend
cd apps/web
pnpm dev
```

### Comandos Úteis

```bash
# Ver logs de um serviço específico
docker-compose logs -f api-gateway

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (limpa database)
docker-compose down -v

# Rebuild de um serviço específico
docker-compose up --build api-gateway

# Executar comando dentro de um container
docker-compose exec api-gateway sh

# Ver status dos containers
docker-compose ps

# Build de todos os packages (monorepo)
pnpm build

# Lint de todo o código
pnpm lint

# Format de todo o código
pnpm format
```

### Troubleshooting

#### Porta já em uso

```bash
# Ver processos usando a porta
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# Matar processo
# Linux/Mac
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

#### Erro de conexão com PostgreSQL

```bash
# Verificar se o container está rodando
docker-compose ps db

# Ver logs do PostgreSQL
docker-compose logs db

# Reiniciar o container
docker-compose restart db
```

#### Erro de conexão com RabbitMQ

```bash
# Verificar RabbitMQ
docker-compose ps rabbitmq

# Ver logs
docker-compose logs rabbitmq

# Acessar management UI
open http://localhost:15672
```

#### Frontend não conecta ao backend

1. Verifique se o `.env` do frontend está correto:

   ```
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=http://localhost:3004
   ```

2. Verifique se o API Gateway está rodando:

   ```bash
   curl http://localhost:3001/health
   ```

#### WebSocket não conecta

1. Verifique se o Notifications Service está rodando:

   ```bash
   curl http://localhost:3004/health
   ```

2. Verifique os logs:

   ```bash
   docker-compose logs notifications-service
   ```

3. Teste conexão manualmente no browser console:

   ```javascript
   const socket = io('http://localhost:3004/notifications', {
     auth: { token: '<seu-access-token>' }
   });
   socket.on('connect', () => console.log('Connected!'));
   ```

---

## 📚 Documentação da API

### Swagger UI

Acesse a documentação interativa completa em:

**<http://localhost:3001/api/docs>**

A documentação Swagger contém:

- Todos os endpoints com exemplos
- Schemas de request/response
- DTOs com validações
- Try it out para testar direto no browser
- Códigos de erro com descrições

### Endpoints Principais

#### Autenticação

##### Registrar Usuário

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "username": "johndoe",
  "password": "Password123!"
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe"
  }
}
```

##### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response**: Igual ao register

##### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

##### Sign Out

```http
POST /api/auth/sign-out
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**: `204 No Content`

#### Tarefas (Requer autenticação)

##### Listar Tarefas

```http
GET /api/tasks?page=1&size=10&priority=HIGH&status=TODO&search=bug
Authorization: Bearer <accessToken>
```

**Query Parameters**:

- `page` (opcional): Número da página (default: 1)
- `size` (opcional): Itens por página (default: 10)
- `priority` (opcional): LOW | MEDIUM | HIGH | URGENT
- `status` (opcional): TODO | IN_PROGRESS | REVIEW | DONE
- `search` (opcional): Busca em título e descrição

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Fix authentication bug",
      "description": "Users can't login",
      "deadline": "2025-12-31T23:59:59.000Z",
      "priority": "HIGH",
      "status": "TODO",
      "assignedUsers": [
        { "id": "uuid", "username": "johndoe" }
      ],
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "size": 10,
    "totalPages": 5
  }
}
```

##### Criar Tarefa

```http
POST /api/tasks
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Fix authentication bug",
  "description": "Users can't login with Google OAuth",
  "deadline": "2025-12-31T23:59:59.000Z",
  "priority": "HIGH",
  "status": "TODO",
  "assignedUserIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Response**: `201 Created` com tarefa criada

##### Ver Detalhes da Tarefa

```http
GET /api/tasks/:id
Authorization: Bearer <accessToken>
```

**Response**: Objeto da tarefa completo

##### Atualizar Tarefa

```http
PUT /api/tasks/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Fix authentication bug [RESOLVED]",
  "status": "DONE"
}
```

**Response**: Tarefa atualizada

##### Deletar Tarefa

```http
DELETE /api/tasks/:id
Authorization: Bearer <accessToken>
```

**Response**: `204 No Content`

#### Comentários

##### Adicionar Comentário

```http
POST /api/tasks/:id/comments
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "content": "Fixed in commit abc123. Please review."
}
```

**Response**:

```json
{
  "id": "uuid",
  "content": "Fixed in commit abc123. Please review.",
  "taskId": "task-uuid",
  "author": {
    "id": "user-uuid",
    "username": "johndoe"
  },
  "createdAt": "2025-01-01T15:30:00.000Z"
}
```

##### Listar Comentários

```http
GET /api/tasks/:id/comments?page=1&size=10
Authorization: Bearer <accessToken>
```

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Fixed in commit abc123",
      "author": {
        "id": "uuid",
        "username": "johndoe",
        "email": "john@example.com"
      },
      "createdAt": "2025-01-01T15:30:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "size": 10,
    "totalPages": 1
  }
}
```

#### Notificações

##### Listar Notificações

```http
GET /api/notifications?page=1&size=10
Authorization: Bearer <accessToken>
```

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "TASK_ASSIGNED",
      "message": "You were assigned to task 'Fix bug'",
      "data": {
        "taskId": "uuid",
        "taskTitle": "Fix authentication bug"
      },
      "read": false,
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "size": 10,
    "totalPages": 2
  }
}
```

##### Marcar Notificação Como Lida

```http
PATCH /api/notifications/:id/read
Authorization: Bearer <accessToken>
```

**Response**: Notificação atualizada

##### Marcar Todas Como Lidas

```http
POST /api/notifications/mark-all-read
Authorization: Bearer <accessToken>
```

**Response**: `204 No Content`

#### Usuários

##### Ver Perfil do Usuário Atual

```http
GET /api/user/me
Authorization: Bearer <accessToken>
```

**Response**:

```json
{
  "id": "uuid",
  "email": "john@example.com",
  "username": "johndoe",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

##### Listar Todos os Usuários

```http
GET /api/users
Authorization: Bearer <accessToken>
```

**Response**:

```json
[
  {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com"
  },
  {
    "id": "uuid-2",
    "username": "janedoe",
    "email": "jane@example.com"
  }
]
```

### Eventos WebSocket

#### Conexão

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3004/notifications', {
  auth: {
    token: accessToken // JWT token
  }
});

socket.on('connect', () => {
  console.log('Connected to notifications');
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

#### Eventos Recebidos

##### task:created

```javascript
socket.on('task:created', (notification) => {
  console.log('New task created:', notification);
  // {
  //   id: "uuid",
  //   type: "TASK_CREATED",
  //   message: "New task 'Fix bug' was created",
  //   data: { taskId: "uuid", taskTitle: "Fix bug" },
  //   read: false,
  //   createdAt: "2025-01-01T10:00:00.000Z"
  // }
});
```

##### task:updated

```javascript
socket.on('task:updated', (notification) => {
  console.log('Task updated:', notification);
  // {
  //   id: "uuid",
  //   type: "TASK_UPDATED",
  //   message: "Task 'Fix bug' was updated",
  //   data: {
  //     taskId: "uuid",
  //     taskTitle: "Fix bug",
  //     changes: ["status", "priority"]
  //   },
  //   read: false,
  //   createdAt: "2025-01-01T11:00:00.000Z"
  // }
});
```

##### comment:new

```javascript
socket.on('comment:new', (notification) => {
  console.log('New comment:', notification);
  // {
  //   id: "uuid",
  //   type: "TASK_COMMENTED",
  //   message: "johndoe commented on 'Fix bug'",
  //   data: {
  //     taskId: "uuid",
  //     taskTitle: "Fix bug",
  //     commentId: "uuid",
  //     authorUsername: "johndoe"
  //   },
  //   read: false,
  //   createdAt: "2025-01-01T12:00:00.000Z"
  // }
});
```

### Códigos de Erro

| Código                   | Descrição                       |
| ------------------------ | ------------------------------- |
| `USER_NOT_FOUND`         | Usuário não encontrado          |
| `USER_ALREADY_EXISTS`    | Email ou username já cadastrado |
| `INVALID_CREDENTIALS`    | Credenciais inválidas           |
| `INVALID_TOKEN`          | Token JWT inválido ou expirado  |
| `INVALID_REFRESH_TOKEN`  | Refresh token inválido          |
| `TASK_NOT_FOUND`         | Tarefa não encontrada           |
| `COMMENT_NOT_FOUND`      | Comentário não encontrado       |
| `NOTIFICATION_NOT_FOUND` | Notificação não encontrada      |
| `UNAUTHORIZED`           | Sem permissão                   |
| `VALIDATION_ERROR`       | Erro de validação de dados      |
| `RATE_LIMIT_EXCEEDED`    | Limite de requisições excedido  |

**Formato de erro**:

```json
{
  "message": "User not found",
  "errorCode": "USER_NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2025-01-01T10:00:00.000Z",
  "path": "/api/users/invalid-id"
}
```

---

## 🧪 Testes

### Cobertura de Testes

Total: **60+ testes** distribuídos entre unit e E2E

| Serviço                   | Tipo | Quantidade | Arquivo                         |
| ------------------------- | ---- | ---------- | ------------------------------- |
| **Auth Service**          | Unit | 15         | `auth.service.spec.ts`          |
| **Tasks Service**         | Unit | 20         | `tasks.service.spec.ts`         |
| **Notifications Service** | Unit | 10         | `notifications.gateway.spec.ts` |
| **API Gateway**           | E2E  | 15         | `auth.e2e-spec.ts`              |

### Executar Testes

#### Todos os Testes (Backend)

```bash
# Na raiz do monorepo
pnpm test

# Com coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

#### Testes por Serviço

**Auth Service**:

```bash
cd apps/auth-service
pnpm test

# Specific test
pnpm test -- auth.service.spec
```

**Tasks Service**:

```bash
cd apps/tasks-service
pnpm test
```

**Notifications Service**:

```bash
cd apps/notifications-service
pnpm test
```

#### E2E Tests (API Gateway)

```bash
cd apps/api-gateway
pnpm test:e2e
```

#### Frontend Tests

```bash
cd apps/web
pnpm test

# UI mode
pnpm test:ui
```

### Estrutura dos Testes

#### Auth Service (15 testes)

- ✅ `register()` - cria usuário com hash argon2
- ✅ `register()` - lança erro se email já existe
- ✅ `register()` - lança erro se username já existe
- ✅ `login()` - retorna tokens com credenciais válidas
- ✅ `login()` - lança erro com credenciais inválidas
- ✅ `login()` - lança erro se usuário não existe
- ✅ `validateToken()` - valida token válido
- ✅ `validateToken()` - lança erro com token inválido
- ✅ `validateToken()` - lança erro com token expirado
- ✅ `refresh()` - gera novos tokens com refresh token válido
- ✅ `refresh()` - lança erro com refresh token inválido
- ✅ `signOut()` - invalida refresh token
- ✅ Password hash - usa argon2
- ✅ JWT tokens - accessToken expira em 15 min
- ✅ JWT tokens - refreshToken expira em 7 dias

#### Tasks Service (20 testes)

- ✅ `create()` - cria tarefa com todos os campos
- ✅ `create()` - publica evento task.created no RabbitMQ
- ✅ `findAll()` - lista tarefas com paginação
- ✅ `findAll()` - filtra por priority
- ✅ `findAll()` - filtra por status
- ✅ `findAll()` - busca textual em title e description
- ✅ `findAll()` - combina múltiplos filtros
- ✅ `findOne()` - retorna tarefa por ID
- ✅ `findOne()` - lança erro se tarefa não existe
- ✅ `update()` - atualiza campos da tarefa
- ✅ `update()` - publica evento task.updated
- ✅ `update()` - cria audit log para mudanças
- ✅ `delete()` - remove tarefa
- ✅ `addComment()` - adiciona comentário
- ✅ `addComment()` - publica evento comment.new
- ✅ `getComments()` - lista comentários com paginação
- ✅ `assignUsers()` - atribui múltiplos usuários
- ✅ `assignUsers()` - remove atribuições anteriores
- ✅ Audit logs - tracking de CREATED, UPDATED, STATUS_CHANGED
- ✅ Relations - carrega assignedUsers e comments corretamente

#### Notifications Service (10 testes)

- ✅ `handleConnection()` - autentica via JWT
- ✅ `handleConnection()` - adiciona usuário ao room específico
- ✅ `handleConnection()` - rejeita conexão sem token
- ✅ `handleConnection()` - rejeita token inválido
- ✅ `handleDisconnect()` - remove usuário do room
- ✅ `consumeTaskCreated()` - persiste notificação
- ✅ `consumeTaskCreated()` - emite via WebSocket para usuário correto
- ✅ `consumeTaskUpdated()` - notifica usuários atribuídos
- ✅ `consumeCommentNew()` - notifica usuários atribuídos
- ✅ `markAsRead()` - marca notificação como lida

#### E2E Tests - API Gateway (15 testes)

- ✅ `POST /api/auth/register` - registra usuário
- ✅ `POST /api/auth/register` - retorna 409 se email existe
- ✅ `POST /api/auth/register` - valida campos obrigatórios
- ✅ `POST /api/auth/login` - autentica e retorna tokens
- ✅ `POST /api/auth/login` - retorna 401 com credenciais inválidas
- ✅ `POST /api/auth/refresh` - renova tokens
- ✅ `POST /api/auth/refresh` - retorna 401 com refresh token inválido
- ✅ `POST /api/auth/sign-out` - invalida tokens
- ✅ `GET /api/tasks` - requer autenticação
- ✅ `GET /api/tasks` - lista tarefas com filtros
- ✅ `POST /api/tasks` - cria tarefa
- ✅ `GET /api/tasks/:id` - retorna tarefa
- ✅ `PUT /api/tasks/:id` - atualiza tarefa
- ✅ `DELETE /api/tasks/:id` - remove tarefa
- ✅ Rate limiting - bloqueia após 10 req/sec

### Exemplo de Teste

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  describe('register', () => {
    it('creates user with argon2 hash', async () => {
      const dto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!'
      };

      const result = await service.register(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      const user = await userRepository.findOne({
        where: { email: dto.email }
      });
      expect(user.password).not.toBe(dto.password);
      expect(await argon2.verify(user.password, dto.password)).toBe(true);
    });

    it('throws error if email already exists', async () => {
      const dto = { email: 'existing@example.com', username: 'user', password: 'Pass123!' };
      await service.register(dto);

      await expect(service.register(dto)).rejects.toThrow('USER_ALREADY_EXISTS');
    });
  });
});
```

---

## 🏥 Health Checks & Observabilidade

### Health Checks

Todos os serviços implementam endpoint `/health` usando `@nestjs/terminus`.

#### API Gateway

```bash
curl http://localhost:3001/health
```

**Response**:

```json
{
  "status": "ok",
  "info": {
    "auth-service": { "status": "up" },
    "tasks-service": { "status": "up" },
    "notifications-service": { "status": "up" }
  }
}
```

Verifica conectividade via RPC com todos os microserviços.

#### Auth Service

```bash
curl http://localhost:3002/health
```

**Response**:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

Verifica conexão com PostgreSQL.

#### Tasks Service

```bash
curl http://localhost:3003/health
```

**Response**:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "rabbitmq": { "status": "up" }
  }
}
```

Verifica PostgreSQL e RabbitMQ.

#### Notifications Service

```bash
curl http://localhost:3004/health
```

**Response**:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "rabbitmq": { "status": "up" },
    "websocket": { "status": "up", "connections": 5 }
  }
}
```

Verifica PostgreSQL, RabbitMQ e número de conexões WebSocket ativas.

### Docker Health Checks

```yaml
# docker-compose.yml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

Services only start after dependencies are healthy:

```yaml
depends_on:
  auth-service:
    condition: service_healthy
```

### Logging Estruturado (Pino)

#### Configuração

Shared package `@repo/logger` com Pino:

```typescript
// packages/logger/src/logger.config.ts
export const loggerConfig = {
  pinoHttp: {
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    autoLogging: {
      ignore: (req) => req.url === '/health'
    }
  }
};
```

#### Logs em Desenvolvimento (Pretty Print)

```bash
docker-compose logs -f auth-service
```

```
[10:30:45.123] INFO  (auth-service/1234): User registered
    email: "john@example.com"
    userId: "uuid-123"
    method: "POST"
    url: "/auth/register"
    statusCode: 201
    responseTime: 45ms
```

#### Logs em Produção (JSON)

```json
{
  "level": 30,
  "time": 1704067200000,
  "pid": 1234,
  "hostname": "auth-service",
  "service": "auth-service",
  "msg": "User registered",
  "email": "john@example.com",
  "userId": "uuid-123",
  "method": "POST",
  "url": "/auth/register",
  "statusCode": 201,
  "responseTime": 45
}
```

Ideal para agregação em ferramentas como:

- **Elasticsearch** + **Kibana**
- **Datadog**
- **New Relic**
- **CloudWatch**

#### Contexto em Logs

```typescript
// Dentro de um service
this.logger.log({
  msg: 'Task created',
  taskId: task.id,
  userId: user.id,
  assignees: task.assignedUsers.length
});
```

#### Níveis de Log

- `trace` (10): Informações muito detalhadas
- `debug` (20): Debug durante desenvolvimento
- `info` (30): Eventos normais (default)
- `warn` (40): Avisos
- `error` (50): Erros
- `fatal` (60): Erros críticos

```typescript
this.logger.error({
  msg: 'Failed to publish event',
  error: error.message,
  stack: error.stack,
  event: 'task.created',
  taskId: task.id
});
```

### Monitoramento de Performance

#### Pino Request Logging

Automatically logs every request:

```json
{
  "level": 30,
  "msg": "request completed",
  "req": {
    "method": "POST",
    "url": "/api/tasks",
    "headers": { "user-agent": "..." }
  },
  "res": {
    "statusCode": 201
  },
  "responseTime": 45
}
```

#### RabbitMQ Management UI

Acesse: **<http://localhost:15672>** (admin/admin)

- Visualize filas, exchanges, connections
- Monitore taxa de mensagens (publish/consume)
- Veja mensagens aguardando processamento
- Debug dead letter queues

### Observabilidade Adicional (Futuro)

Para produção, considere adicionar:

1. **Distributed Tracing**
   - OpenTelemetry
   - Jaeger ou Zipkin
   - Trace requests across microservices

2. **Metrics**
   - Prometheus
   - Grafana dashboards
   - CPU, memory, response time metrics

3. **Error Tracking**
   - Sentry
   - Automatic error reporting
   - Stack traces e contexto

4. **APM (Application Performance Monitoring)**
   - Datadog APM
   - New Relic
   - End-to-end request tracing

---

## ✅ Requisitos vs Entregue

### Resumo

| Categoria        | Requisitos                                  | Entregue            | Status    |
| ---------------- | ------------------------------------------- | ------------------- | --------- |
| **Obrigatórios** | Todos os requisitos do desafio              | Todos implementados | ✅ 100%    |
| **Bônus**        | TanStack Query, Health Checks, Pino, Testes | Todos implementados | ✅ 100%    |
| **Extras**       | Features além dos requisitos                | 15+ features extras | ✅ Exceeds |

### Requisitos Obrigatórios ✅

#### Stack Obrigatória

- [x] **Frontend**: React.js + TanStack Router + shadcn/ui + Tailwind
- [x] **Backend**: Nest.js + TypeORM + RabbitMQ
- [x] **Infraestrutura**: Docker Compose + Monorepo (Turborepo)

#### Autenticação & Gateway

- [x] JWT com register/login (email, username, password)
- [x] Password hash com argon2 (requisito era bcrypt ou argon2)
- [x] accessToken (15 min) + refreshToken (7 dias)
- [x] Endpoint de refresh
- [x] Rotas protegidas com JWT Guards
- [x] Rate limiting (10 req/sec)
- [x] Swagger/OpenAPI no Gateway

#### Tarefas

- [x] CRUD completo
- [x] Campos: título, descrição, prazo, prioridade, status
- [x] Prioridades: LOW | MEDIUM | HIGH | URGENT
- [x] Status: TODO | IN_PROGRESS | REVIEW | DONE
- [x] Atribuição a múltiplos usuários
- [x] Filtros e paginação
- [x] Histórico de alterações (audit log)

#### Comentários

- [x] Criar comentário em tarefa
- [x] Listar com paginação
- [x] Informação de autor e timestamp

#### Notificações & Tempo Real

- [x] RabbitMQ para eventos
- [x] Notifications Service consome da fila
- [x] Persistência de notificações
- [x] Entrega via WebSocket
- [x] Eventos: tarefa criada, atualizada, novo comentário

#### Docker

- [x] Tudo roda com Docker Compose
- [x] Services, broker e database containerizados

#### Frontend Mínimo

- [x] Páginas: Login/Register, Lista de Tarefas, Detalhe
- [x] State: Zustand para auth
- [x] WebSocket para notificações
- [x] Validação: react-hook-form + zod
- [x] Mínimo 5 componentes shadcn/ui (entregue 12+)
- [x] Loading/Error states

#### Backend Mínimo

- [x] Nest.js com TypeORM + PostgreSQL
- [x] JWT com Guards e Passport
- [x] Swagger completo no Gateway
- [x] DTOs com class-validator
- [x] Microservices com RabbitMQ
- [x] WebSocket Gateway
- [x] TypeORM migrations (pastas criadas)
- [x] Rate limiting

### Funcionalidades Bônus (Diferenciais) ✅

#### TanStack Query

- [x] Implementado completamente
- [x] Cache automático
- [x] Background refetch
- [x] Optimistic updates
- [x] Invalidação via WebSocket events
- [x] React Query DevTools

#### Health Checks

- [x] Implementado em todos os serviços
- [x] Verificação de database
- [x] Verificação de RabbitMQ
- [x] Verificação de conectividade entre services
- [x] Integração com Docker healthcheck

#### Logging (Pino)

- [x] Package @repo/logger compartilhado
- [x] Logs estruturados (JSON)
- [x] Pretty print em desenvolvimento
- [x] Filtragem de health checks
- [x] Request/response logging
- [x] Context-aware (service names)

#### Testes Unitários

- [x] 60+ testes (muito além do esperado)
- [x] AuthService: 15 testes
- [x] TasksService: 20 testes
- [x] NotificationsGateway: 10 testes
- [x] E2E tests: 15 testes

### Funcionalidades Extras (Além dos Requisitos) 🚀

#### Backend

1. ✅ **Sign-out endpoint** - invalidação de refresh token
2. ✅ **argon2** em vez de bcrypt - mais seguro
3. ✅ **Custom decorators** - @CurrentUser para extrair user do JWT
4. ✅ **Error handling padronizado** - códigos de erro consistentes
5. ✅ **Shared packages** - @repo/types, @repo/dto, @repo/utils, etc.
6. ✅ **RPC exception filter** - melhor debug de erros RPC
7. ✅ **Type-safety end-to-end** - tipos compartilhados
8. ✅ **Audit logs detalhados** - tracking de todas as mudanças

#### Frontend

1. ✅ **12+ componentes shadcn/ui** (requisito era 5 mínimo)
2. ✅ **Dark mode** - light/dark/system com persistência
3. ✅ **Error boundary** - catch de erros do React
4. ✅ **Notification bell** - com badge de contagem
5. ✅ **Task edit dialog** - edição inline
6. ✅ **Task delete confirmation** - segurança extra
7. ✅ **Status quick-update** - dropdown para mudar status rápido
8. ✅ **Authenticated layout** - layout consistente com header
9. ✅ **User dropdown** - menu com logout
10. ✅ **Real-time query invalidation** - cache sincronizado via WebSocket
11. ✅ **Responsive design** - funciona em mobile
12. ✅ **Portuguese error messages** - mensagens de erro traduzidas
13. ✅ **Skeleton loaders** - melhor UX durante loading
14. ✅ **Toast notifications** - feedback visual
15. ✅ **Optimistic UI updates** - UX mais responsiva

#### Infraestrutura

1. ✅ **.env.example** - arquivos de exemplo para todos os serviços
2. ✅ **Docker optimization** - multi-stage builds, caching
3. ✅ **Turborepo cache** - builds mais rápidos
4. ✅ **pnpm** - package manager mais eficiente que npm

### O Que Excede os Requisitos

1. **Quantidade de testes**: 60+ testes vs "testes unitários" (diferencial)
2. **Componentes UI**: 12+ vs 5 mínimo
3. **Funcionalidades extras**: 15+ features não solicitadas
4. **Type-safety**: End-to-end com shared packages
5. **Logging**: Pino completo (diferencial implementado)
6. **Health checks**: Em todos os serviços (diferencial implementado)
7. **TanStack Query**: Completo com DevTools (diferencial implementado)
8. **argon2**: Mais seguro que bcrypt solicitado
9. **Dark mode**: Feature moderna não solicitada
10. **Documentação**: README extenso e detalhado

### Comparação Visual

```mermaid
graph LR
    A[Requisitos Obrigatórios] -->|100%| B[✅ Entregue]
    C[Diferenciais Bônus] -->|100%| D[✅ Entregue]
    E[Extras] -->|15+ features| F[✅ Excede]

    style B fill:#4caf50
    style D fill:#4caf50
    style F fill:#2196f3
```

---

## ⚠️ Problemas Conhecidos

### Limitações Atuais

#### 1. Migrations não geradas

**Descrição**: Pastas de migrations existem mas estão vazias. Schema foi criado com `synchronize: true`.

**Impacto**: Baixo para desenvolvimento, alto para produção.

**Solução**:

```bash
# Gerar migrations
cd apps/auth-service
pnpm migration:generate InitialSchema

cd apps/tasks-service
pnpm migration:generate InitialSchema

cd apps/notifications-service
pnpm migration:generate InitialSchema
```

**Produção**: Usar `synchronize: false` e rodar migrations antes do deploy.

#### 2. WebSocket Reconnection

**Descrição**: Cliente não tenta reconectar automaticamente após perda de conexão.

**Impacto**: Médio - usuário precisa recarregar página se conexão cair.

**Solução futura**:

```typescript
const socket = io(url, {
  auth: { token },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

#### 3. Cache Layer

**Descrição**: Sem Redis para caching de queries frequentes.

**Impacto**: Médio - mais carga no database.

**Solução futura**: Adicionar Redis para cache de:

- Lista de usuários
- Tarefas recentes
- Notificações não lidas (count)

#### 4. Paginação Cursor-based

**Descrição**: Paginação usa offset-based (page/size) em vez de cursor-based.

**Impacto**: Baixo - funciona bem até milhares de registros.

**Problema**: Itens podem ser duplicados/perdidos se lista mudar durante navegação.

**Solução futura**: Implementar cursor-based pagination para listas grandes.

#### 5. Autenticação Avançada

**Descrição**: Funcionalidades de auth não implementadas:

- Verificação de email
- Reset de senha
- 2FA (Two-Factor Authentication)
- Social login (Google, GitHub)

**Impacto**: Médio - features esperadas em produção.

**Solução futura**: Implementar conforme necessidade.

#### 6. Testes de Integração

**Descrição**: Testes cobrem units e E2E de auth, mas faltam testes de integração completos (ex: criar tarefa → receber notificação).

**Impacto**: Baixo - funcionalidade testada manualmente.

**Solução futura**: Adicionar testes E2E completos com múltiplos serviços.

#### 7. Performance

**Descrição**: Queries N+1 em alguns endpoints (ex: listar tarefas com assignees).

**Impacto**: Médio - pode causar lentidão com muitos dados.

**Solução**:

```typescript
// Usar eager loading
const tasks = await taskRepository.find({
  relations: ['assignedUsers', 'comments'],
  where: filters
});
```

Ou adicionar DataLoader para batch loading.

#### 8. File Uploads

**Descrição**: Sem suporte a anexos em tarefas/comentários.

**Impacto**: Baixo - não era requisito.

**Solução futura**: Adicionar upload de arquivos com:

- Multer para upload
- S3/MinIO para storage
- Validação de tipo e tamanho

### Melhorias Futuras

#### High Priority

1. ✅ **Gerar migrations** - 15 minutos
2. ✅ **WebSocket reconnection** - 30 minutos
3. ✅ **Testes E2E completos** - 2-3 horas

#### Medium Priority

4. ✅ **Redis cache** - 2-3 horas
5. ✅ **Cursor-based pagination** - 1-2 horas
6. ✅ **Performance optimization** (N+1) - 1 hora
7. ✅ **Email verification** - 2-3 horas

#### Low Priority

8. ✅ **2FA** - 3-4 horas
9. ✅ **Social login** - 3-4 horas
10. ✅ **File uploads** - 2-3 horas
11. ✅ **Full-text search** (PostgreSQL FTS ou Elasticsearch) - 4-6 horas
12. ✅ **Dashboard com analytics** - 1 semana
13. ✅ **i18n** (PT/EN) - 2-3 horas
14. ✅ **Email notifications** (além de WebSocket) - 2-3 horas
15. ✅ **Tags system** - 2-3 horas
16. ✅ **Teams/Organizations** - 1 semana

### Considerações de Produção

Para deploy em produção, considere:

1. **Environment Variables**: Usar secrets manager (AWS Secrets, Vault)
2. **Database**: PostgreSQL gerenciado (AWS RDS, Google Cloud SQL)
3. **Message Broker**: RabbitMQ gerenciado (CloudAMQP) ou Amazon MQ
4. **Logging**: Centralizar em ELK Stack, Datadog ou CloudWatch
5. **Monitoring**: Prometheus + Grafana ou New Relic
6. **Error Tracking**: Sentry
7. **CDN**: CloudFront ou Cloudflare para frontend
8. **SSL/TLS**: Certificados automáticos (Let's Encrypt)
9. **Backup**: Database backups automatizados
10. **CI/CD**: GitHub Actions, GitLab CI ou Jenkins
11. **Load Balancer**: Nginx ou AWS ALB
12. **Scaling**: Kubernetes ou AWS ECS

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

Desenvolvido como parte do desafio Full-stack - Jungle Gaming

Sistema completo de gestão de tarefas colaborativo com:

- ✅ Arquitetura de microserviços
- ✅ Notificações em tempo real
- ✅ Type-safety end-to-end
- ✅ 60+ testes
- ✅ Logging estruturado
- ✅ Health checks
- ✅ Documentação completa

---

**Questions?** Open an [issue](https://github.com/user/repo/issues)!
