import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize Firebase Functions
const functions = getFunctions();

// Generate market segmentation
export const generateSegmentation = async (projectId, uploadIds, modelOptions = {}) => {
  try {
    console.warn('IMPORTANT: Firebase Functions approach is disabled. Using directAIService instead.');
    
    // Import the direct AI service rather than using Firebase Functions
    const { generateSegmentation: directGenerate } = await import('./directAIService');
    
    // Get project data
    const { collection, doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    // Fetch the project to pass to the direct AI service
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = {
      id: projectDoc.id,
      ...projectDoc.data()
    };
    
    // Use the direct AI service instead of Firebase Functions
    return await directGenerate(projectId, uploadIds, projectData, modelOptions);
  } catch (error) {
    console.error('Error generating segmentation:', error);
    throw error;
  }
};

// Generate synthetic focus group
export const generateFocusGroup = async (projectId, segmentId, prompt, modelOptions = {}) => {
  try {
    console.warn('IMPORTANT: Firebase Functions approach is disabled. Using directAIService instead.');
    
    // Import the direct AI service rather than using Firebase Functions
    const { generateFocusGroup: directGenerate } = await import('./directAIService');
    
    // Get project and segment data
    const { collection, doc, getDoc, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    // Fetch the project
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = {
      id: projectDoc.id,
      ...projectDoc.data()
    };
    
    // Fetch the segment
    const segmentationsRef = collection(db, 'segmentations');
    const segmentationsQuery = query(segmentationsRef, where('projectId', '==', projectId));
    const segmentationsSnapshot = await getDocs(segmentationsQuery);
    
    let segmentData = null;
    segmentationsSnapshot.forEach(doc => {
      const segmentation = doc.data();
      if (segmentation.segments) {
        const segment = segmentation.segments.find(s => s.id === segmentId);
        if (segment) {
          segmentData = segment;
        }
      }
    });
    
    if (!segmentData) {
      throw new Error('Segment not found');
    }
    
    // Use the direct AI service
    return await directGenerate(
      projectId, 
      segmentId, 
      prompt, 
      segmentData, 
      projectData, 
      modelOptions
    );
  } catch (error) {
    console.error('Error generating focus group:', error);
    throw error;
  }
};

// Save segmentation results
export const saveSegmentation = async (projectId, segmentationData) => {
  try {
    const segmentRef = await addDoc(collection(db, 'segmentations'), {
      projectId,
      segments: segmentationData.segments,
      summary: segmentationData.summary,
      createdAt: serverTimestamp()
    });
    
    // Update the project with the segmentation ID
    await updateDoc(doc(db, 'projects', projectId), {
      segmentationId: segmentRef.id,
      status: 'completed',
      updatedAt: serverTimestamp()
    });
    
    return {
      id: segmentRef.id,
      ...segmentationData
    };
  } catch (error) {
    console.error('Error saving segmentation:', error);
    throw error;
  }
};

// Get segmentation for a project
export const getSegmentation = async (projectId) => {
  try {
    const segmentationsQuery = query(
      collection(db, 'segmentations'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(segmentationsQuery);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting segmentation:', error);
    throw error;
  }
};

// Save focus group results
export const saveFocusGroup = async (projectId, segmentId, focusGroupData) => {
  try {
    const focusGroupRef = await addDoc(collection(db, 'focusGroups'), {
      projectId,
      segmentId,
      participants: focusGroupData.participants,
      transcript: focusGroupData.transcript,
      summary: focusGroupData.summary,
      createdAt: serverTimestamp()
    });
    
    return {
      id: focusGroupRef.id,
      ...focusGroupData
    };
  } catch (error) {
    console.error('Error saving focus group:', error);
    throw error;
  }
};

// Get focus groups for a segment
export const getSegmentFocusGroups = async (segmentId) => {
  try {
    const focusGroupsQuery = query(
      collection(db, 'focusGroups'),
      where('segmentId', '==', segmentId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(focusGroupsQuery);
    const focusGroups = [];
    
    querySnapshot.forEach((doc) => {
      focusGroups.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return focusGroups;
  } catch (error) {
    console.error('Error getting segment focus groups:', error);
    throw error;
  }
};