# 🚀 Guia de Início Rápido

## Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

Isso instalará todas as dependências necessárias (React, Firebase, Tailwind, etc.).

---

## Passo 2: Configurar o Firebase

### 2.1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"** ou **"Create a project"**
3. Digite um nome para o projeto (ex: "sistema-custos-confeitaria")
4. Aceite os termos e clique em **"Continuar"**
5. Desative o Google Analytics (ou mantenha ativo, como preferir)
6. Clique em **"Criar projeto"**

### 2.2. Ativar Authentication

1. No menu lateral, clique em **"Authentication"** (Autenticação)
2. Clique em **"Começar"** ou **"Get started"**
3. Vá na aba **"Sign-in method"** (Métodos de login)
4. Clique em **"Email/Password"**
5. Ative a opção e clique em **"Salvar"**

### 2.3. Criar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"** ou **"Create database"**
3. Escolha **"Começar no modo de teste"** (Start in test mode)
4. Escolha uma localização (ex: `southamerica-east1` para Brasil)
5. Clique em **"Ativar"**

### 2.4. Configurar Regras de Segurança

1. Na aba **"Regras"** do Firestore
2. Cole o seguinte código:

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
        // Permite leitura se o usuário está autenticado e o documento tem userId correspondente
        allow read: if request.auth != null && resource.data.userId == request.auth.uid;
        // Permite criação se o userId no documento corresponde ao usuário autenticado
        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
        // Histórico é imutável - não permite update/delete
      }
    }
    
    // Receitas
    match /receitas/{receitaId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      // Subcoleção de histórico de receitas
      match /historico/{historicoId} {
        // Permite leitura se o usuário está autenticado e o documento tem userId correspondente
        allow read: if request.auth != null && resource.data.userId == request.auth.uid;
        // Permite criação se o userId no documento corresponde ao usuário autenticado
        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
        // Histórico é imutável - não permite update/delete
      }
    }
  }
}
```

3. Clique em **"Publicar"**

### 2.5. Obter Credenciais do Firebase

1. No menu lateral, clique no ícone de **⚙️ Configurações** (Settings) > **Configurações do projeto**
2. Role até a seção **"Seus aplicativos"** ou **"Your apps"**
3. Clique no ícone **`</>`** (Web)
4. Registre um apelido (ex: "Web App") e clique em **"Registrar app"**
5. **COPIE** as credenciais que aparecem (você vai precisar delas no próximo passo)

---

## Passo 3: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo chamado **`.env`** (sem extensão)
2. Cole o seguinte conteúdo, substituindo pelos valores do Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**⚠️ IMPORTANTE:** Substitua os valores acima pelos valores reais do seu projeto Firebase!

---

## Passo 4: Executar o Projeto

No terminal, execute:

```bash
npm run dev
```

O sistema estará disponível em: **http://localhost:5173**

---

## Passo 5: Testar o Sistema

### 5.1. Criar Conta
1. Acesse http://localhost:5173
2. Clique em **"Não tem conta? Criar conta"**
3. Digite um email e senha
4. Clique em **"Criar Conta"**

### 5.2. Cadastrar Primeiro Ingrediente
1. Vá para a aba **"Ingredientes"**
2. Clique em **"+ Novo Ingrediente"**
3. Preencha:
   - Nome: `Farinha de Trigo`
   - Preço Total: `10.00`
   - Medida Total: `1000`
   - Unidade Base: `g`
4. Clique em **"Salvar"**
5. Observe que o sistema calcula automaticamente: **R$ 0,01 por grama**

### 5.3. Cadastrar Primeira Receita
1. Vá para a aba **"Receitas"**
2. Clique em **"+ Nova Receita"**
3. Preencha:
   - Nome: `Bolo Simples`
   - Selecione o ingrediente "Farinha de Trigo"
   - Quantidade: `300`
   - Unidade: `g`
4. Clique em **"+ Adicionar Ingrediente"** para adicionar mais ingredientes (se quiser)
5. Observe o **Custo Estimado** sendo calculado automaticamente
6. Clique em **"Salvar"**

### 5.4. Verificar Dashboard
1. Vá para a aba **"Dashboard"**
2. Veja as estatísticas gerais do sistema

---

## ✅ Pronto!

Seu sistema está funcionando! Agora você pode:

- ✅ Cadastrar quantos ingredientes quiser
- ✅ Criar receitas com múltiplos ingredientes
- ✅ Ver os custos calculados automaticamente
- ✅ Atualizar preços e ver as receitas recalcularem automaticamente

---

## 🐛 Problemas Comuns

### Erro: "Firebase: Error (auth/invalid-api-key)"
- Verifique se o arquivo `.env` está na raiz do projeto
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor após criar/editar o `.env`

### Erro: "Missing or insufficient permissions"
- Verifique se as regras do Firestore foram publicadas corretamente
- Verifique se você está logado no sistema

### Erro: "Module not found"
- Execute `npm install` novamente
- Verifique se está na pasta correta do projeto

---

## 📦 Deploy (Opcional)

Quando estiver pronto para colocar online:

1. Instale o Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Faça login:
```bash
firebase login
```

3. Inicialize o hosting:
```bash
firebase init hosting
```
- Escolha o projeto Firebase
- Diretório público: `dist`
- Configure como SPA: `Sim`
- Não sobrescreva o `index.html`

4. Faça o build e deploy:
```bash
npm run build
firebase deploy
```

---

## 💡 Dicas

- Os dados são salvos automaticamente no Firebase
- Cada usuário vê apenas seus próprios ingredientes e receitas
- Os cálculos são feitos em tempo real
- Você pode usar o sistema em qualquer dispositivo acessando a URL do deploy

