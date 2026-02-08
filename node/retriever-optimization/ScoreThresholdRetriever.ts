/*
 * @Author: NanluQingshi
 * @Date: 2026-02-08 12:47:20
 * @LastEditors: NanluQingshi
 * @LastEditTime: 2026-02-08 12:52:55
 * @Description:
 */
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";

process.env.LANGCHAIN_VERBOSE = "true";

const run = async () => {
  const directory = "../../db/kongyiji";
  const embeddings = new OllamaEmbeddings({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });

  const vectorStore = await FaissStore.load(directory, embeddings);

  const retriever = ScoreThresholdRetriever.fromVectorStore(vectorStore, {
    minSimilarityScore: 0.4,
    maxK: 5,
    kIncrement: 1,
  });

  const res = await retriever.invoke("茴香豆是做什么的");
  console.log("retriever result:", res);
};

run();
