import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { startCronJobs } from "./services/cron-jobs.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
  startCronJobs();
});

