import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const run = async () => {
  // 加载文本数据源
  const loader = new TextLoader("../data/qiu.txt");
  const docs = await loader.load();

  // 文本分割
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
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
  const res = await vertorStore.save("../db/qiu");
  console.log("vector-store save result", res);
};

run();
