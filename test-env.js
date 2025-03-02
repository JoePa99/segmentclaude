import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log current directory and files
console.log('Current directory:', __dirname);
console.log('Files in directory:', fs.readdirSync(__dirname));

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
console.log('.env file exists:', fs.existsSync(envPath));

// Load environment variables
dotenv.config();

// Print all environment variables
console.log('ENV variables after dotenv.config():');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('OPENAI_') || key.startsWith('MONGODB_') || key === 'JWT_SECRET') {
    console.log(`${key}: ${key === 'OPENAI_API_KEY' ? (process.env[key] ? '[SET]' : '[NOT SET]') : (process.env[key] ? '[SET]' : '[NOT SET]')}`);
  }
});