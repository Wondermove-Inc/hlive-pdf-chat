import type { NextApiRequest, NextApiResponse } from 'next';
import type { Document } from 'langchain/document'; // Ensure this is correctly defined
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

type MessagePair = [string, string];
type History = MessagePair[];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, history }: { question?: string; history?: History } =
    req.body;

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }

  const pastMessages =
    history
      ?.map(([userMsg, botMsg]) => `Human: ${userMsg}\nAssistant: ${botMsg}`)
      .join('\n') ?? '';

  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-ada-002',
      batchSize: 4,
      stripNewLines: true,
    });

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: 'text',
      namespace: PINECONE_NAME_SPACE,
    });

    let resolveWithDocuments: (value: Document[]) => void;

    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    const queryVector = await embeddings.embedQuery(sanitizedQuestion);
    const k = 10;
    const filter = {};
    const query_result = await vectorStore.similaritySearchVectorWithScore(
      queryVector,
      k,
      filter,
    );

    const retriever = vectorStore.asRetriever({
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            resolveWithDocuments(documents);
          },
        },
      ],
    });

    const chain = makeChain(retriever);

    const response = await chain.invoke({
      question: sanitizedQuestion,
      chat_history: pastMessages,
    });

    let sourceDocuments = await documentPromise;

    console.log('SOURCE DOCUMENTS : ', sourceDocuments);
    console.log('QUERY RESULT : ', query_result);

    // sourceDocuments = sourceDocuments.map((doc, index) => {
    //   const score = query_result[index]?.[1];
    //   return { ...doc, accuracy: score };
    // });
    res.status(200).json({
      text: response,
      sourceDocuments: query_result.map(([doc, score]) => ({
        ...doc,
        accuracy: score,
      })),
    });
    // res.status(200).json({
    //   text: response,
    //   sourceDocuments: query_result
    //     .map(([doc, score]) => ({ ...doc, accuracy: score }))
    //     .reduce(
    //       (uniqueDocs: any, currentDoc) => {
    //         // Use a set to track sources we've already added to the uniqueDocs array
    //         uniqueDocs.set = uniqueDocs.set || new Set();
    //         const src = currentDoc.metadata.source;

    //         // Check if the source has already been processed
    //         if (!uniqueDocs.set.has(src)) {
    //           uniqueDocs.set.add(src);
    //           uniqueDocs.result.push(currentDoc);
    //         }
    //         return uniqueDocs;
    //       },
    //       { result: [], set: null },
    //     ).result, // Initialize with an empty result array and a set // Extract the result array containing unique documents
    // });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
