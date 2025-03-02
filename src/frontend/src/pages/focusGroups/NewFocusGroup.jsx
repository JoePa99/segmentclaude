import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Card,
  CardBody,
  CardHeader,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  IconButton,
  HStack,
  Divider,
  Icon,
  Checkbox,
  CheckboxGroup,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  VStack,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter
} from '@chakra-ui/react';
import { ChevronRightIcon, AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { FiArrowLeft, FiUpload, FiUsers, FiCheckCircle, FiMessageCircle, FiImage } from 'react-icons/fi';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { generateFocusGroup } from '../../services/directAIService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

// Validation schema
const FocusGroupSchema = Yup.object().shape({
  name: Yup.string()
    .required('Focus group name is required')
    .min(3, 'Name must be at least 3 characters'),
  questions: Yup.array()
    .of(
      Yup.string()
        .required('Question is required')
        .min(5, 'Question must be at least 5 characters')
    )
    .min(1, 'At least one question is required')
    .max(10, 'Maximum 10 questions allowed'),
  participantCount: Yup.number()
    .required('Number of participants is required')
    .min(3, 'At least 3 participants required')
    .max(12, 'Maximum 12 participants allowed'),
  selectedSegments: Yup.array()
    .of(Yup.string()),
  stimulusDescription: Yup.string()
});

const NewFocusGroup = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [project, setProject] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [tabIndex, setTabIndex] = useState(0);

  // Fetch project details and segments
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Get project data
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          setError('Project not found.');
          return;
        }
        
        const projectData = {
          id: projectDoc.id,
          ...projectDoc.data()
        };
        
        setProject(projectData);
        
        // Get segments for this project
        const segmentQuery = collection(db, 'segmentations');
        const segmentsQuerySnapshot = await getDocs(
          query(segmentQuery, where('projectId', '==', projectId))
        );
        
        // Extract segments from segmentations
        let extractedSegments = [];
        segmentsQuerySnapshot.docs.forEach(doc => {
          const segmentation = doc.data();
          if (segmentation.segments && Array.isArray(segmentation.segments)) {
            // Add segmentation ID reference to each segment
            const processedSegments = segmentation.segments.map(segment => ({
              ...segment,
              segmentationId: doc.id
            }));
            extractedSegments = [...extractedSegments, ...processedSegments];
          }
        });
        
        console.log('Extracted segments for focus group:', extractedSegments);
        setSegments(extractedSegments);
        
        // Check if project has segments
        if (extractedSegments.length === 0) {
          setError('This project does not have any segments. You need to generate segments before creating a focus group.');
          toast({
            title: 'No Segments Found',
            description: 'You need to generate segments before creating a focus group.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to fetch project details. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to fetch project details.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, currentUser, toast]);

  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image (JPG, PNG, GIF) or PDF file.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setFileUpload(file);
    
    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files (like PDFs), just show the file name
      setPreviewUrl(null);
    }
  };
  
  // Upload stimulus to Firebase Storage
  const uploadStimulus = async (file) => {
    if (!file) return null;
    
    const fileRef = ref(storage, `stimuli/${projectId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      downloadURL
    };
  };

  // Handle form submission
  const handleSubmit = async (values, actions) => {
    try {
      if (!currentUser) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to create a focus group.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setCreating(true);
      
      // Upload stimulus file if provided
      let stimulusData = null;
      if (fileUpload) {
        try {
          stimulusData = await uploadStimulus(fileUpload);
        } catch (uploadError) {
          console.error('Error uploading stimulus:', uploadError);
          toast({
            title: 'Upload Error',
            description: 'Failed to upload stimulus file. The focus group will be created without it.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }
      
      // Get selected segments or use all if none selected
      const segmentsToUse = values.selectedSegments && values.selectedSegments.length > 0 
        ? segments.filter(segment => values.selectedSegments.includes(segment.id))
        : segments;
        
      // Calculate how many participants per segment
      const totalSegments = segmentsToUse.length;
      const participantsPerSegment = Math.max(1, Math.floor(values.participantCount / totalSegments));
      let remainingParticipants = values.participantCount - (participantsPerSegment * totalSegments);
      
      // Create participants array
      const participants = [];
      segmentsToUse.forEach((segment, segmentIndex) => {
        // How many participants for this segment
        let count = participantsPerSegment;
        if (remainingParticipants > 0) {
          count++;
          remainingParticipants--;
        }
        
        // Create participants for this segment
        for (let i = 0; i < count; i++) {
          const participantNumber = participants.length + 1;
          participants.push({
            id: `p${participantNumber}`,
            name: `Participant ${participantNumber}`,
            segment: segment.name,
            segmentId: segment.id,
            demographics: `${segment.demographics?.age || "30-45"}, ${segment.demographics?.gender || "Mixed"}`
          });
        }
      });
      
      // Update status
      toast({
        title: 'Generating Focus Group',
        description: 'Using AI to generate realistic focus group responses...',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      // Pick the segment to use for the focus group
      // If multiple segments are selected, pick the first one for simplicity
      const segmentToUse = segmentsToUse.length > 0 ? segmentsToUse[0] : null;
      
      if (!segmentToUse) {
        throw new Error('No segment available for focus group generation');
      }
      
      console.log('Using segment for focus group:', segmentToUse.name, segmentToUse.id);
      
      // Use the question that will be the main discussion topic
      // If multiple questions, use the first one as the main prompt
      const mainQuestion = values.questions.length > 0 ? values.questions[0] : 'What factors are most important to you when making a purchase decision?';
      
      // Get project data for context
      const projectData = {
        id: projectId,
        name: project.name,
        industry: project.industry,
        businessType: project.businessType,
        description: project.description,
        objective: project.objective
      };
      
      // Generate the focus group using AI
      // Make sure we have valid model settings
      const modelSettings = project.modelSettings || { provider: 'anthropic', name: 'claude-3-5-sonnet' };
      console.log('Using model settings for focus group:', modelSettings);
      
      // If claude-3-5-sonnet has a date suffix, remove it
      let modelName = modelSettings.name;
      if (modelName && modelName.includes('claude-3-5-sonnet-')) {
        modelName = 'claude-3-5-sonnet';
      }
      
      // Generate focus group with AI
      const focusGroupResult = await generateFocusGroup(
        projectId,
        segmentToUse.id,
        mainQuestion,
        segmentToUse,
        projectData,
        {
          modelProvider: modelSettings.provider,
          modelName: modelName
        }
      );
      
      // Process the focus group transcript to match the expected structure
      // The FocusGroupDetail component expects a specific structure
      const processedTranscript = [];
      
      // Group transcript entries by moderator questions
      let currentQuestion = null;
      let currentResponses = [];
      
      console.log('Processing focus group transcript:', focusGroupResult.transcript);
      
      focusGroupResult.transcript.forEach((entry) => {
        // If it's the moderator, start a new question
        if (entry.speaker.toLowerCase().includes('moderator')) {
          // Save previous question and responses
          if (currentQuestion) {
            processedTranscript.push({
              question: currentQuestion,
              responses: [...currentResponses]
            });
          }
          
          // Start new question
          currentQuestion = entry.text;
          currentResponses = [];
        } else {
          // It's a participant response
          currentResponses.push({
            participant: entry.speaker,
            response: entry.text,
            segment: entry.details || '',
            details: entry.details || ''
          });
        }
      });
      
      // Add the last question and responses
      if (currentQuestion && currentResponses.length > 0) {
        processedTranscript.push({
          question: currentQuestion,
          responses: [...currentResponses]
        });
      }
      
      // If we didn't parse any questions, create a default structure
      if (processedTranscript.length === 0) {
        // Use the first question from values
        const defaultQuestion = values.questions[0] || "What factors are most important to you when making a purchase decision?";
        
        // Create a default transcript with all entries as responses
        processedTranscript.push({
          question: defaultQuestion,
          responses: focusGroupResult.transcript.map(entry => ({
            participant: entry.speaker,
            response: entry.text,
            segment: entry.details || '',
            details: entry.details || ''
          }))
        });
      }
      
      console.log('Processed transcript:', processedTranscript);
      
      // Format participants data in the expected structure
      const processedParticipants = focusGroupResult.participants.map((participant, index) => {
        // Extract details like age and occupation if available
        const details = participant.match(/\((.*?)\)/);
        const name = participant.replace(/\s*\(.*?\)\s*/, '');
        
        return {
          id: `p${index + 1}`,
          name: name,
          segment: values.selectedSegments && values.selectedSegments.length > 0 
            ? segmentToUse.name 
            : 'Participant',
          demographics: details ? details[1] : 'Consumer'
        };
      });
      
      // Create the focus group data structure
      const focusGroupData = {
        projectId: projectId,
        userId: currentUser.uid,
        name: values.name,
        questions: values.questions,
        participantCount: values.participantCount,
        selectedSegments: values.selectedSegments || [],
        createdAt: serverTimestamp(),
        status: 'completed',
        
        // Stimulus data if uploaded
        stimulus: stimulusData,
        stimulusDescription: values.stimulusDescription,
        
        // AI-generated focus group data - transformed for the UI
        participants: processedParticipants,
        transcript: processedTranscript,
        summary: focusGroupResult.summary,
        rawText: focusGroupResult.rawText,
        
        // Model information
        model: focusGroupResult.model
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'focusGroups'), focusGroupData);
      
      toast({
        title: 'Focus Group Created',
        description: 'Your synthetic focus group has been successfully created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate to the focus group detail page
      navigate(`/projects/${projectId}/focus-groups/${docRef.id}`);
    } catch (err) {
      console.error('Error creating focus group:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create focus group. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      actions.setSubmitting(false);
    } finally {
      setCreating(false);
    }
  };

  // Handle tab changes
  const handleTabChange = (index) => {
    setTabIndex(index);
  };
  
  // Navigate to next tab
  const goToNextTab = () => {
    if (tabIndex < 2) {
      setTabIndex(tabIndex + 1);
    }
  };
  
  // Navigate to previous tab
  const goToPrevTab = () => {
    if (tabIndex > 0) {
      setTabIndex(tabIndex - 1);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Center h="300px">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
      </Center>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxW="container.lg">
        <Breadcrumb 
          spacing="8px" 
          separator={<ChevronRightIcon color="gray.500" />}
          mb={4}
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to={`/projects/${projectId}`}>
              {project ? project.name : 'Project'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">New Focus Group</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
        
        <Button
          as={RouterLink}
          to={`/projects/${projectId}`}
          leftIcon={<FiArrowLeft />}
          variant="outline"
        >
          Back to Project
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg">
      {/* Breadcrumb navigation */}
      <Breadcrumb 
        spacing="8px" 
        separator={<ChevronRightIcon color="gray.500" />}
        mb={4}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to={`/projects/${projectId}`}>
            {project.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">New Focus Group</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Create Synthetic Focus Group</Heading>
        <Button
          as={RouterLink}
          to={`/projects/${projectId}`}
          leftIcon={<FiArrowLeft />}
          variant="outline"
        >
          Cancel
        </Button>
      </Flex>

      {/* Information Card */}
      <Card mb={6} variant="outline">
        <CardBody>
          <Stack spacing={3}>
            <Heading size="md">How Synthetic Focus Groups Work</Heading>
            <Text>
              Our AI will generate realistic responses from virtual participants representing each market segment.
            </Text>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Tips for effective focus groups:</Text>
                <Text fontSize="sm">
                  - Ask open-ended questions that encourage detailed responses<br />
                  - Upload visual stimuli (product designs, ads, etc.) for more specific feedback<br />
                  - Select specific segments to target or get a mix of all segments
                </Text>
              </Box>
            </Alert>
          </Stack>
        </CardBody>
      </Card>

      {/* Main Form */}
      <Formik
        initialValues={{
          name: 'New Focus Group',
          participantCount: 6,
          selectedSegments: [],
          questions: ['What factors are most important to you when making a purchase decision?'],
          stimulusDescription: ''
        }}
        validationSchema={FocusGroupSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, isSubmitting, setFieldValue }) => (
          <Form>
            <Card>
              <CardHeader>
                <Tabs variant="enclosed" colorScheme="brand" index={tabIndex} onChange={handleTabChange}>
                  <TabList>
                    <Tab><Icon as={FiUsers} mr={2} />Participants</Tab>
                    <Tab><Icon as={FiImage} mr={2} />Stimulus</Tab>
                    <Tab><Icon as={FiMessageCircle} mr={2} />Questions</Tab>
                  </TabList>
                </Tabs>
              </CardHeader>

              <CardBody>
                {tabIndex === 0 && (
                  <Stack spacing={6}>
                    <FormControl isInvalid={errors.name && touched.name}>
                      <FormLabel>Focus Group Name</FormLabel>
                      <Field name="name">
                        {({ field }) => (
                          <Input {...field} placeholder="E.g., Product Concept Testing" />
                        )}
                      </Field>
                      <FormErrorMessage>{errors.name}</FormErrorMessage>
                    </FormControl>
                  
                    <FormControl isInvalid={errors.participantCount && touched.participantCount}>
                      <FormLabel>Number of Participants</FormLabel>
                      <Field name="participantCount">
                        {({ field }) => (
                          <NumberInput
                            min={3}
                            max={12}
                            value={field.value}
                            onChange={(val) => setFieldValue(field.name, parseInt(val))}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        )}
                      </Field>
                      <FormErrorMessage>{errors.participantCount}</FormErrorMessage>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Select between 3-12 participants for your focus group.
                      </Text>
                    </FormControl>
                    
                    <FormControl isInvalid={errors.selectedSegments && touched.selectedSegments}>
                      <FormLabel>Market Segments to Include</FormLabel>
                      <Field name="selectedSegments">
                        {({ field, form }) => (
                          <Box borderWidth="1px" borderRadius="md" p={3}>
                            <Text fontSize="sm" mb={3}>
                              Select specific segments or leave empty to include all segments:
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                              {segments.map((segment) => (
                                <Checkbox
                                  key={segment.id}
                                  id={`segment-checkbox-${segment.id}`}
                                  isChecked={field.value && field.value.includes(segment.id)}
                                  onChange={(e) => {
                                    console.log(`Checkbox for segment ${segment.id} (${segment.name}) changed to ${e.target.checked}`);
                                    
                                    // Initialize field.value as empty array if undefined
                                    const currentValue = field.value || [];
                                    
                                    // Create a new array instead of using Set
                                    let newValue;
                                    if (e.target.checked) {
                                      // Add the id if checked
                                      newValue = [...currentValue, segment.id];
                                    } else {
                                      // Remove the id if unchecked
                                      newValue = currentValue.filter(id => id !== segment.id);
                                    }
                                    
                                    console.log('Setting field value to:', newValue);
                                    form.setFieldValue(field.name, newValue);
                                  }}
                                  colorScheme="brand"
                                >
                                  <HStack>
                                    <Text>{segment.name}</Text>
                                    <Badge colorScheme="blue">{segment.size || '10%'}</Badge>
                                  </HStack>
                                </Checkbox>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                      </Field>
                      <FormErrorMessage>{errors.selectedSegments}</FormErrorMessage>
                    </FormControl>
                  </Stack>
                )}
                
                {tabIndex === 1 && (
                  <Stack spacing={6}>
                    <Box borderWidth="1px" borderRadius="md" p={4}>
                      <FormLabel>Upload Stimulus (Optional)</FormLabel>
                      <Text fontSize="sm" mb={4} color="gray.600">
                        Upload an image or PDF file that participants will react to (e.g., product concept, advertisement, packaging design).
                      </Text>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/jpeg,image/png,image/gif,application/pdf"
                      />
                      
                      {!fileUpload ? (
                        <Button
                          onClick={() => fileInputRef.current.click()}
                          leftIcon={<FiUpload />}
                          colorScheme="brand"
                          variant="outline"
                        >
                          Upload Stimulus
                        </Button>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          <HStack justifyContent="space-between">
                            <Text fontWeight="medium">{fileUpload.name}</Text>
                            <HStack>
                              <Badge>
                                {fileUpload.type.split('/')[0]}
                              </Badge>
                              <Badge>
                                {(fileUpload.size / 1024).toFixed(0)} KB
                              </Badge>
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => {
                                  setFileUpload(null);
                                  setPreviewUrl(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                aria-label="Remove file"
                              />
                            </HStack>
                          </HStack>
                          
                          {previewUrl && (
                            <Box borderWidth="1px" borderRadius="md" p={3} textAlign="center">
                              <Image 
                                src={previewUrl} 
                                alt="Stimulus preview" 
                                maxH="200px" 
                                mx="auto"
                                objectFit="contain"
                              />
                            </Box>
                          )}
                        </VStack>
                      )}
                    </Box>
                    
                    <FormControl>
                      <FormLabel>Stimulus Description</FormLabel>
                      <Field name="stimulusDescription">
                        {({ field }) => (
                          <Textarea
                            {...field}
                            placeholder="Provide a brief description of the stimulus that participants will respond to..."
                            rows={3}
                          />
                        )}
                      </Field>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Describe what the participants are looking at to get more accurate responses.
                      </Text>
                    </FormControl>
                  </Stack>
                )}
                
                {tabIndex === 2 && (
                  <FieldArray name="questions">
                    {({ remove, push }) => (
                      <Stack spacing={5}>
                        {values.questions.map((question, index) => (
                          <FormControl 
                            key={index} 
                            isInvalid={errors.questions?.[index] && touched.questions?.[index]}
                          >
                            <HStack align="flex-start" spacing={3}>
                              <Box flexGrow={1}>
                                <FormLabel>Question {index + 1}</FormLabel>
                                <Field name={`questions.${index}`}>
                                  {({ field }) => (
                                    <Input {...field} placeholder="Enter your question here" />
                                  )}
                                </Field>
                                <FormErrorMessage>
                                  {errors.questions?.[index]}
                                </FormErrorMessage>
                              </Box>
                              <IconButton
                                aria-label="Remove question"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => remove(index)}
                                isDisabled={values.questions.length <= 1}
                                mt={8}
                              />
                            </HStack>
                          </FormControl>
                        ))}
                        
                        {typeof errors.questions === 'string' && (
                          <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            {errors.questions}
                          </Alert>
                        )}
                        
                        <Button
                          leftIcon={<AddIcon />}
                          onClick={() => push('')}
                          variant="outline"
                          isDisabled={values.questions.length >= 10}
                          alignSelf="flex-start"
                        >
                          Add Question
                        </Button>
                      </Stack>
                    )}
                  </FieldArray>
                )}
                
                <Divider my={6} />
                
                <Flex justify="space-between">
                  <Button 
                    variant="outline" 
                    onClick={goToPrevTab} 
                    isDisabled={tabIndex === 0}
                    leftIcon={<FiArrowLeft />}
                  >
                    Previous
                  </Button>
                  
                  {tabIndex < 2 ? (
                    <Button 
                      colorScheme="brand" 
                      onClick={goToNextTab}
                      rightIcon={<ChevronRightIcon />}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      colorScheme="brand"
                      isLoading={isSubmitting || creating}
                      loadingText="Creating..."
                      type="submit"
                    >
                      Generate Focus Group
                    </Button>
                  )}
                </Flex>
              </CardBody>
            </Card>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default NewFocusGroup;