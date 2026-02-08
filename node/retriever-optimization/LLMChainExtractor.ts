import { Ollama } from "@langchain/community/llms/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';


process.env.LANGCHAIN_VERBOSE = 'true';

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

  // @ts-ignore
  const compressor = LLMChainExtractor.fromLLM(model);
  const retriever = new ContextualCompressionRetriever({
    // @ts-ignore
    baseRetriever: vectorStore.asRetriever(2),
    baseCompressor: compressor,
  });

  const res = await retriever.invoke('茴香豆是做什么的');
};

run();