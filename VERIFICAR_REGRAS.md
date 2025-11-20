# ⚠️ PROBLEMA CRÍTICO: Regras do Firestore Não Publicadas

## 🔴 O Erro "Missing or insufficient permissions" indica que as regras NÃO foram publicadas no Firebase!

### 🚨 ATENÇÃO: Este é o ÚNICO problema que está impedindo o histórico de funcionar!

### ✅ O que já foi feito:
- ✅ Regras corretas no arquivo `firestore.rules`
- ✅ Código verificando permissões antes de acessar subcoleções
- ✅ Logs detalhados para debug

### ❌ O que está faltando:
- ❌ **PUBLICAR AS REGRAS NO FIREBASE CONSOLE**

## 🚨 SOLUÇÃO URGENTE

### Opção 1: Firebase Console (Recomendado)

1. **Acesse:** https://console.firebase.google.com/
2. **Selecione o projeto:** `sistemacustos-82e4c`
3. **Vá em:** Firestore Database → **Regras** (Rules)
4. **Copie e cole EXATAMENTE este código:**

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
        // O código sempre filtra por userId na query, então isso é seguro
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
        // O código sempre filtra por userId na query, então isso é seguro
        allow read: if request.auth != null && resource.data.userId == request.auth.uid;
        // Permite criação se o userId no documento corresponde ao usuário autenticado
        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
        // Histórico é imutável - não permite update/delete
      }
    }
  }
}
```

5. **Clique em "Publicar" (Publish)**
6. **Aguarde 10-30 segundos**
7. **Recarregue a aplicação e teste novamente**

### Opção 2: Firebase CLI

Se você tem o Firebase CLI configurado:

```bash
# Certifique-se de estar no diretório do projeto
cd C:\Users\Mallmann\Desktop\SistemaCustos

# Faça login (se necessário)
firebase login

# Selecione o projeto
firebase use sistemacustos-82e4c

# Publique apenas as regras do Firestore
firebase deploy --only firestore:rules
```

## 🔍 Como Verificar se as Regras Foram Publicadas

1. Acesse o Firebase Console
2. Vá em Firestore Database → Regras
3. **Compare o código exibido com o código acima**
4. Se forem diferentes, as regras NÃO foram publicadas!

## ⚠️ IMPORTANTE

- As regras no arquivo `firestore.rules` do projeto estão corretas
- **MAS elas precisam ser publicadas manualmente no Firebase Console**
- Regras locais NÃO são aplicadas automaticamente
- Sem publicar, o erro "Missing or insufficient permissions" continuará aparecendo

## 📝 Após Publicar

1. Aguarde 10-30 segundos para propagação
2. Recarregue a aplicação (F5)
3. Tente editar o preço de um ingrediente
4. Clique em "Histórico"
5. Verifique o console - não deve haver mais erros de permissão

## 🆘 Se Ainda Não Funcionar

1. Verifique se você está logado com a conta correta no Firebase Console
2. Verifique se o projeto selecionado é `sistemacustos-82e4c`
3. Verifique se as regras foram realmente publicadas (compare no console)
4. Limpe o cache do navegador (Ctrl+Shift+Delete)
5. Faça logout e login novamente na aplicação

