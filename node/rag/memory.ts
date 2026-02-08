/*
 * @Author: NanluQingshi
 * @Date: 2026-02-08 15:05:33
 * @LastEditors: NanluQingshi
 * @LastEditTime: 2026-02-08 23:06:13
 * @Description: 
 */
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { HumanMessage, AIMessage, getBufferString } from "@langchain/core/messages";
import { Ollama } from "@langchain/community/llms/ollama";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { Runnable, RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new Ollama({
  model: "llama3.1:8b",
  baseUrl: "http://localhost:11434",
});

const run = async () => {
  const history = new ChatMessageHistory();

  const res1 = await history.addMessage(new HumanMessage({ name: "user", content: "Hello, my name is Huin?" }));

  // console.log("history messages", res1);

  const messages = await history.getMessages();
  // console.log("all messages", messages);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a helpful assistant. Answer all questions to the best of your ability.
    You are talkative and provides lots of specific details from its context. 
    If the you does not know the answer to a question, it truthfully says you do not know.`],
    new MessagesPlaceholder("history_message"),
  ]);
  // @ts-ignore
  const chain = prompt.pipe(model);

  const res = await chain.invoke({
    history_message: messages,
  });
  // 手动维护对话历史
  await history.addMessage(new AIMessage({ name: "assistant", content: res }));
  await history.addMessage(new HumanMessage({ name: "user", content: "What is my name?" }));

  const res2 = await chain.invoke({
    history_message: await history.getMessages(),
  });
  console.log("chain result2", res2);
};

// 手动维护对话历史
// run();

// 使用 RunnableWithMessageHistory 自动维护对话历史
const run2 = async () => {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a helpful assistant. Answer all questions to the best of your ability.
    You are talkative and provides lots of specific details from its context. 
    If the you does not know the answer to a question, it truthfully says you do not know.`],
    new MessagesPlaceholder("history_message"),
    ['human', '{input}']
  ]);

  const history = new ChatMessageHistory();
  // @ts-ignore
  const chain = prompt.pipe(model);

  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain, 
    getMessageHistory: (_sessionId) => history,
    inputMessagesKey: "input",
    historyMessagesKey: "history_message",
  });

  const res1 = await chainWithHistory.invoke({
    input: "Hello, my name is Huin?",
  },
  {
    configurable: { sessionId: "none" },
  });
  console.log("chainWithHistory result1", res1);

  const res2 = await chainWithHistory.invoke({
    input: "What is my name?",
  },
  {
    configurable: { sessionId: "none" },
  });

  console.log("chainWithHistory result2", res2);
};

// run2();

// 自动生成 chat history 摘要
const run3 = async () => {
  const summaryPrompt = ChatPromptTemplate.fromTemplate(`
  Progressively summarize the lines of conversation provided, adding onto the previous summary returning a new summary

  Current summary:
  {summary}

  New lines of conversation:
  {new_lines}

  New summary:
  `);

  const summaryChain = RunnableSequence.from([
    // @ts-ignore
    summaryPrompt,
    model,
    new StringOutputParser(),
  ]);

  const newSummary = await summaryChain.invoke({
    summary: "",
    new_lines: "I'm 18",
  });

  await summaryChain.invoke({
    summary: newSummary,
    new_lines: "My gender is male",
  });

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a helpful assistant. Answer all questions to the best of your ability.

    Here is the chat history summary:
    {history_summary}
    `],
    ["human","{input}"],
  ]);

  let summary = "";
  const history = new ChatMessageHistory();

  const chatChain = RunnableSequence.from([
    {
      // @ts-ignore
      input: new RunnablePassthrough({
        func: (input) => history.addUserMessage(input),
      }),
    },
    RunnablePassthrough.assign({
      history_summary: () => summary,
    }),
    chatPrompt,
    model,
    new StringOutputParser(),
    new RunnablePassthrough({
      func: async (input) => {
        history.addAIMessage(input);
        const messages = await history.getMessages();
        const new_lines = getBufferString(messages);
        const newSummary = await summaryChain.invoke({
          summary,
          new_lines,
        });
        history.clear();
        summary = newSummary;
      },
    }),
  ]);

  const res = await chatChain.invoke('我现在饿了');
  // console.log(summary);
  console.log("chatChain result1", res);

  const res2 = await chatChain.invoke('我想吃点东西');
  console.log("chatChain result2", res2);
  // console.log(summary);
};

run3();
