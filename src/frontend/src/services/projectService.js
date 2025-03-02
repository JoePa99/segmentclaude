import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';

// Create a new project
export const createProject = async (userId, projectData) => {
  try {
    const projectRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending'
    });
    
    return { id: projectRef.id, ...projectData };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Get projects for a user
export const getUserProjects = async (userId) => {
  try {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(projectsQuery);
    const projects = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return projects;
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
};

// Get a single project by ID
export const getProject = async (projectId) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Project not found');
    }
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

// Update a project
export const updateProject = async (projectId, projectData) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      ...projectData,
      updatedAt: serverTimestamp()
    });
    
    return { id: projectId, ...projectData };
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    // First, delete all uploads associated with this project
    const uploadsQuery = query(
      collection(db, 'uploads'),
      where('projectId', '==', projectId)
    );
    
    const querySnapshot = await getDocs(uploadsQuery);
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      const uploadData = doc.data();
      if (uploadData.fileName) {
        // Delete the file from storage
        const fileRef = ref(storage, `uploads/${projectId}/${uploadData.fileName}`);
        deletePromises.push(deleteObject(fileRef));
      }
      // Delete the upload document
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    
    // Then delete the project
    await deleteDoc(doc(db, 'projects', projectId));
    
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Upload a file for a project
export const uploadFile = async (projectId, file) => {
  try {
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `uploads/${projectId}/${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Store the file metadata in Firestore
    const uploadRef = await addDoc(collection(db, 'uploads'), {
      projectId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      downloadURL,
      uploadedAt: serverTimestamp()
    });
    
    return {
      id: uploadRef.id,
      fileName: file.name,
      downloadURL
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get uploads for a project
export const getProjectUploads = async (projectId) => {
  try {
    const uploadsQuery = query(
      collection(db, 'uploads'),
      where('projectId', '==', projectId),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(uploadsQuery);
    const uploads = [];
    
    querySnapshot.forEach((doc) => {
      uploads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return uploads;
  } catch (error) {
    console.error('Error getting project uploads:', error);
    throw error;
  }
};

// Delete an upload
export const deleteUpload = async (uploadId) => {
  try {
    // Get the upload data first
    const uploadDoc = await getDoc(doc(db, 'uploads', uploadId));
    
    if (uploadDoc.exists()) {
      const uploadData = uploadDoc.data();
      
      // Delete file from storage
      const fileRef = ref(storage, `uploads/${uploadData.projectId}/${uploadData.fileName}`);
      await deleteObject(fileRef);
      
      // Delete the document
      await deleteDoc(doc(db, 'uploads', uploadId));
      
      return true;
    } else {
      throw new Error('Upload not found');
    }
  } catch (error) {
    console.error('Error deleting upload:', error);
    throw error;
  }
};