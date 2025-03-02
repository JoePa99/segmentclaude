import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Icon,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Divider,
  Stack,
  Avatar,
  HStack,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { ChevronRightIcon, DownloadIcon } from '@chakra-ui/icons';
import { FiArrowLeft, FiUsers, FiFileText, FiMessageCircle, FiImage } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const FocusGroupDetail = () => {
  const { projectId, focusGroupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  
  const [project, setProject] = useState(null);
  const [focusGroup, setFocusGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch focus group data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Get focus group data
        const focusGroupRef = doc(db, 'focusGroups', focusGroupId);
        const focusGroupDoc = await getDoc(focusGroupRef);
        
        if (!focusGroupDoc.exists()) {
          setError('Focus group not found.');
          return;
        }
        
        const focusGroupData = {
          id: focusGroupDoc.id,
          ...focusGroupDoc.data()
        };
        
        setFocusGroup(focusGroupData);
        
        // Get project data
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          setProject({
            id: projectDoc.id,
            ...projectDoc.data()
          });
        }
        
        setError('');
      } catch (err) {
        console.error('Error fetching focus group:', err);
        setError('Failed to fetch focus group data. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to fetch focus group data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, focusGroupId, currentUser, toast]);

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
  if (error || !focusGroup) {
    return (
      <Container maxW="container.xl">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error || 'Focus group not found'}
        </Alert>
        
        <Button
          as={RouterLink}
          to={`/projects/${projectId}`}
          leftIcon={<FiArrowLeft />}
          mt={4}
        >
          Back to Project
        </Button>
      </Container>
    );
  }

  // Get participant colors for consistent display
  const getParticipantColor = (index) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink', 'cyan', 'red'];
    return colors[index % colors.length];
  };

  // Extract data safely with defaults
  const questions = focusGroup.questions || [];
  const summary = focusGroup.summary || "No summary available.";
  const stimulus = focusGroup.stimulus || null;
  const stimulusDescription = focusGroup.stimulusDescription || "";

  return (
    <Container maxW="container.xl">
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
            {project?.name || 'Project'}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Focus Group</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Heading size="lg">Focus Group Results</Heading>
        <HStack>
          <Button
            as={RouterLink}
            to={`/projects/${projectId}`}
            leftIcon={<FiArrowLeft />}
            variant="outline"
          >
            Back to Project
          </Button>
        </HStack>
      </Flex>

      {/* Main content */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={8}>
        {/* Left Column - Participants, Stimulus and Summary */}
        <VStack spacing={6} align="stretch">
          {/* Participants Card */}
          <Card>
            <CardHeader>
              <HStack>
                <Icon as={FiUsers} mr={2} />
                <Heading size="md">Participants</Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4} align="stretch">
                {focusGroup?.participants && focusGroup.participants.map((participant, index) => (
                  <HStack key={participant.id || index} spacing={3}>
                    <Avatar size="sm" name={participant.name} bg={`${getParticipantColor(index)}.500`} color="white" />
                    <Box>
                      <Text fontWeight="bold">{participant.name}</Text>
                      <HStack spacing={2}>
                        <Badge colorScheme={getParticipantColor(index)} fontSize="xs">
                          {participant.segment}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">{participant.demographics}</Text>
                      </HStack>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Stimulus Card - Only shown if there's a stimulus */}
          {stimulus && (
            <Card>
              <CardHeader>
                <HStack>
                  <Icon as={FiImage} mr={2} />
                  <Heading size="md">Stimulus</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  {stimulus.fileType.startsWith('image/') ? (
                    <Box borderWidth="1px" borderRadius="md" p={3} textAlign="center">
                      <Image 
                        src={stimulus.downloadURL} 
                        alt={stimulus.fileName}
                        maxH="300px" 
                        mx="auto"
                        objectFit="contain"
                      />
                    </Box>
                  ) : (
                    <Button 
                      as="a" 
                      href={stimulus.downloadURL} 
                      target="_blank" 
                      leftIcon={<FiFileText />}
                      colorScheme="blue"
                      size="sm"
                    >
                      View {stimulus.fileName}
                    </Button>
                  )}
                  
                  {stimulusDescription && (
                    <Box mt={2}>
                      <Text fontWeight="medium" mb={1}>Description:</Text>
                      <Text fontSize="sm">{stimulusDescription}</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <HStack>
                <Icon as={FiFileText} mr={2} />
                <Heading size="md">Summary</Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Text>{summary}</Text>
            </CardBody>
          </Card>
        </VStack>

        {/* Center and Right Columns - Transcript */}
        <Box gridColumn={{ lg: "span 2" }}>
          <Card>
            <CardHeader>
              <HStack>
                <Icon as={FiMessageCircle} mr={2} />
                <Heading size="md">Transcript</Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={8} align="stretch">
                {focusGroup?.transcript && focusGroup.transcript.map((exchange, qIndex) => (
                  <Box key={qIndex}>
                    {/* Question */}
                    <HStack mb={4} bg="gray.50" p={3} borderRadius="md">
                      <Avatar 
                        size="sm" 
                        name="Moderator" 
                        bg="gray.600" 
                      />
                      <Box>
                        <Text fontWeight="bold">
                          Moderator <Badge ml={1}>Moderator</Badge>
                        </Text>
                        <Text fontWeight="medium" mt={1}>{exchange.question || questions[qIndex] || `Question ${qIndex + 1}`}</Text>
                      </Box>
                    </HStack>
                    
                    {/* Responses */}
                    <VStack spacing={4} align="stretch" pl={8}>
                      {exchange.responses && exchange.responses.map((response, rIndex) => {
                        // Find participant by name instead of ID, which is more reliable
                        const participantName = response.participant || response.speaker;
                        const participantIndex = rIndex;
                        
                        return (
                          <HStack key={rIndex} alignItems="flex-start" spacing={3}>
                            <Avatar 
                              size="sm" 
                              name={participantName} 
                              bg={`${getParticipantColor(participantIndex)}.500`}
                              color="white" 
                            />
                            <Box>
                              <HStack>
                                <Text fontWeight="bold">{participantName}</Text>
                                <Badge colorScheme={getParticipantColor(participantIndex)} fontSize="xs">
                                  {response.details || response.segment || "Participant"}
                                </Badge>
                              </HStack>
                              <Text mt={1}>{response.response || response.text}</Text>
                            </Box>
                          </HStack>
                        );
                      })}
                    </VStack>
                    
                    {qIndex < (focusGroup.transcript?.length || 0) - 1 && <Divider my={6} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default FocusGroupDetail;