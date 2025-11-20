# 🔐 Como Publicar as Regras do Firestore

## ⚠️ IMPORTANTE: O erro "Missing or insufficient permissions" ocorre porque as regras não foram publicadas no Firebase!

## 📋 Passo a Passo

### 1. Acesse o Firebase Console
- Vá para: https://console.firebase.google.com/
- Selecione seu projeto: **sistemacustos-82e4c**

### 2. Navegue até as Regras do Firestore
- No menu lateral, clique em **"Firestore Database"**
- Clique na aba **"Regras"** (Rules)

### 3. Cole as Regras Atualizadas
Copie e cole o seguinte código COMPLETO na área de regras:

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
        // IMPORTANTE: Para queries funcionarem, o userId deve estar no documento e na query
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
        // IMPORTANTE: Para queries funcionarem, o userId deve estar no documento e na query
        allow read: if request.auth != null && resource.data.userId == request.auth.uid;
        // Permite criação se o userId no documento corresponde ao usuário autenticado
        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
        // Histórico é imutável - não permite update/delete
      }
    }
  }
}
```

### 4. Publique as Regras
- Clique no botão **"Publicar"** (Publish) no topo da página
- Aguarde a confirmação de que as regras foram publicadas

### 5. Aguarde a Propagação
- As regras podem levar alguns segundos para serem propagadas
- Aguarde 10-30 segundos após publicar

### 6. Teste Novamente
- Recarregue a página da aplicação (F5)
- Tente editar o preço de um ingrediente
- Clique em "Histórico"
- Verifique se não há mais erros de permissão no console

## 🔧 Alternativa: Usar Firebase CLI

Se você preferir usar o terminal:

```bash
# Certifique-se de estar no diretório do projeto
cd C:\Users\Mallmann\Desktop\SistemaCustos

# Faça login no Firebase (se ainda não fez)
firebase login

# Selecione o projeto
firebase use sistemacustos-82e4c

# Publique apenas as regras do Firestore
firebase deploy --only firestore:rules
```

## ✅ Verificação

Após publicar as regras, você deve ver:
- ✅ Sem erros de "Missing or insufficient permissions" no console
- ✅ Histórico sendo salvo ao editar ingredientes
- ✅ Histórico sendo exibido ao clicar no botão "Histórico"

## 🆘 Se Ainda Não Funcionar

1. **Verifique se as regras foram publicadas:**
   - Volte ao Firebase Console > Firestore Database > Regras
   - Confirme que as regras mostradas são as mesmas que você colou

2. **Verifique se está autenticado:**
   - No console do navegador, verifique se o `userId` está sendo exibido corretamente
   - Faça logout e login novamente se necessário

3. **Limpe o cache do navegador:**
   - Pressione Ctrl+Shift+Delete
   - Limpe o cache e cookies
   - Recarregue a página

4. **Verifique os logs:**
   - Abra o console do navegador (F12)
   - Procure por mensagens de erro ou sucesso relacionadas ao histórico

## 📝 Nota Importante

As regras no arquivo `firestore.rules` do projeto estão corretas. O problema é que elas **precisam ser publicadas no Firebase Console** para entrarem em vigor. As regras locais não são aplicadas automaticamente - elas precisam ser publicadas manualmente.

