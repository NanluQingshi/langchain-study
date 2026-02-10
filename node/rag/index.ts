import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { Ollama } from "@langchain/community/llms/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Runnable, RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import path from 'path';
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";
import { JSONChatHistory } from "./JSONChatHistory";
// 对用户的提问进行改写，使之成为一个独立的问题
async function getRephraseChain() {
  const rephraseChainPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      // 这里，我们通过 system prompt 去给 llm 确定任务，根据聊天记录去把对话重新描述成一个独立的问题，并强调重述问题的目标。  
      "给定以下对话和一个后续问题，请将后续问题重述为一个独立的问题。请注意，重述的问题应该包含足够的信息，使得没有看过对话历史的人也能理解。"
    ],
    new MessagesPlaceholder('history'),
    ['human', '请将以下问题重述为一个独立的问题: \n{question}'],
  ]);

  const rephraseChain = RunnableSequence.from([
    // @ts-ignore
    rephraseChainPrompt,
    new Ollama({
      model: "llama3.1:8b",
      baseUrl: "http://localhost:11434",
      // 将 model 的 temperature 定义的较低，越低 llm 会越忠于事实，减少自己的自由发挥。
      temperature: 0.2,
    }),
    new StringOutputParser(),
  ]);

  return rephraseChain;
};

const testRephraseChain = async () => {
  const rephraseChain = await getRephraseChain();
  const historyMessages = [
    new HumanMessage("你好，我晚上想去买零食"), 
    new AIMessage("需要我为你提供一些建议吗？"),
  ];

  const question = "几点去买比较好";
  const standaloneQuestion = await rephraseChain.invoke({
    history: historyMessages,
    question,
  });
  console.log("standalone question", standaloneQuestion);
};

// testRephraseChain();

async function loadVectorStore() {
  const directory = path.join(__dirname, '../../db/ball-lightning');
  const embeddings = new OllamaEmbeddings({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });
  const vectorStore = await FaissStore.load(directory, embeddings);

  return vectorStore;
};

export async function getRagChain(): Promise<Runnable> {
  const vectorStore = await loadVectorStore();
  // 构建检索
  const retriever = vectorStore.asRetriever(2);

  // 将提取出的文档转换成字符串
  const convertDocsToString = (document: Document[]): string => {
    return document.map((document) => document.pageContent).join('\n');
  };
  // @ts-ignore
  const contextRetrieverChain = RunnableSequence.from([
    (input) => input.standalone_question,
    retriever,
    convertDocsToString,
  ]);

  // 定义包含历史记录信息，回答用户提问的 prompt
  const SYSTEM_TEMPLATE = `
    你是一个熟读刘慈欣的《球状闪电》的终极原著党，精通根据作品原文详细解释和回答问题，你在回答时会引用作品原文。
    并且回答时仅根据原文，尽可能回答用户问题，如果原文中没有相关内容，你可以回答“原文中没有相关内容”，

    以下是原文中跟用户回答相关的内容：
    {context}
  `;
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_TEMPLATE],
    new MessagesPlaceholder('history'),
    ['human', '现在，你需要基于原文，回答以下问题：\n{standalone_question}'],
  ]);

  const model = new Ollama({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });
  const rephraseChain = await getRephraseChain();
  const ragChain = RunnableSequence.from([
    // @ts-ignore
    RunnablePassthrough.assign({
      // @ts-ignore
      standalone_question: rephraseChain,
    }),
    RunnablePassthrough.assign({
      // @ts-ignore
      context: contextRetrieverChain,
    }),
    prompt,
    model,
    new StringOutputParser(),  
  ]);
  const chatHistoryDir = path.join(__dirname, './chat_data');
  const ragChainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: (sessionId) => new JSONChatHistory({ sessionId, dir: chatHistoryDir }),
    historyMessagesKey: 'history',
    inputMessagesKey: 'question',
  });

  return ragChainWithHistory;
}

async function testGetRegChain() {
  const ragChain = await getRagChain();
  const res = await ragChain.invoke(
    {
      question: '什么是球状闪电',
    },
    {
      configurable: { sessionId: 'test-history' },
    },
  );

  console.log('test-history', res);
}
// testGetRegChain();