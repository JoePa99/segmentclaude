import { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  Box,
  Alert,
  AlertIcon,
  Progress,
  VStack,
  HStack,
  Icon,
  useToast
} from '@chakra-ui/react';
import { FiUpload, FiFile, FiCheckCircle, FiX } from 'react-icons/fi';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

/**
 * Modal component for uploading research documents
 */
const UploadDocumentModal = ({ isOpen, onClose, projectId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const toast = useToast();
  const { currentUser } = useAuth();

  // Reset state when modal opens
  const onModalOpen = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploading(false);
    setError('');
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
      setSelectedFile(null);
      return;
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    setError('');
  };

  // Handle file upload to Firebase Storage
  const handleUpload = async () => {
    if (!selectedFile || !currentUser) {
      setError('Please select a file to upload or log in first.');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      console.log('Starting upload for project:', projectId);
      console.log('Current user:', currentUser.uid);
      
      // Create a reference to the file in Firebase Storage
      const fileRef = ref(storage, `uploads/${projectId}/${selectedFile.name}`);
      
      // Upload the file with progress monitoring
      const uploadTask = uploadBytesResumable(fileRef, selectedFile);
      
      // Set up the progress observer
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log('Upload progress:', progress);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setError(`Failed to upload file: ${error.message}`);
          setUploading(false);
          
          toast({
            title: 'Upload Error',
            description: `Storage error: ${error.message}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        },
        async () => {
          // Upload completed successfully
          try {
            console.log('File uploaded successfully to storage');
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL obtained:', downloadURL);
            
            // Create the document data
            const uploadData = {
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              fileSize: selectedFile.size,
              downloadURL,
              projectId,
              userId: currentUser.uid,
              uploadedAt: serverTimestamp(),
              status: 'pending'
            };
            
            console.log('Saving to Firestore with data:', uploadData);
            
            // Add upload data to Firestore
            const uploadDoc = await addDoc(collection(db, 'uploads'), uploadData);
            console.log('Document saved with ID:', uploadDoc.id);
            
            setUploadProgress(100);
            
            // Wait 1 second to show complete progress
            setTimeout(() => {
              setUploading(false);
              setSelectedFile(null);
              
              if (onUploadSuccess) {
                onUploadSuccess({
                  id: uploadDoc.id,
                  fileName: selectedFile.name,
                  downloadURL
                });
              }
              
              toast({
                title: 'Upload Complete',
                description: 'File was successfully uploaded.',
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
            }, 1000);
          } catch (err) {
            console.error('Error saving upload data to Firestore:', err);
            setError(`Failed to save upload data: ${err.message}`);
            setUploading(false);
            
            toast({
              title: 'Firestore Error',
              description: `Database error: ${err.message}`,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      );
    } catch (err) {
      console.error('General upload error:', err);
      setUploading(false);
      setError(`Upload failed: ${err.message}`);
      
      toast({
        title: 'Upload Error',
        description: `General error: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clear file selection
  const handleClearFile = () => {
    setSelectedFile(null);
    setError('');
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get the file extension
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  // Get file size in readable format
  const getFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} onOpen={onModalOpen} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Upload Research Document</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Upload a PDF, DOCX, or TXT file to enhance your segmentation analysis with
              industry-specific insights.
            </Text>
            
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}
            
            <FormControl>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              
              {!selectedFile ? (
                <Box
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={6}
                  textAlign="center"
                  _hover={{ borderColor: 'brand.400', cursor: 'pointer' }}
                  onClick={handleBrowseClick}
                >
                  <Icon as={FiUpload} boxSize={8} color="gray.400" mb={2} />
                  <Text fontWeight="medium">Click to browse or drag and drop</Text>
                  <Text fontSize="sm" color="gray.500">
                    PDF, DOCX, TXT (10MB max)
                  </Text>
                </Box>
              ) : (
                <Box
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={4}
                >
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiFile} color="brand.500" />
                      <Box>
                        <Text fontWeight="medium">{selectedFile.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {getFileExtension(selectedFile.name)} • {getFileSize(selectedFile.size)}
                        </Text>
                      </Box>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearFile}
                      aria-label="Remove file"
                    >
                      <Icon as={FiX} />
                    </Button>
                  </HStack>
                </Box>
              )}
            </FormControl>
            
            {uploading && (
              <Box>
                <Text fontSize="sm" mb={1}>
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                </Text>
                <Progress
                  value={uploadProgress}
                  size="sm"
                  colorScheme="brand"
                  borderRadius="md"
                />
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={uploading}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            leftIcon={<FiUpload />}
            onClick={handleUpload}
            isLoading={uploading}
            loadingText="Uploading..."
            isDisabled={!selectedFile || uploading}
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UploadDocumentModal;