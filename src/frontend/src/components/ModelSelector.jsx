import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Select,
  Radio,
  RadioGroup,
  Stack,
  Heading,
  Divider,
  Text,
} from '@chakra-ui/react';

const MODEL_OPTIONS = {
  anthropic: [
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet - Best quality' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus - High quality' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet - Balanced' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku - Fast' },
  ],
  openai: [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo - Best quality' },
    { value: 'gpt-4', label: 'GPT-4 - High quality' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo - Fast' },
  ],
};

const ModelSelector = ({ 
  modelProvider, 
  modelName, 
  summaryModelProvider,
  summaryModelName,
  onModelProviderChange, 
  onModelNameChange,
  onSummaryModelProviderChange,
  onSummaryModelNameChange,
  showSummaryOptions = false
}) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
      <Heading size="md" mb={4}>AI Model Settings</Heading>
      
      <FormControl mb={4}>
        <FormLabel>Model Provider</FormLabel>
        <RadioGroup value={modelProvider} onChange={onModelProviderChange}>
          <Stack direction="row">
            <Radio value="anthropic">Claude (Anthropic)</Radio>
            <Radio value="openai">GPT (OpenAI)</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>AI Model</FormLabel>
        <Select value={modelName} onChange={(e) => onModelNameChange(e.target.value)}>
          <option value="">Default ({modelProvider === 'anthropic' ? 'Claude 3.5 Sonnet' : 'GPT-4 Turbo'})</option>
          {MODEL_OPTIONS[modelProvider].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Select the AI model that will generate your segmentation or focus group.
        </Text>
      </FormControl>

      {showSummaryOptions && (
        <>
          <Divider my={4} />
          <Heading size="sm" mb={3}>Summary Options</Heading>
          
          <FormControl mb={4}>
            <FormLabel>Summary Model Provider</FormLabel>
            <RadioGroup 
              value={summaryModelProvider || modelProvider} 
              onChange={onSummaryModelProviderChange}
            >
              <Stack direction="row">
                <Radio value="anthropic">Claude (Anthropic)</Radio>
                <Radio value="openai">GPT (OpenAI)</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Summary Model</FormLabel>
            <Select 
              value={summaryModelName} 
              onChange={(e) => onSummaryModelNameChange(e.target.value)}
            >
              <option value="">Default ({(summaryModelProvider || modelProvider) === 'anthropic' ? 'Claude 3.5 Sonnet' : 'GPT-3.5 Turbo'})</option>
              {MODEL_OPTIONS[summaryModelProvider || modelProvider].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Select the AI model that will generate summaries of your focus group results.
            </Text>
          </FormControl>
        </>
      )}
    </Box>
  );
};

export default ModelSelector;