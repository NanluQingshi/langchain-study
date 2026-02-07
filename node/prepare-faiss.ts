import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const run = async () => {
  const loader = new TextLoader("../data/kong.txt");
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 20,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OllamaEmbeddings({ 
    model: 'llama3.1:8b',
    baseUrl: 'http://localhost:11434',
  });

  const vertorStore = await FaissStore.fromDocuments(
    splitDocs,
    embeddings
  );

  const directory = "../db/kongyiji";
  const res = await vertorStore.save(directory);
  console.log('vector-store save result', res);
};

run();
