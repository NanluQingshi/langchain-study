/*
 * @Author: NanluQingshi
 * @Date: 2026-02-07 21:46:09
 * @LastEditors: NanluQingshi
 * @LastEditTime: 2026-02-08 12:58:10
 * @Description:
 *  
 */
import { Ollama } from "@langchain/community/llms/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
const run = async () => {
  const directory = '../../db/kongyiji';
  const embeddings = new OllamaEmbeddings({
    model: 'llama3.1:8b',
    baseUrl: 'http://localhost:11434',
  });

  const vectorStore = await FaissStore.load(directory, embeddings);
  const model = new Ollama({
    model: 'llama3.1:8b',
    baseUrl: 'http://localhost:11434',
  });
  const retriever = MultiQueryRetriever.fromLLM({
    // @ts-ignore
    llm: model,
    // @ts-ignore
    retriever: vectorStore.asRetriever(3),
    queryCount: 3,
    verbose: true,
  });
  const res = await retriever.invoke('茴香豆是做什么的');
  console.log('retriever result:', res);
};

run();
