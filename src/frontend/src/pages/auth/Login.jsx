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
  AlertTitle,
  AlertDescription,
  FormErrorMessage,
  Container,
  Flex
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});

const Login = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (values, actions) => {
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle Firebase API key errors distinctly
      if (error.code === 'auth/invalid-api-key') {
        setLoginError('Unable to authenticate - Firebase configuration error. Please check the console or contact support.');
      } else {
        setLoginError(error.message || 'Failed to login. Please check your credentials.');
      }
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
              Sign in to access your account
            </Text>
          </Stack>
          <Box
            rounded={'lg'}
            bg={useColorModeValue('white', 'gray.700')}
            boxShadow={'lg'}
            p={8}
          >
            {(loginError || error) && (
              <Alert status="error" mb={4} borderRadius="md">
                <AlertIcon />
                {loginError || error}
              </Alert>
            )}
            
            {/* Firebase bypass notice */}
            <Alert status="info" mb={4} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Firebase Auth Bypassed</AlertTitle>
                <AlertDescription>
                  Firebase authentication is currently bypassed. Enter any email and password to log in without Firebase.
                </AlertDescription>
              </Box>
            </Alert>
            
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <Stack spacing={4}>
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
                    
                    <Field name="password">
                      {({ field }) => (
                        <FormControl isInvalid={errors.password && touched.password}>
                          <FormLabel>Password</FormLabel>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="current-password"
                          />
                          <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={isSubmitting}
                      loadingText="Signing in"
                      size="lg"
                      mt={2}
                    >
                      Sign in
                    </Button>
                    
                    <Text align="center">
                      Don't have an account?{' '}
                      <Link as={RouterLink} to="/register" color="brand.500">
                        Sign up
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

export default Login;