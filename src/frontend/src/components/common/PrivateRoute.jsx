import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';

/**
 * A wrapper component for routes that require authentication
 * Redirects to login if not authenticated
 */
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Render child components if authenticated
  return children;
};

export default PrivateRoute;