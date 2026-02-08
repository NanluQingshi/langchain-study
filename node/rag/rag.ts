/*
 * @Author: NanluQingshi
 * @Date: 2026-02-08 13:52:05
 * @LastEditors: NanluQingshi
 * @LastEditTime: 2026-02-08 14:48:33
 * @Description:
 */
import { Ollama } from "@langchain/community/llms/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const run = async () => {
  const model = new Ollama({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });
  const embedding = new OllamaEmbeddings({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });
  const directory = "../../db/qiu";
  const vectorStore = await FaissStore.load(directory, embedding);
  const retriever = vectorStore.asRetriever(2);
  // const res = await retriever.invoke(
  //   "原文中，谁提出了宏原子的假设？并详细介绍给我宏原子假设的理论",
  // );
  // console.log("retriever result", res);

  const convertDocsToString = (documents) => {
    return documents.map((doc) => doc.pageContent).join("\n");
  };

  // @ts-ignore
  const contextRetrieverChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    convertDocsToString,
  ])

  const TEMPLATE = `
  你是一个熟读刘慈欣的《球状闪电》的终极原著党，精通根据作品原文详细解释和回答问题，你在回答时会引用作品原文。
  并且回答时仅根据原文，尽可能回答用户问题，如果原文中没有相关内容，你可以回答“原文中没有相关内容”，

  以下是原文中跟用户回答相关的内容：
  {context}

  现在，你需要基于原文，回答以下问题：
  {question}`;

  const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);

    // @ts-ignore
  const ragChain = RunnableSequence.from([
    {
      // @ts-ignore
      context: contextRetrieverChain,
      question: (input) => input.question,
    },
    prompt,
    model,
    new StringOutputParser, 
  ]);

  const answer = await ragChain.invoke({
    question: "什么是球状闪电",
  });

  console.log("ragChain result", answer);
};

run();


