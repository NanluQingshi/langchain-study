import { Ollama } from "@langchain/community/llms/ollama";
import { BufferMemory, ConversationSummaryBufferMemory, ConversationSummaryMemory, ENTITY_MEMORY_CONVERSATION_TEMPLATE, EntityMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new Ollama({
  model: "llama3.1:8b",
  baseUrl: "http://localhost:11434",
});

const run1 = async () => {

  const memory = new BufferMemory();

  const chain = new ConversationChain({ llm: model, memory, verbose: true });

  const res1 = await chain.call({ input: "你好，我叫小明。" });
  console.log("chain result1", res1);
  const res2 = await chain.call({ input: "你能告诉我我的名字吗？" });
  console.log("chain result2", res2);
};

// run1();

// 使用 ConversationSummaryMemory 来总结对话历史，减少上下文长度
const run2 = async () => {
  model.verbose = true;
  const memory = new ConversationSummaryMemory({
    // @ts-ignore
    llm: model,
    memoryKey: "summary",
  });
  const prompt = PromptTemplate.fromTemplate(`
  你是一个乐于助人的助手。尽你所能回答所有问题。

  这是聊天记录的摘要:
  {summary}
  Human: {input}
  AI:`);
  const chain = new ConversationChain({ llm: model, prompt, memory, verbose: true });

  const res1 = await chain.call({ input: "我是小明" });
  console.log("chain result1", res1);
  const res2 = await chain.call({ input: "我叫什么？" });
  console.log("chain result2", res2);
};
// run2();

const run3 = async () => {
  model.verbose = false;
  const memory = new ConversationSummaryBufferMemory({
    // @ts-ignore
    llm: model,
    maxTokenLimit: 200,
  });
  const chain = new ConversationChain({ llm: model, memory, verbose: true });
  
  const res1 = await chain.call({ input: "我是小明" });
  console.log("chain result1", res1);
  const res2 = await chain.call({ input: "我叫什么？" });
  console.log("chain result2", res2);
};

// run3();

const run4 = async () => {
  const memory = new EntityMemory({
    // @ts-ignore
    llm: model,
    chatHistoryKey: "history",
    entitiesKey: "entities",
  });
  const chain = new ConversationChain({ 
    llm: model, 
    prompt: ENTITY_MEMORY_CONVERSATION_TEMPLATE,
    memory, 
    verbose: true 
  });

  const res1 = await chain.call({ input: "你好，我想了解美国的一些政治知识" });
  console.log("chain result1", res1);
  const res2 = await chain.call({ input: "你怎么看待特朗普，就是 Donald Trump" });
  console.log("chain result2", res2);
};

run4();
