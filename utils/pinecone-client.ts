import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_HOST) {
  throw new Error('Pinecone API key or index host missing');
}

async function initPinecone() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY ?? '',
    });

    return pinecone;
  } catch (error) {
    console.error('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}

export const pinecone = await initPinecone();
