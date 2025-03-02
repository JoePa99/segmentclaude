import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Stack,
  Badge,
  Divider,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  SimpleGrid,
  Icon,
  Tooltip,
  Tag,
  TagLabel,
  HStack,
  Progress,
  Button
} from '@chakra-ui/react';
import { CheckIcon, InfoIcon, StarIcon } from '@chakra-ui/icons';
import { 
  FiUsers, 
  FiTrendingUp, 
  FiBriefcase, 
  FiFlag, 
  FiHeart, 
  FiShoppingBag,
  FiTarget, 
  FiDollarSign,
  FiPieChart
} from 'react-icons/fi';

/**
 * Component to display a segment card with detailed information
 */
const SegmentCard = ({ segment }) => {
  // Debug the segment
  console.log("Rendering segment card with:", segment);
  
  // Default values if something is missing
  const {
    name = "Untitled Segment",
    description = "No description available",
    size = "20%",
    demographics = {},
    psychographics = {},
    behaviors = {},
    painPoints = [],
    motivations = [],
    purchaseTriggers = [],
    marketingStrategies = []
  } = segment || {};

  // Get size as number for progress bar
  const sizeNumber = parseInt(size) || 20;

  return (
    <Card variant="outline" boxShadow="md" height="100%" borderRadius="lg" borderTopWidth="4px" borderTopColor="blue.400">
      <CardHeader pb={2}>
        <Box>
          <Flex justify="space-between" align="center">
            <Heading size="md" color="blue.700">{name}</Heading>
            <Tooltip label="Market size percentage" placement="top">
              <HStack>
                <Icon as={FiPieChart} color="blue.500" />
                <Badge colorScheme="blue" fontSize="md" borderRadius="full" px={3}>{size}</Badge>
              </HStack>
            </Tooltip>
          </Flex>
          <Progress 
            value={sizeNumber} 
            mt={2} 
            size="xs" 
            colorScheme="blue" 
            borderRadius="full" 
          />
          <Text mt={3} color="gray.600" fontSize="md" fontStyle="italic">
            {description}
          </Text>
        </Box>
      </CardHeader>
      <Divider mt={2} />
      <CardBody pt={3}>
        {/* Summary section */}
        <HStack spacing={3} mb={4} wrap="wrap">
          <Tooltip label="Demographics" placement="top">
            <Tag size="md" variant="subtle" colorScheme="purple" borderRadius="full">
              <Icon as={FiUsers} mr={1} />
              <TagLabel>Demographics</TagLabel>
            </Tag>
          </Tooltip>

          <Tooltip label="Psychographics" placement="top">
            <Tag size="md" variant="subtle" colorScheme="green" borderRadius="full">
              <Icon as={FiHeart} mr={1} />
              <TagLabel>Psychographics</TagLabel>
            </Tag>
          </Tooltip>

          <Tooltip label="Behaviors" placement="top">
            <Tag size="md" variant="subtle" colorScheme="orange" borderRadius="full">
              <Icon as={FiTrendingUp} mr={1} />
              <TagLabel>Behaviors</TagLabel>
            </Tag>
          </Tooltip>
        </HStack>

        <Accordion allowMultiple defaultIndex={[0, 1, 2]} mt={2}>
          {/* Demographics Section */}
          {demographics && Object.keys(demographics).length > 0 && (
            <AccordionItem border="1px solid" borderColor="purple.100" borderRadius="md" mb={3} overflow="hidden">
              <h2>
                <AccordionButton bg="purple.50" _expanded={{ bg: 'purple.100' }}>
                  <Icon as={FiUsers} mr={2} color="purple.500" />
                  <Box flex="1" textAlign="left" fontWeight="medium" color="purple.700">
                    Demographics
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="purple.50" bgGradient="linear(to-b, purple.50, white)">
                <SimpleGrid columns={2} spacing={3}>
                  {Object.entries(demographics).map(([key, value]) => (
                    <Box key={key} borderLeft="2px solid" borderColor="purple.200" pl={2}>
                      <Text fontSize="sm" fontWeight="bold" textTransform="capitalize" color="purple.700">
                        {key}
                      </Text>
                      <Text fontSize="sm">{value}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Psychographics Section */}
          {psychographics && Object.keys(psychographics).length > 0 && (
            <AccordionItem border="1px solid" borderColor="green.100" borderRadius="md" mb={3} overflow="hidden">
              <h2>
                <AccordionButton bg="green.50" _expanded={{ bg: 'green.100' }}>
                  <Icon as={FiHeart} mr={2} color="green.500" />
                  <Box flex="1" textAlign="left" fontWeight="medium" color="green.700">
                    Psychographics
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="green.50" bgGradient="linear(to-b, green.50, white)">
                <SimpleGrid columns={2} spacing={3}>
                  {Object.entries(psychographics).map(([key, value]) => (
                    <Box key={key} borderLeft="2px solid" borderColor="green.200" pl={2}>
                      <Text fontSize="sm" fontWeight="bold" textTransform="capitalize" color="green.700">
                        {key}
                      </Text>
                      <Text fontSize="sm">{value}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Behaviors Section */}
          {behaviors && Object.keys(behaviors).length > 0 && (
            <AccordionItem border="1px solid" borderColor="orange.100" borderRadius="md" mb={3} overflow="hidden">
              <h2>
                <AccordionButton bg="orange.50" _expanded={{ bg: 'orange.100' }}>
                  <Icon as={FiTrendingUp} mr={2} color="orange.500" />
                  <Box flex="1" textAlign="left" fontWeight="medium" color="orange.700">
                    Behaviors
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="orange.50" bgGradient="linear(to-b, orange.50, white)">
                <SimpleGrid columns={2} spacing={3}>
                  {Object.entries(behaviors).map(([key, value]) => (
                    <Box key={key} borderLeft="2px solid" borderColor="orange.200" pl={2}>
                      <Text fontSize="sm" fontWeight="bold" textTransform="capitalize" color="orange.700">
                        {key}
                      </Text>
                      <Text fontSize="sm">{value}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Pain Points Section */}
          {painPoints && painPoints.length > 0 && (
            <AccordionItem border="1px solid" borderColor="red.100" borderRadius="md" mb={3} overflow="hidden">
              <h2>
                <AccordionButton bg="red.50" _expanded={{ bg: 'red.100' }}>
                  <Icon as={FiFlag} mr={2} color="red.500" />
                  <Box flex="1" textAlign="left" fontWeight="medium" color="red.700">
                    Pain Points
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="red.50" bgGradient="linear(to-b, red.50, white)">
                <List spacing={2}>
                  {painPoints.map((point, index) => (
                    <ListItem key={index} display="flex" alignItems="flex-start">
                      <ListIcon as={InfoIcon} color="red.500" mt={1} />
                      <Text fontSize="sm">{point}</Text>
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Motivations Section */}
          {motivations && motivations.length > 0 && (
            <AccordionItem border="1px solid" borderColor="yellow.100" borderRadius="md" mb={3} overflow="hidden">
              <h2>
                <AccordionButton bg="yellow.50" _expanded={{ bg: 'yellow.100' }}>
                  <Icon as={FiTarget} mr={2} color="yellow.500" />
                  <Box flex="1" textAlign="left" fontWeight="medium" color="yellow.700">
                    Motivations
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="yellow.50" bgGradient="linear(to-b, yellow.50, white)">
                <List spacing={2}>
                  {motivations.map((motivation, index) => (
                    <ListItem key={index} display="flex" alignItems="flex-start">
                      <ListIcon as={StarIcon} color="yellow.500" mt={1} />
                      <Text fontSize="sm">{motivation}</Text>
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Purchase Triggers Section */}
          {purchaseTriggers && purchaseTriggers.length > 0 && (
            <AccordionItem border="1px solid" borderColor="teal.100" borderRadius="md" mb={3} overflow="hidden">
              <h2>
                <AccordionButton bg="teal.50" _expanded={{ bg: 'teal.100' }}>
                  <Icon as={FiShoppingBag} mr={2} color="teal.500" />
                  <Box flex="1" textAlign="left" fontWeight="medium" color="teal.700">
                    Purchase Triggers
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="teal.50" bgGradient="linear(to-b, teal.50, white)">
                <List spacing={2}>
                  {purchaseTriggers.map((trigger, index) => (
                    <ListItem key={index} display="flex" alignItems="flex-start">
                      <ListIcon as={CheckIcon} color="teal.500" mt={1} />
                      <Text fontSize="sm">{trigger}</Text>
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Marketing Strategies Section */}
          {marketingStrategies && marketingStrategies.length > 0 && (
            <AccordionItem border="1px solid" borderColor="blue.100" borderRadius="md" mb={3} overflow="hidden">
              <h2>
                <AccordionButton bg="blue.50" _expanded={{ bg: 'blue.100' }}>
                  <Icon as={FiBriefcase} mr={2} color="blue.500" />
                  <Box flex="1" textAlign="left" fontWeight="medium" color="blue.700">
                    Marketing Strategies
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="blue.50" bgGradient="linear(to-b, blue.50, white)">
                <List spacing={2}>
                  {marketingStrategies.map((strategy, index) => (
                    <ListItem key={index} display="flex" alignItems="flex-start">
                      <ListIcon as={CheckIcon} color="blue.500" mt={1} />
                      <Text fontSize="sm">{strategy}</Text>
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          )}
        </Accordion>
      </CardBody>
    </Card>
  );
};

export default SegmentCard;