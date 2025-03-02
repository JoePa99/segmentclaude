import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import Upload from '../../models/Upload.js';

/**
 * Process an uploaded document based on its type (PDF, DOCX, TXT)
 * @param {string} uploadId - The ID of the upload record
 * @returns {Promise<Object>} - The processed document data
 */
export const processDocument = async (uploadId) => {
  try {
    // Get the upload record
    const upload = await Upload.findById(uploadId);
    if (!upload) {
      throw new Error('Upload not found');
    }
    
    // Mark as processing
    upload.status = 'processing';
    await upload.save();
    
    let extractedText = '';
    
    // Process based on file type
    switch (upload.mimetype) {
      case 'application/pdf':
        extractedText = await processPdf(upload.path);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        extractedText = await processDocx(upload.path);
        break;
      case 'text/plain':
        extractedText = await processTxt(upload.path);
        break;
      default:
        throw new Error('Unsupported file type');
    }
    
    // Break the text into chunks (approximately 2k tokens each)
    // A rough estimate is about 4 characters per token
    const chunkSize = 8000; // ~2k tokens
    const chunks = [];
    
    for (let i = 0; i < extractedText.length; i += chunkSize) {
      const chunk = extractedText.slice(i, i + chunkSize);
      chunks.push({
        text: chunk,
        index: chunks.length
      });
    }
    
    // Update the upload record with extracted text and chunks
    upload.extractedText = extractedText;
    upload.chunks = chunks;
    upload.status = 'processed';
    await upload.save();
    
    return {
      uploadId,
      extractedText,
      chunks
    };
  } catch (error) {
    // Mark as error
    await Upload.findByIdAndUpdate(uploadId, {
      status: 'error',
      error: error.message
    });
    
    throw error;
  }
};

/**
 * Process a PDF file to extract its text
 * @param {string} filePath - The path to the PDF file
 * @returns {Promise<string>} - The extracted text
 */
const processPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  } catch (error) {
    throw new Error(`Error processing PDF: ${error.message}`);
  }
};

/**
 * Process a DOCX file to extract its text
 * @param {string} filePath - The path to the DOCX file
 * @returns {Promise<string>} - The extracted text
 */
const processDocx = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Error processing DOCX: ${error.message}`);
  }
};

/**
 * Process a TXT file to extract its text
 * @param {string} filePath - The path to the TXT file
 * @returns {Promise<string>} - The extracted text
 */
const processTxt = async (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Error processing TXT: ${error.message}`);
  }
};

/**
 * Summarize a document to extract relevant information for segmentation
 * This would be used to provide focused input to the LLM
 * @param {string} text - The full text of the document
 * @returns {Promise<string>} - The summarized text
 */
export const summarizeDocument = async (text, keyTopics = []) => {
  // In a real implementation, this might use an LLM to summarize or
  // extract key points for segmentation. For now, we'll just return a
  // truncated version of the text (first 10000 characters)
  
  // If we're building a real system, the next steps would be:
  // 1. Use semantic chunking rather than fixed-size chunking
  // 2. Create embeddings for each chunk
  // 3. Store in a vector DB
  // 4. Retrieve relevant chunks based on user query
  
  const maxLength = 10000;
  return text.length > maxLength ? text.substring(0, maxLength) : text;
};

export default {
  processDocument,
  summarizeDocument
};