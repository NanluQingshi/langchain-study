import { Ollama } from "@langchain/community/llms/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { JSONChatHistory } from "../rag/JSONChatHistory";
import { ConversationChain } from "langchain/chains";

// 在 LCEL 中集成 memory
const run1 = async () => {
  const model = new Ollama({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });
  const memory = new BufferMemory();
  const TEMPLATE = `
  你是一个乐于助人的 ai 助手。尽你所能回答所有问题。

  这是跟人类沟通的聊天历史:
  {history}

  据此回答人类的问题:
  {input}
  `;
  const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);

  let tempInput = '';

  const chain = RunnableSequence.from([
    {
      // @ts-ignore
      input: new RunnablePassthrough(),
      memoryObject: async (input) => {
        const history = await memory.loadMemoryVariables({ input });
        tempInput = input;
        return history;
      }
    },
    RunnablePassthrough.assign({
      history: (input) => input.memoryObject.history,
    }),
    prompt,
    model,
    // @ts-ignore
    new StringOutputParser(),
    new RunnablePassthrough({
      func: async (output) => {
        // @ts-ignore
        await memory.saveContext({ input: tempInput, output });
      },
    }),
  ]);
};

// run1();

// 实现自定义的 chat history
const run2 = async () => {
  const history = new JSONChatHistory({
    dir: 'chat_data',
    sessionId: 'test',
  });
  // await history.addMessages([
  //   new HumanMessage("Hi, 我叫小明"),
  //   new AIMessage("你好小明，很高兴认识你！"),
  // ]);
  const message = await history.getMessages();
  // console.log("custom history messages", message); 

  const model = new Ollama({
    model: "llama3.1:8b",
    baseUrl: "http://localhost:11434",
  });
  const memory = new BufferMemory({
    chatHistory: history,
  });
  const chain  = new ConversationChain({ llm: model, memory });
  // const res = await chain.call({ input: '我叫什么，别说别的，回答我这个问题'});
  // console.log("chain result with custom history", res);

  const messages = await history.getMessages();
  console.log("all messages from custom history", messages);
};
run2();
