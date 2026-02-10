/*
 * @Author: NanluQingshi
 * @Date: 2026-02-08 13:26:55
 * @LastEditors: NanluQingshi
 * @LastEditTime: 2026-02-10 21:05:49
 * @Description:
 */
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import path from 'path';

const run = async () => {
  // 加载文本数据源
  const loader = new TextLoader(path.join(__dirname, "../../data/ball.txt"));
  const docs = await loader.load();

  // 文本分割
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  // 向量化
  const embeddings = new OllamaEmbeddings({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });

  // 构建 FaissStore 向量数据库
  const vertorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

  // 保存向量数据库到本地
  const res = await vertorStore.save("../../db/ball-lightning");
  console.log("vector-store save result", res);
};

run();
