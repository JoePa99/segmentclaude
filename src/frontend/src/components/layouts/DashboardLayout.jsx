import { Outlet } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Image,
  Text,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Avatar,
  Icon
} from '@chakra-ui/react';
import { HamburgerIcon, ChevronDownIcon, AddIcon } from '@chakra-ui/icons';
import { FiHome, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Top navigation */}
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        align={'center'}
        boxShadow="sm"
      >
        {/* Mobile menu button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="outline"
          aria-label="open menu"
          icon={<HamburgerIcon />}
        />

        {/* Logo */}
        <HStack spacing={8} alignItems={'center'}>
          <Box as={RouterLink} to="/" fontWeight="bold" fontSize="xl" color="brand.500">
            MarketSegment
          </Box>
          
          {/* Desktop Navigation */}
          <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Button as={RouterLink} to="/" variant="ghost" leftIcon={<FiHome />}>
              Dashboard
            </Button>
          </HStack>
        </HStack>

        {/* Right side content */}
        <Flex alignItems={'center'} ml="auto">
          <Button
            as={RouterLink}
            to="/projects/new"
            colorScheme="brand"
            size="sm"
            mr={4}
            leftIcon={<AddIcon />}
          >
            New Project
          </Button>

          {/* User Menu */}
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: 'none' }}>
              <HStack>
                <Avatar
                  size={'sm'}
                  name={currentUser?.username}
                />
                <Text fontSize="sm" display={{ base: 'none', md: 'flex' }}>
                  {currentUser?.username}
                </Text>
                <ChevronDownIcon />
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}>
              <MenuItem icon={<FiSettings />}>Settings</MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Sign out
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Button as={RouterLink} to="/" variant="ghost" justifyContent="flex-start" leftIcon={<FiHome />}>
                Dashboard
              </Button>
              <Button as={RouterLink} to="/projects/new" variant="ghost" justifyContent="flex-start" leftIcon={<AddIcon />}>
                New Project
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Page content */}
      <Box p={4}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;