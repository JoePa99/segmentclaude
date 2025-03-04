import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme, Box, Text, Alert, AlertIcon, AlertTitle, AlertDescription, Link } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import { useState, useEffect } from 'react';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/projects/NewProject';
import ProjectDetail from './pages/projects/ProjectDetail';
import FocusGroupDetail from './pages/focusGroups/FocusGroupDetail';
import NewFocusGroup from './pages/focusGroups/NewFocusGroup';

// Theme customization
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80c9ff',
      300: '#4db3ff',
      400: '#1a9cff',
      500: '#0080e6',
      600: '#0064b3',
      700: '#004980',
      800: '#002e4d',
      900: '#00131a',
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
});

function App() {
  const [configError, setConfigError] = useState(false);

  // Check for environment configuration errors - hardcode config for now
  useEffect(() => {
    // We're using hardcoded Firebase config now, so this check is less important
    // But we'll log any configuration warnings
    const hasApiKeys = import.meta.env.OPENAI_API_KEY && import.meta.env.ANTHROPIC_API_KEY;
    if (!hasApiKeys) {
      console.warn('Warning: API keys for OpenAI and/or Anthropic may be missing');
    }
  }, []);

  if (configError) {
    return (
      <ChakraProvider theme={theme}>
        <Box p={8} maxW="800px" mx="auto" mt={10}>
          <Alert 
            status="error" 
            variant="solid" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            textAlign="center" 
            borderRadius="md"
            py={6}
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="xl">
              Configuration Error
            </AlertTitle>
            <AlertDescription maxWidth="md">
              {configError === 'firebase' && (
                <>
                  <Text mb={4}>
                    Firebase configuration is missing or invalid. The application cannot connect to authentication services.
                  </Text>
                  <Text fontSize="sm" color="white">
                    This is likely due to missing environment variables in your Vercel deployment.
                    Make sure VITE_FIREBASE_API_KEY and other Firebase configuration variables are set.
                  </Text>
                </>
              )}
            </AlertDescription>
          </Alert>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="projects/new" element={<NewProject />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="projects/:projectId/focus-groups/new" element={<NewFocusGroup />} />
              <Route path="projects/:projectId/focus-groups/:focusGroupId" element={<FocusGroupDetail />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;