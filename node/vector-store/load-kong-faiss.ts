/*
 * @Author: NanluQingshi
 * @Date: 2026-02-07 20:37:06
 * @LastEditors: NanluQingshi
 * @LastEditTime: 2026-02-07 21:13:09
 * @Description:
 */
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import path from "path";
const run = async () => {
  const directory = path.join(__dirname, '../../db/kongyiji');
  const embeddings = new OllamaEmbeddings({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });

  const vectorStore = await FaissStore.load(directory, embeddings);

  const retriever = vectorStore.asRetriever(2);

  const res = await retriever.invoke("喝酒");

  console.log("retriever result:", res);
};

run();
