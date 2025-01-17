import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getRandomPrompt(): Promise<string> {
  try {
    const promptsPath = path.join(__dirname, '..', 'data', 'prompts.txt');
    const content = await fs.readFile(promptsPath, 'utf-8');
    const prompts = content.split('\n').filter(line => line.trim().length > 0);
    
    if (prompts.length === 0) {
      throw new Error('No prompts available');
    }
    
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  } catch (error) {
    console.error('Error reading prompts:', error);
    // Fallback prompt in case of file reading issues
    return 'Magical NFT in ethereal landscape, digital art style';
  }
}
