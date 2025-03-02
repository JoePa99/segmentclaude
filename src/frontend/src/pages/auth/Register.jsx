import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  Link,
  useColorModeValue,
  Alert,
  AlertIcon,
  FormErrorMessage,
  Container,
  Flex,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Validation schema
const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required'),
  lastName: Yup.string()
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  organization: Yup.string()
    .required('Organization name is required')
});

const Register = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = async (values, actions) => {
    try {
      await register(
        values.firstName,
        values.lastName,
        values.email, 
        values.password,
        values.organization
      );
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || 'Failed to register. Please try again.');
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Container maxW={'md'} p={8}>
        <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
          <Stack align={'center'}>
            <Heading fontSize={'4xl'} textAlign="center" color="brand.500">
              MarketSegment
            </Heading>
            <Text fontSize={'lg'} color={'gray.600'}>
              Create a new account
            </Text>
          </Stack>
          <Box
            rounded={'lg'}
            bg={useColorModeValue('white', 'gray.700')}
            boxShadow={'lg'}
            p={8}
          >
            {(registerError || error) && (
              <Alert status="error" mb={4} borderRadius="md">
                <AlertIcon />
                {registerError || error}
              </Alert>
            )}
            
            <Formik
              initialValues={{ 
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                organization: ''
              }}
              validationSchema={RegisterSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <Stack spacing={4}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <Field name="firstName">
                          {({ field }) => (
                            <FormControl isInvalid={errors.firstName && touched.firstName}>
                              <FormLabel>First Name</FormLabel>
                              <Input {...field} type="text" />
                              <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>
                      </GridItem>
                      
                      <GridItem>
                        <Field name="lastName">
                          {({ field }) => (
                            <FormControl isInvalid={errors.lastName && touched.lastName}>
                              <FormLabel>Last Name</FormLabel>
                              <Input {...field} type="text" />
                              <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>
                      </GridItem>
                    </Grid>
                    
                    <Field name="email">
                      {({ field }) => (
                        <FormControl isInvalid={errors.email && touched.email}>
                          <FormLabel>Email address</FormLabel>
                          <Input
                            {...field}
                            type="email"
                            autoComplete="email"
                          />
                          <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    
                    <Field name="organization">
                      {({ field }) => (
                        <FormControl isInvalid={errors.organization && touched.organization}>
                          <FormLabel>Organization</FormLabel>
                          <Input {...field} type="text" />
                          <FormErrorMessage>{errors.organization}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    
                    <Field name="password">
                      {({ field }) => (
                        <FormControl isInvalid={errors.password && touched.password}>
                          <FormLabel>Password</FormLabel>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                          />
                          <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    
                    <Field name="confirmPassword">
                      {({ field }) => (
                        <FormControl isInvalid={errors.confirmPassword && touched.confirmPassword}>
                          <FormLabel>Confirm Password</FormLabel>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                          />
                          <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={isSubmitting}
                      loadingText="Creating Account"
                      size="lg"
                      mt={2}
                    >
                      Create Account
                    </Button>
                    
                    <Text align="center">
                      Already have an account?{' '}
                      <Link as={RouterLink} to="/login" color="brand.500">
                        Sign in
                      </Link>
                    </Text>
                  </Stack>
                </Form>
              )}
            </Formik>
          </Box>
        </Stack>
      </Container>
    </Flex>
  );
};

export default Register;