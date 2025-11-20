@echo off
echo ========================================
echo   PUBLICAR REGRAS DO FIRESTORE
echo ========================================
echo.
echo Este script vai publicar as regras do Firestore no Firebase.
echo.
echo Certifique-se de que:
echo 1. Voce esta logado no Firebase CLI
echo 2. O projeto correto esta selecionado
echo.
pause

echo.
echo Publicando regras do Firestore...
firebase deploy --only firestore:rules

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo Se houve erros, verifique:
echo 1. Se voce esta logado: firebase login
echo 2. Se o projeto esta correto: firebase use sistemacustos-82e4c
echo.
pause

