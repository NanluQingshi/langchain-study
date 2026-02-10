// /*
//  * @Author: NanluQingshi
//  * @Date: 2026-02-10 21:41:17
//  * @LastEditors: NanluQingshi
//  * @LastEditTime: 2026-02-10 22:00:06
//  * @Description:
//  */
// const port = 3000;

// async function fetchStream() {
//   const res = await fetch(`http://localhost:${port}`, {
//     method: 'POST',
//     headers: {
//       'content-type': 'application/json',
//     },
//     body: JSON.stringify({
//       question: "什么是球状闪电",
//       session_id: "test-server",
//     }),
//   });
//   console.log('res--', res);
//   // if (!res) {
//   //   throw new Error('Network response was not ok');
//   // }
//   const reader = res.body.getReader();
//   const decoder = new TextDecoder();
//   console.log("开始接收流...");

//   while (true) {
//     const { done, value } = await reader.read();

//     if (done) {
//       console.log("流传输结束");
//       break;
//     }

//     const text = decoder.decode(value, { stream: true });

//     console.log('收到片段: ', text);
//   }
// }

// try {
//   fetchStream();  
// } catch (err) {
//   console.log('err--', err);
// }


const port = 3000;

async function fetchStream() {
  const response = await fetch(`http://127.0.0.1:${port}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      question: "什么是球状闪电",
      session_id: "test-server",
    }),
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
  }

  console.log("Stream has ended");
}

fetchStream();