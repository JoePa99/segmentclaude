import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  HStack,
  Input,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Tooltip,
  Card,
  CardBody,
  CardHeader,
  Textarea
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { createProject } from '../../services/projectService';
import ModelSelector from '../../components/ModelSelector';

// Validation schema
const ProjectSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Project name is required'),
  description: Yup.string()
    .max(500, 'Description must be less than 500 characters'),
  businessType: Yup.string()
    .oneOf(['B2B', 'B2C'], 'Please select a business type')
    .required('Business type is required'),
  industry: Yup.string()
    .required('Industry is required'),
  region: Yup.string()
    .required('Region is required'),
  objective: Yup.string()
    .max(1000, 'Objective must be less than 1000 characters')
});

const NewProject = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sliderValues, setSliderValues] = useState({
    demographics: 25,
    psychographics: 25,
    behaviors: 25,
    geography: 25
  });
  const [showTooltips, setShowTooltips] = useState({
    demographics: false,
    psychographics: false,
    behaviors: false,
    geography: false
  });
  
  // AI model settings
  const [modelProvider, setModelProvider] = useState('anthropic');
  const [modelName, setModelName] = useState('');

  // Update slider values ensuring they sum to 100
  const handleSliderChange = (name, value) => {
    const oldValue = sliderValues[name];
    const difference = value - oldValue;
    
    // Get other sliders
    const otherSliders = Object.keys(sliderValues).filter(key => key !== name);
    
    // Calculate how much to take from each other slider
    const decreasePerSlider = Math.floor(difference / otherSliders.length);
    
    // Create new values
    const newValues = { ...sliderValues, [name]: value };
    
    // Adjust other sliders
    let remaining = difference;
    for (const slider of otherSliders) {
      if (remaining <= 0) break;
      
      const newValue = Math.max(0, sliderValues[slider] - decreasePerSlider);
      const actualDecrease = sliderValues[slider] - newValue;
      newValues[slider] = newValue;
      remaining -= actualDecrease;
    }
    
    // Ensure total is 100
    const total = Object.values(newValues).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      // Adjust the last slider
      const lastSlider = otherSliders[otherSliders.length - 1];
      newValues[lastSlider] += (100 - total);
    }
    
    setSliderValues(newValues);
  };

  // Handle form submission
  const handleSubmit = async (values, actions) => {
    try {
      if (!currentUser) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a project',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const projectData = {
        ...values,
        weights: sliderValues,
        modelSettings: {
          provider: modelProvider,
          name: modelName
        }
      };
      
      // Create project in Firestore
      const project = await createProject(currentUser.uid, projectData);
      
      toast({
        title: 'Project created',
        description: 'Your new segmentation project has been created successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate to the project detail page
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Container maxW="container.lg">
      <Heading size="lg" mb={6}>Create New Segmentation Project</Heading>
      
      <Formik
        initialValues={{
          name: '',
          description: '',
          businessType: 'B2C',
          industry: '',
          region: 'US',
          objective: ''
        }}
        validationSchema={ProjectSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
              {/* Basic Project Information */}
              <Box>
                <Card mb={6}>
                  <CardHeader pb={0}>
                    <Heading size="md">Project Details</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={4}>
                      <Field name="name">
                        {({ field }) => (
                          <FormControl isInvalid={errors.name && touched.name} isRequired>
                            <FormLabel>Project Name</FormLabel>
                            <Input {...field} placeholder="E.g., Tech Industry Segmentation" />
                            <FormErrorMessage>{errors.name}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      
                      <Field name="description">
                        {({ field }) => (
                          <FormControl isInvalid={errors.description && touched.description}>
                            <FormLabel>Project Description</FormLabel>
                            <Textarea 
                              {...field} 
                              placeholder="Describe your segmentation project"
                              minHeight="100px"
                              resize="vertical"
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              General description of the project
                            </Text>
                            <FormErrorMessage>{errors.description}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      
                      <Field name="objective">
                        {({ field }) => (
                          <FormControl isInvalid={errors.objective && touched.objective}>
                            <FormLabel>What are you trying to accomplish?</FormLabel>
                            <Textarea 
                              {...field} 
                              placeholder="Describe your specific goals, questions, and what you want to learn from this segmentation"
                              minHeight="120px"
                              resize="vertical"
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Be specific about what you're trying to accomplish. This will guide the AI in creating more relevant segments.
                            </Text>
                            <FormErrorMessage>{errors.objective}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      
                      <Field name="businessType">
                        {({ field }) => (
                          <FormControl isInvalid={errors.businessType && touched.businessType} isRequired>
                            <FormLabel>Business Type</FormLabel>
                            <RadioGroup {...field}>
                              <HStack spacing={5}>
                                <Radio {...field} value="B2B">Business to Business (B2B)</Radio>
                                <Radio {...field} value="B2C">Business to Consumer (B2C)</Radio>
                              </HStack>
                            </RadioGroup>
                            <FormErrorMessage>{errors.businessType}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      
                      <Field name="industry">
                        {({ field }) => (
                          <FormControl isInvalid={errors.industry && touched.industry} isRequired>
                            <FormLabel>Industry</FormLabel>
                            <Input {...field} placeholder="E.g., Healthcare, Technology, Retail" />
                            <FormErrorMessage>{errors.industry}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      
                      <Field name="region">
                        {({ field }) => (
                          <FormControl isInvalid={errors.region && touched.region} isRequired>
                            <FormLabel>Region</FormLabel>
                            <Select {...field}>
                              <option value="US">United States</option>
                            </Select>
                            <FormErrorMessage>{errors.region}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </Stack>
                  </CardBody>
                </Card>
              </Box>
              
              {/* Weights Configuration */}
              <Box>
                <Card mb={6}>
                  <CardHeader pb={0}>
                    <Heading size="md">AI Model Selection</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Choose which AI model to use for segmentation
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <ModelSelector
                      modelProvider={modelProvider}
                      modelName={modelName}
                      onModelProviderChange={setModelProvider}
                      onModelNameChange={setModelName}
                      showSummaryOptions={false}
                    />
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader pb={0}>
                    <Heading size="md">Segmentation Weights</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Adjust how much emphasis to place on each factor
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={8} mt={2}>
                      {/* Demographics slider */}
                      <Box>
                        <FormLabel htmlFor="demographics">Demographics</FormLabel>
                        <Slider
                          id="demographics"
                          min={0}
                          max={100}
                          value={sliderValues.demographics}
                          onChange={(val) => handleSliderChange('demographics', val)}
                          onMouseEnter={() => setShowTooltips({ ...showTooltips, demographics: true })}
                          onMouseLeave={() => setShowTooltips({ ...showTooltips, demographics: false })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack bg="brand.500" />
                          </SliderTrack>
                          <Tooltip
                            hasArrow
                            bg="brand.500"
                            color="white"
                            placement="top"
                            isOpen={showTooltips.demographics}
                            label={`${sliderValues.demographics}%`}
                          >
                            <SliderThumb />
                          </Tooltip>
                        </Slider>
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Age, gender, income, education, etc.
                        </Text>
                      </Box>
                      
                      {/* Psychographics slider */}
                      <Box>
                        <FormLabel htmlFor="psychographics">Psychographics</FormLabel>
                        <Slider
                          id="psychographics"
                          min={0}
                          max={100}
                          value={sliderValues.psychographics}
                          onChange={(val) => handleSliderChange('psychographics', val)}
                          onMouseEnter={() => setShowTooltips({ ...showTooltips, psychographics: true })}
                          onMouseLeave={() => setShowTooltips({ ...showTooltips, psychographics: false })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack bg="brand.500" />
                          </SliderTrack>
                          <Tooltip
                            hasArrow
                            bg="brand.500"
                            color="white"
                            placement="top"
                            isOpen={showTooltips.psychographics}
                            label={`${sliderValues.psychographics}%`}
                          >
                            <SliderThumb />
                          </Tooltip>
                        </Slider>
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Values, attitudes, interests, lifestyle
                        </Text>
                      </Box>
                      
                      {/* Behaviors slider */}
                      <Box>
                        <FormLabel htmlFor="behaviors">Behaviors</FormLabel>
                        <Slider
                          id="behaviors"
                          min={0}
                          max={100}
                          value={sliderValues.behaviors}
                          onChange={(val) => handleSliderChange('behaviors', val)}
                          onMouseEnter={() => setShowTooltips({ ...showTooltips, behaviors: true })}
                          onMouseLeave={() => setShowTooltips({ ...showTooltips, behaviors: false })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack bg="brand.500" />
                          </SliderTrack>
                          <Tooltip
                            hasArrow
                            bg="brand.500"
                            color="white"
                            placement="top"
                            isOpen={showTooltips.behaviors}
                            label={`${sliderValues.behaviors}%`}
                          >
                            <SliderThumb />
                          </Tooltip>
                        </Slider>
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Purchasing patterns, product usage, brand interactions
                        </Text>
                      </Box>
                      
                      {/* Geography slider */}
                      <Box>
                        <FormLabel htmlFor="geography">Geography</FormLabel>
                        <Slider
                          id="geography"
                          min={0}
                          max={100}
                          value={sliderValues.geography}
                          onChange={(val) => handleSliderChange('geography', val)}
                          onMouseEnter={() => setShowTooltips({ ...showTooltips, geography: true })}
                          onMouseLeave={() => setShowTooltips({ ...showTooltips, geography: false })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack bg="brand.500" />
                          </SliderTrack>
                          <Tooltip
                            hasArrow
                            bg="brand.500"
                            color="white"
                            placement="top"
                            isOpen={showTooltips.geography}
                            label={`${sliderValues.geography}%`}
                          >
                            <SliderThumb />
                          </Tooltip>
                        </Slider>
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Location-based factors (urban/rural, region, climate)
                        </Text>
                      </Box>
                      
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="medium">Weights Distribution: Total must equal 100%</Text>
                          <Text fontSize="sm">Adjust sliders to emphasize factors that are most important for your segmentation.</Text>
                        </Box>
                      </Alert>
                    </Stack>
                  </CardBody>
                </Card>
              </Box>
            </SimpleGrid>
            
            <Flex justify="flex-end" mt={10}>
              <Button
                colorScheme="brand"
                isLoading={isSubmitting}
                loadingText="Creating Project..."
                type="submit"
                size="lg"
              >
                Create Project
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default NewProject;