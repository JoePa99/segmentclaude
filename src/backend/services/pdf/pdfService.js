import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to create HTML for segmentation report
const createSegmentationHTML = (project) => {
  const { name, businessType, industry, region, segments } = project;
  
  const segmentsHTML = segments.map(segment => {
    const {
      name,
      description,
      size,
      demographics,
      psychographics,
      behaviors,
      painPoints,
      motivations,
      purchaseTriggers,
      marketingStrategies
    } = segment;
    
    // Convert object properties to HTML list items
    const demographicsHTML = Object.entries(demographics || {})
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');
    
    const psychographicsHTML = Object.entries(psychographics || {})
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');
    
    const behaviorsHTML = Object.entries(behaviors || {})
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');
    
    // Convert arrays to HTML list items
    const painPointsHTML = (painPoints || [])
      .map(point => `<li>${point}</li>`)
      .join('');
    
    const motivationsHTML = (motivations || [])
      .map(motivation => `<li>${motivation}</li>`)
      .join('');
    
    const purchaseTriggersHTML = (purchaseTriggers || [])
      .map(trigger => `<li>${trigger}</li>`)
      .join('');
    
    const marketingStrategiesHTML = (marketingStrategies || [])
      .map(strategy => `<li>${strategy}</li>`)
      .join('');
    
    return `
      <div class="segment">
        <h2>${name}</h2>
        <p class="size"><strong>Approximate Size:</strong> ${size}</p>
        <div class="description">
          <h3>Description</h3>
          <p>${description}</p>
        </div>
        
        <div class="section">
          <h3>Demographics</h3>
          <ul>${demographicsHTML}</ul>
        </div>
        
        <div class="section">
          <h3>Psychographics</h3>
          <ul>${psychographicsHTML}</ul>
        </div>
        
        <div class="section">
          <h3>Behaviors</h3>
          <ul>${behaviorsHTML}</ul>
        </div>
        
        <div class="section">
          <h3>Pain Points</h3>
          <ul>${painPointsHTML}</ul>
        </div>
        
        <div class="section">
          <h3>Motivations</h3>
          <ul>${motivationsHTML}</ul>
        </div>
        
        <div class="section">
          <h3>Purchase Triggers</h3>
          <ul>${purchaseTriggersHTML}</ul>
        </div>
        
        <div class="section">
          <h3>Marketing Strategies</h3>
          <ul>${marketingStrategiesHTML}</ul>
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }).join('');
  
  // Full HTML document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name} - Market Segmentation Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #2c3e50;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .project-details {
          display: flex;
          justify-content: space-between;
          background-color: #f5f7fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 30px;
        }
        .project-detail {
          flex: 1;
          text-align: center;
        }
        .project-detail h3 {
          margin: 0;
          font-size: 16px;
          color: #7f8c8d;
        }
        .project-detail p {
          margin: 5px 0 0;
          font-weight: bold;
          font-size: 18px;
        }
        .segment {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
        }
        .segment h2 {
          color: #2980b9;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        .size {
          font-size: 16px;
          color: #2c3e50;
          margin-top: -5px;
        }
        .section {
          margin-top: 20px;
        }
        .section h3 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 18px;
        }
        ul {
          margin: 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 5px;
        }
        .page-break {
          page-break-after: always;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${name} - Market Segmentation Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="project-details">
        <div class="project-detail">
          <h3>Business Type</h3>
          <p>${businessType}</p>
        </div>
        <div class="project-detail">
          <h3>Industry</h3>
          <p>${industry}</p>
        </div>
        <div class="project-detail">
          <h3>Region</h3>
          <p>${region}</p>
        </div>
      </div>
      
      <div class="segments">
        ${segmentsHTML}
      </div>
      
      <div class="footer">
        <p>Generated using LLM-powered market segmentation analysis</p>
      </div>
    </body>
    </html>
  `;
};

// Helper function to create HTML for focus group report
const createFocusGroupHTML = (project, focusGroup) => {
  const { name } = project;
  const { transcript, questions } = focusGroup;
  
  if (!transcript || !transcript.participants || !transcript.transcript) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${name} - Focus Group Transcript</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          h1 {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${name} - Focus Group Transcript</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <p>No transcript data available.</p>
      </body>
      </html>
    `;
  }
  
  // Generate list of participants with their segments
  const participantsHTML = transcript.participants.map(participant => {
    return `
      <div class="participant">
        <h3>${participant.name}</h3>
        <p><strong>Segment:</strong> ${participant.segment}</p>
        <p>${participant.description}</p>
      </div>
    `;
  }).join('');
  
  // Generate transcript of questions and responses
  const transcriptHTML = transcript.transcript.map(item => {
    const responsesHTML = item.responses.map(response => {
      return `
        <div class="response">
          <p class="responder"><strong>${response.participant}</strong> (${response.segment})</p>
          <p class="response-text">${response.response}</p>
        </div>
      `;
    }).join('');
    
    return `
      <div class="question-section">
        <h3 class="question">${item.question}</h3>
        <div class="responses">
          ${responsesHTML}
        </div>
      </div>
      <hr>
    `;
  }).join('');
  
  // Full HTML document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name} - Focus Group Transcript</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #2c3e50;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .participants-section {
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f5f7fa;
          border-radius: 5px;
        }
        .participants-section h2 {
          color: #2980b9;
          margin-top: 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        .participants {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .participant {
          flex: 1;
          min-width: 200px;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          background-color: white;
        }
        .participant h3 {
          margin-top: 0;
          color: #2c3e50;
        }
        .question-section {
          margin-bottom: 20px;
        }
        .question {
          color: #2980b9;
          font-size: 18px;
          margin-bottom: 15px;
          padding: 10px;
          background-color: #ebf5fb;
          border-radius: 5px;
        }
        .responses {
          padding-left: 20px;
        }
        .response {
          margin-bottom: 15px;
        }
        .responder {
          margin-bottom: 5px;
          color: #7f8c8d;
        }
        .response-text {
          margin-top: 0;
          padding-left: 10px;
          border-left: 3px solid #3498db;
        }
        hr {
          border: none;
          border-top: 1px solid #e0e0e0;
          margin: 30px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${name} - Focus Group Transcript</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="participants-section">
        <h2>Participants</h2>
        <div class="participants">
          ${participantsHTML}
        </div>
      </div>
      
      <div class="transcript">
        ${transcriptHTML}
      </div>
      
      <div class="footer">
        <p>Generated using LLM-simulated focus group analysis</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate a PDF for a segmentation report
 * @param {Object} project - The project object with segments
 * @returns {Promise<Buffer>} - The PDF buffer
 */
export const generateSegmentationPdf = async (project) => {
  try {
    // Create HTML content
    const html = createSegmentationHTML(project);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create new page
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    // Close browser
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating segmentation PDF:', error);
    throw error;
  }
};

/**
 * Generate a PDF for a focus group transcript
 * @param {Object} project - The project object
 * @param {Object} focusGroup - The focus group object with transcript
 * @returns {Promise<Buffer>} - The PDF buffer
 */
export const generateFocusGroupPdf = async (project, focusGroup) => {
  try {
    // Create HTML content
    const html = createFocusGroupHTML(project, focusGroup);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create new page
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    // Close browser
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating focus group PDF:', error);
    throw error;
  }
};

export default {
  generateSegmentationPdf,
  generateFocusGroupPdf
};