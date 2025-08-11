import { executeUserCode } from "../workers/workerManager";

const code = `
console.log("✅ Hello from isolated Docker container!");
`;

executeUserCode({ code })
  .then((res) => {
    console.log("Execution Result:\n", res);
  })
  .catch((err) => {
    console.error("Execution Failed:\n", err);
  });
