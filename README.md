# GPT-4 & LangChain - Create a ChatGPT Chatbot for Your PDF Files

Use the new GPT-4 api to build a chatGPT chatbot for multiple Large PDF files.

Tech stack used includes LangChain, Pinecone, Typescript, Openai, and Next.js. LangChain is a framework that makes it easier to build scalable AI/LLM apps and chatbots. Pinecone is a vectorstore for storing embeddings and your PDF in text to later retrieve similar docs.

[Tutorial video](https://www.youtube.com/watch?v=ih9PBGVVOO4)

[Join the discord if you have questions](https://discord.gg/E4Mc77qwjm)

The visual guide of this repo and tutorial is in the `visual guide` folder.

**If you run into errors, please review the troubleshooting section further down this page.**

Prelude: Please make sure you have already downloaded node on your system and the version is 18 or greater.

## Development

1. Clone the repo or download the ZIP

```
git clone [github https url]
```

2. Install packages

First run `npm install yarn -g` to install yarn globally (if you haven't already).

Then run:

```
yarn install
```

After installation, you should now see a `node_modules` folder.

3. Set up your `.env` file

- Copy `.env.example` into `.env`
  Your `.env` file should look like this:

```
OPENAI_API_KEY=

PINECONE_API_KEY=
PINECONE_ENVIRONMENT=

PINECONE_INDEX_NAME=

```

- Visit [openai](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key) to retrieve API keys and insert into your `.env` file.
- Visit [pinecone](https://pinecone.io/) to create and retrieve your API keys, and also retrieve your environment and index name from the dashboard.

4. In the `config` folder, replace the `PINECONE_NAME_SPACE` with a `namespace` where you'd like to store your embeddings on Pinecone when you run `npm run ingest`. This namespace will later be used for queries and retrieval.

5. In `utils/makechain.ts` chain change the `QA_PROMPT` for your own usecase. Change `modelName` in `new OpenAI` to `gpt-4`, if you have access to `gpt-4` api. Please verify outside this repo that you have access to `gpt-4` api, otherwise the application will not work.

## Convert your PDF files to embeddings

**This repo can load multiple PDF files**

1. Inside `docs` folder, add your pdf files or folders that contain pdf files.

2. Run the script `yarn run ingest` to 'ingest' and embed your docs. If you run into errors troubleshoot below.

3. Check Pinecone dashboard to verify your namespace and vectors have been added.

## Run the app

Once you've verified that the embeddings and content have been successfully added to your Pinecone, you can run the app `npm run dev` to launch the local dev environment, and then type a question in the chat interface.

## Troubleshooting

In general, keep an eye out in the `issues` and `discussions` section of this repo for solutions.

**General errors**

- Make sure you're running the latest Node version. Run `node -v`
- Try a different PDF or convert your PDF to text first. It's possible your PDF is corrupted, scanned, or requires OCR to convert to text.
- `Console.log` the `env` variables and make sure they are exposed.
- Make sure you're using the same versions of LangChain and Pinecone as this repo.
- Check that you've created an `.env` file that contains your valid (and working) API keys, environment and index name.
- If you change `modelName` in `OpenAI`, make sure you have access to the api for the appropriate model.
- Make sure you have enough OpenAI credits and a valid card on your billings account.
- Check that you don't have multiple OPENAPI keys in your global environment. If you do, the local `env` file from the project will be overwritten by systems `env` variable.
- Try to hard code your API keys into the `process.env` variables if there are still issues.

**Pinecone errors**

- Make sure your pinecone dashboard `environment` and `index` matches the one in the `pinecone.ts` and `.env` files.
- Check that you've set the vector dimensions to `1536`.
- Make sure your pinecone namespace is in lowercase.
- Pinecone indexes of users on the Starter(free) plan are deleted after 7 days of inactivity. To prevent this, send an API request to Pinecone to reset the counter before 7 days.
- Retry from scratch with a new Pinecone project, index, and cloned repo.

## Credit

Frontend of this repo is inspired by [langchain-chat-nextjs](https://github.com/zahidkhawaja/langchain-chat-nextjs)


http://hlive-chat.wondermove.net/.well-known/acme-challenge/wk3X_DjAVWNdmzOaWNClAq258w3iIPtuJzJ3r7cEJCk


예, 가능합니다. 채팅을 잠깐 멈추고 외부 API 호출을 한 다음 그 데이터를 기반으로 GPT에게 답변을 요청할 수 있습니다. 이 과정을 예시로 설명하겠습니다.

1. 외부 API를 호출하는 로직 추가
2. API 결과를 활용해 GPT에게 질문하는 곳에 해당 데이터를 포함

먼저, 외부 API를 호출하는 로직을 추가합니다. `fetchExternalData`라는 함수를 만들어 API를 호출하고 결과를 받아옵니다.

```javascript
async function fetchExternalData(query) {
  // 예시로 API endpoint와 호출 방식을 작성합니다.
  const response = await fetch(`https://api.example.com/data?query=${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch external data');
  }

  return await response.json();
}
```

그리고, API의 결과를 바탕으로 GPT에게 질문을 할 수 있게 `handler` 함수에 해당 로직을 추가합니다.

```javascript
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

async function fetchExternalData(query) {
  const response = await fetch(`https://api.example.com/data?query=${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch external data');
  }

  return await response.json();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question, history } = req.body;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }

  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    /* create vectorstore */
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE,
      },
    );

    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    const retriever = vectorStore.asRetriever({
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            resolveWithDocuments(documents);
          },
        },
      ],
    });

    console.log("RETRIEVER : ", retriever)

    const chain = makeChain(retriever);

    const pastMessages = history
      .map((message: [string, string]) => {
        return [`Human: ${message[0]}`, `Assistant: ${message[1]}`].join('\n');
      })
      .join('\n');

    // 외부 API에서 데이터를 가져온다.
    const externalData = await fetchExternalData(sanitizedQuestion);
    const extendedQuestion = `${sanitizedQuestion}\n정보: ${JSON.stringify(externalData)}`;

    const response = await chain.invoke({
      question: extendedQuestion,
      chat_history: pastMessages,
    });

    const sourceDocuments = await documentPromise;

    res.status(200).json({ text: response, sourceDocuments });
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
```

이 코드는 사용자의 질문(`question`)을 외부 API로 먼저 보내서 추가적인 데이터를 가져온 뒤, 그 데이터를 포함하여 GPT에게 최종 질문을 합니다. 이를 통해 외부 API 데이터까지 반영된 답변을 얻을 수 있습니다.