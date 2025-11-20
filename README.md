# Sistema de Custos - Confeitaria

Sistema web para cálculo automático de custos de receitas de confeitaria, desenvolvido com React, TypeScript, Firebase e Tailwind CSS.

## 🚀 Funcionalidades

### Módulo de Ingredientes
- ✅ Cadastro de ingredientes com nome, preço total, medida total e unidade base
- ✅ Cálculo automático do preço por unidade de medida
- ✅ Atualização de preços com recálculo automático
- ✅ Listagem e edição de ingredientes

### Módulo de Receitas
- ✅ Cadastro de receitas com lista de ingredientes e quantidades
- ✅ Cálculo automático do custo total da receita
- ✅ Cálculo de custo por porção (opcional)
- ✅ Atualização automática quando ingredientes mudam
- ✅ Visualização detalhada de receitas

### Dashboard
- ✅ Visão geral com estatísticas
- ✅ Total de ingredientes e receitas
- ✅ Custo total e médio das receitas
- ✅ Lista de receitas recentes

## 🛠️ Tecnologias

- **React 18** + **TypeScript** - Interface e tipagem
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Firebase** - Backend (Firestore + Authentication)
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Formulários
- **React Router** - Navegação

## 📦 Instalação

1. Clone o repositório ou navegue até a pasta do projeto

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto com as credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

## 🔥 Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative o **Authentication** (Email/Password)
4. Ative o **Firestore Database**
5. Configure as regras de segurança do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ingredientes
    match /ingredientes/{ingredienteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      // Subcoleção de histórico de ingredientes
      match /historico/{historicoId} {
        allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      }
    }
    
    // Receitas
    match /receitas/{receitaId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      // Subcoleção de histórico de receitas
      match /historico/{historicoId} {
        allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      }
    }
  }
}
```

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

### Build para Produção
```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

### Preview da Build
```bash
npm run preview
```

## 📝 Como Usar

1. **Criar Conta / Login**
   - Acesse a aplicação e crie uma conta ou faça login

2. **Cadastrar Ingredientes**
   - Vá para a aba "Ingredientes"
   - Clique em "Novo Ingrediente"
   - Preencha: Nome, Preço Total, Medida Total e Unidade Base
   - O sistema calculará automaticamente o preço por unidade

3. **Cadastrar Receitas**
   - Vá para a aba "Receitas"
   - Clique em "Nova Receita"
   - Adicione ingredientes e suas quantidades
   - O sistema calculará automaticamente o custo total
   - Opcionalmente, informe o número de porções para calcular o custo por porção

4. **Visualizar Dashboard**
   - Acesse a aba "Dashboard" para ver estatísticas gerais

## 🔄 Recálculo Automático

O sistema recalcula automaticamente:
- Preço por unidade quando um ingrediente é atualizado
- Custo total de todas as receitas que usam um ingrediente quando ele é atualizado
- Custo por porção quando o número de porções é informado

## 📄 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── Layout.tsx
│   └── Login.tsx
├── config/          # Configurações
│   └── firebase.ts
├── pages/           # Páginas principais
│   ├── Dashboard.tsx
│   ├── Ingredientes.tsx
│   └── Receitas.tsx
├── services/        # Serviços e lógica de negócio
│   └── receitasService.ts
├── store/           # Gerenciamento de estado (Zustand)
│   └── useStore.ts
├── types/           # Tipos TypeScript
│   └── index.ts
├── utils/           # Funções utilitárias
│   └── calculos.ts
├── App.tsx          # Componente principal
├── main.tsx         # Entry point
└── index.css        # Estilos globais
```

## 🎨 Personalização

O projeto usa Tailwind CSS, então você pode facilmente personalizar as cores e estilos editando as classes nos componentes ou configurando o `tailwind.config.js`.

## 📦 Deploy

### Firebase Hosting

1. Instale o Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Faça login:
```bash
firebase login
```

3. Inicialize o projeto:
```bash
firebase init hosting
```

4. Configure o diretório de build como `dist`

5. Faça o deploy:
```bash
npm run build
firebase deploy
```

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

