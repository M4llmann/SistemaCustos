import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { auth } from '../config/firebase';

/**
 * Faz upload de uma imagem para o Firebase Storage
 * @param file Arquivo de imagem a ser enviado
 * @param userId ID do usuário (para organizar por usuário)
 * @param receitaId ID da receita (opcional, para atualização)
 * @returns URL da imagem após o upload
 */
export async function uploadImagemReceita(
  file: File,
  userId: string,
  receitaId?: string
): Promise<string> {
  // Verifica se o usuário está autenticado
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  // Valida o tipo do arquivo
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo deve ser uma imagem');
  }

  // Valida o tamanho (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('A imagem deve ter no máximo 5MB');
  }

  // Sanitiza o nome do arquivo
  const sanitizeFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop() || '';
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    return `${sanitized}.${ext}`;
  };

  const sanitizedFileName = sanitizeFileName(file.name);
  
  // Cria um nome único para o arquivo
  const timestamp = Date.now();
  const fileName = receitaId 
    ? `receitas/${userId}/${receitaId}_${timestamp}_${sanitizedFileName}`
    : `receitas/${userId}/${timestamp}_${sanitizedFileName}`;

  // Cria referência no Storage
  const storageRef = ref(storage, fileName);

  try {
    // Faz o upload
    await uploadBytes(storageRef, file);

    // Retorna a URL de download
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Erro detalhado no upload:', error);
    
    // Mensagens de erro mais específicas
    if (error.code === 'storage/unauthorized') {
      throw new Error('Acesso negado. Verifique as regras de segurança do Storage.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload cancelado.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Erro desconhecido no upload. Verifique sua conexão e tente novamente.');
    }
    
    throw error;
  }
}

/**
 * Deleta uma imagem do Firebase Storage
 * @param imageUrl URL da imagem a ser deletada
 */
export async function deletarImagemReceita(imageUrl: string): Promise<void> {
  try {
    // Extrai o caminho da URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
    
    if (path) {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    // Não lança erro para não bloquear a exclusão da receita
  }
}

