import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Box, Text, extendTheme } from '@chakra-ui/react'

// Super simple app for debugging
const App = () => {
  return (
    <Box p={5} textAlign="center">
      <Text fontSize="xl">Hello World - Basic React App</Text>
      <Text mt={4}>Environment: {window.location.href}</Text>
    </Box>
  )
}

// Create theme
const theme = extendTheme({})

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)