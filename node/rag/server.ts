// import Koa from 'koa';
// import Router from '@koa/router';
// import bodyParser from 'koa-bodyparser';
// import { Readable } from 'stream';
// import { getRagChain } from '.';

// const app = new Koa();
// const port = 3000;

// app.use(bodyParser);

// const router = new Router();
// router.post('/', async (ctx) => {
//   // 1.获取业务对象
//   const ragChain = await getRagChain();
//   // 2.获取请求体
//   const body = ctx.request.body;
//   // 3.获取异步迭代器结果
//   const result = await ragChain.stream(
//     {
//       // @ts-ignore
//       question: body.question,
//     },
//     {
//       // @ts-ignore
//       configurable: { sessionId: body.session_id },
//     },
//   );
//   // 4.设置响应头
//   ctx.set({
//     'Content-Type': 'text/plain',
//     'Cache-Control': 'no-cache',
//     'Connection': 'keep-alive',
//   });
//   // 5.【关键点】将异步迭代器转换为 Node.js 可读流，并赋值给 body
//   // Koa 会自动识别这是一个流，并将其 Pipe 给客户端，实现打字机效果
//   ctx.body = Readable.from(result);
// });

// app.use(router.routes());

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

import express from "express";
import { getRagChain } from ".";

const app = express();
const port = 3000;

app.use(express.json());

app.post("/", async (req, res) => {
  const ragChain = await getRagChain();
  const body = req.body;
  const result = await ragChain.stream(
    {
      question: body.question,
    },
    { configurable: { sessionId: body.session_id } }
  );

  res.set("Content-Type", "text/plain");
  for await (const chunk of result) {
    res.write(chunk);
  }
  res.end();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});