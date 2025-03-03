import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Box, Text, extendTheme, Heading, VStack, Code, Alert, AlertIcon } from '@chakra-ui/react'

// Super simple app for debugging
const App = () => {
  // Add environment info
  const envInfo = {
    location: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  return (
    <Box p={8} maxWidth="800px" mx="auto" mt={10}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" color="blue.600">
          MarketSegment
        </Heading>
        
        <Alert status="warning">
          <AlertIcon />
          This is a simplified version for debugging Firebase authentication issues
        </Alert>
        
        <Box p={5} bg="white" shadow="md" borderRadius="md">
          <Heading as="h2" size="md" mb={4}>Environment Information</Heading>
          <Code p={3} borderRadius="md" width="100%" display="block" whiteSpace="pre-wrap">
            {JSON.stringify(envInfo, null, 2)}
          </Code>
        </Box>
      </VStack>
    </Box>
  )
}

// Create theme
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
  }
})

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)