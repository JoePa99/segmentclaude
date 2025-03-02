import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Stack,
  useToast
} from '@chakra-ui/react';
import { AddIcon, ExternalLinkIcon, DeleteIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();
  const { currentUser } = useAuth();
  
  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    try {
      // Delete the project document
      await deleteDoc(doc(db, 'projects', projectId));
      
      // Update the UI by removing the deleted project
      setProjects(projects.filter(project => project.id !== projectId));
      
      toast({
        title: 'Project Deleted',
        description: 'Project has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const projectsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsList);
        setError('');
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to fetch projects. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to fetch projects.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser, toast]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'orange';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Handle Firebase Timestamp objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Render content based on loading and error states
  const renderContent = () => {
    if (loading) {
      return (
        <Center h="200px">
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

    if (error) {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      );
    }

    if (projects.length === 0) {
      return (
        <Box textAlign="center" py={10} px={6}>
          <Text fontSize="xl" mt={3} mb={6}>
            You don't have any market segmentation projects yet.
          </Text>
          <Button
            as={RouterLink}
            to="/projects/new"
            colorScheme="brand"
            leftIcon={<AddIcon />}
          >
            Create Your First Project
          </Button>
        </Box>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {projects.map((project) => (
          <Card key={project.id} boxShadow="md" height="100%">
            <CardHeader pb={1}>
              <Flex justify="space-between" align="center">
                <Heading size="md">{project.name}</Heading>
                <Badge colorScheme={getStatusColor(project.status)}>
                  {project.status || 'new'}
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody>
              <Stack spacing={2}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Business Type:</Text>
                  <Text fontSize="sm" fontWeight="medium">{project.businessType}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Industry:</Text>
                  <Text fontSize="sm" fontWeight="medium">{project.industry}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Created:</Text>
                  <Text fontSize="sm" fontWeight="medium">{formatDate(project.createdAt)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Segments:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {project.segments?.length || 0}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Focus Groups:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {project.focusGroups?.length || 0}
                  </Text>
                </Flex>
              </Stack>
            </CardBody>
            <Divider color="gray.200" />
            <CardFooter>
              <Flex justifyContent="space-between" width="100%">
                <Button
                  as={RouterLink}
                  to={`/projects/${project.id}`}
                  colorScheme="brand"
                  variant="ghost"
                  rightIcon={<ExternalLinkIcon />}
                  flex="1"
                  mr={2}
                >
                  View Project
                </Button>
                <Button 
                  colorScheme="red" 
                  variant="ghost"
                  size="sm"
                  leftIcon={<DeleteIcon />}
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
                      handleDeleteProject(project.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </Flex>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Container maxW="container.xl">
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">My Segmentation Projects</Heading>
          <Button
            as={RouterLink}
            to="/projects/new"
            colorScheme="brand"
            leftIcon={<AddIcon />}
          >
            New Project
          </Button>
        </Flex>
        {renderContent()}
      </Box>
    </Container>
  );
};

export default Dashboard;