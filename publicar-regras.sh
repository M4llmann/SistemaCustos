#!/bin/bash

echo "========================================"
echo "  PUBLICAR REGRAS DO FIRESTORE"
echo "========================================"
echo ""
echo "Este script vai publicar as regras do Firestore no Firebase."
echo ""
echo "Certifique-se de que:"
echo "1. Você está logado no Firebase CLI"
echo "2. O projeto correto está selecionado"
echo ""
read -p "Pressione Enter para continuar..."

echo ""
echo "Publicando regras do Firestore..."
firebase deploy --only firestore:rules

echo ""
echo "========================================"
echo "  CONCLUÍDO!"
echo "========================================"
echo ""
echo "Se houve erros, verifique:"
echo "1. Se você está logado: firebase login"
echo "2. Se o projeto está correto: firebase use sistemacustos-82e4c"
echo ""

