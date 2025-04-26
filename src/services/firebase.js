// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import {
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

export { onAuthStateChanged };

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  databaseURL: "https://SEU_DOMINIO.firebaseio.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceOwningTab: false
});
const storage = getStorage(app);
const functions = getFunctions(app);

// Habilitar persistência offline para o Firestore
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Múltiplas abas abertas. A persistência só pode ser habilitada em uma aba por vez.');
    } else if (err.code === 'unimplemented') {
      console.log('O navegador atual não suporta todos os recursos necessários para habilitar a persistência');
    }
  });

// Funções de Autenticação
const loginUser = async (email, password) => {
  try {
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Credenciais inválidas');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    logEvent(analytics, 'login', { 
      method: 'email_password',
      email_domain: email.split('@')[1]
    });
    return userCredential.user;
  } catch (error) {
    console.error('Erro de login:', error.code);
    throw error;
  }
};

const registerUser = async (email, password, name) => {
  try {
    if (!email || !password || !name || 
        typeof email !== 'string' || 
        typeof password !== 'string' || 
        typeof name !== 'string' ||
        password.length < 6) {
      throw new Error('Dados de registro inválidos');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      name,
      email,
      profileComplete: false,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });
    
    logEvent(analytics, 'sign_up', { 
      method: 'email_password',
      email_domain: email.split('@')[1]
    });
    
    return userCredential.user;
  } catch (error) {
    console.error('Erro de registro:', error);
    throw error;
  }
};

const logoutUser = async () => {
  try {
    await signOut(auth);
    logEvent(analytics, 'logout');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
};

// Funções de Gerenciamento de Perfil
const getUserProfile = async (userId) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('ID de usuário inválido');
    }
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      delete userData.authToken;
      delete userData.sessionData;
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    throw error;
  }
};

const updateUserProfile = async (userId, data) => {
  try {
    if (!userId || !data || typeof userId !== 'string') {
      throw new Error('Dados de perfil inválidos');
    }
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      await setDoc(userRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      await setDoc(userRef, { ...data, createdAt: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};

// Funções de Propriedades
const addProperty = async (propertyData) => {
  try {
    if (!propertyData || typeof propertyData !== 'object') {
      throw new Error('Dados da propriedade inválidos');
    }
    const sanitizedData = {
      titulo: String(propertyData.titulo || '').slice(0, 100),
      endereco: String(propertyData.endereco || '').slice(0, 200),
      preco: Number(propertyData.preco) || 0,
      tipo: ['apartamento', 'casa', 'comercial'].includes(propertyData.tipo) ? propertyData.tipo : 'outro',
      descricao: String(propertyData.descricao || '').slice(0, 1000),
      criadoPor: propertyData.criadoPor,
      criadoEm: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'properties'), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar propriedade:', error);
    throw error;
  }
};

const getProperties = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'properties'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar propriedades:', error);
    throw error;
  }
};

const deleteProperty = async (propertyId) => {
  try {
    if (!propertyId || typeof propertyId !== 'string') {
      throw new Error('ID de propriedade inválido');
    }
    await deleteDoc(doc(db, 'properties', propertyId));
  } catch (error) {
    console.error('Erro ao excluir propriedade:', error);
    throw error;
  }
};

// Funções de Armazenamento
const uploadFile = async (file, path) => {
  try {
    if (!file || !path) {
      throw new Error('Arquivo ou caminho inválido');
    }
    const tiposImagemValidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposImagemValidos.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Apenas imagens são aceitas.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. O tamanho máximo é 5MB.');
    }
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload está ' + progress + '% concluído');
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Erro no upload de arquivo:', error);
    throw error;
  }
};

const deleteFile = async (path) => {
  try {
    if (!path || typeof path !== 'string') {
      throw new Error('Caminho de arquivo inválido');
    }
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    throw error;
  }
};

// Funções de Fotos da Propriedade
const addPropertyPhoto = async (propertyId, photoData) => {
  try {
    if (!propertyId || !photoData) {
      throw new Error('Dados da foto inválidos');
    }
    const sanitizedData = {
      url: photoData.url,
      categoria: ['comodos', 'fachada', 'exterior', 'outro'].includes(photoData.categoria)
        ? photoData.categoria
        : 'outro',
      descricao: String(photoData.descricao || '').slice(0, 200),
      uploadadoEm: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'properties', propertyId, 'photos'), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar foto:', error);
    throw error;
  }
};

const getPropertyPhotos = async (propertyId) => {
  try {
    if (!propertyId) {
      throw new Error('ID de propriedade inválido');
    }
    const querySnapshot = await getDocs(collection(db, 'properties', propertyId, 'photos'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    throw error;
  }
};

const deletePropertyPhoto = async (propertyId, photoId) => {
  try {
    if (!propertyId || !photoId) {
      throw new Error('IDs inválidos');
    }
    await deleteDoc(doc(db, 'properties', propertyId, 'photos', photoId));
  } catch (error) {
    console.error('Erro ao excluir foto:', error);
    throw error;
  }
};

// Função de Geração de Modelo 3D
const generate3DModel = async (fotos) => {
  try {
    if (!fotos || !Array.isArray(fotos)) {
      throw new Error('Dados de fotos inválidos');
    }

    const generateModel = httpsCallable(functions, 'gerarModelo3D');
    
    const response = await generateModel({
      fotos: fotos.map(foto => foto.url),
      resolucao: 'HD'
    });

    logEvent(analytics, 'gerar_modelo_3d', {
      quantidade_fotos: fotos.length
    });

    return response.data.modeloUrl;
  } catch (error) {
    console.error('Erro ao gerar modelo 3D:', error);
    throw new Error('Falha ao gerar modelo 3D: ' + error.message);
  }
};

// Funções de Conexão
const checkConnection = async () => {
  try {
    const testDoc = doc(db, 'connection_test', 'test');
    await getDoc(testDoc);
    console.log('Conexão com Firebase bem-sucedida');
    return true;
  } catch (error) {
    console.error('Erro de conexão com Firebase:', error);
    return false;
  }
};

const setupConnectionListener = () => {
  window.addEventListener('online', () => {
    console.log('Dispositivo online. Reconectando...');
    checkConnection();
  });
  
  window.addEventListener('offline', () => {
    console.log('Dispositivo offline. Recursos limitados disponíveis.');
  });
};

// Exportações
export {
  auth,
  db,
  storage,
  analytics,
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  addProperty,
  getProperties,
  deleteProperty,
  uploadFile,
  deleteFile,
  addPropertyPhoto,
  getPropertyPhotos,
  deletePropertyPhoto,
  checkConnection,
  setupConnectionListener,
  generate3DModel
};