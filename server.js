require('dotenv').config();
const app = require('./src/app');
const { startScheduler } = require('./src/scheduler');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅  MYR Smart FX Alert backend running on port ${PORT}`);
  startScheduler();
});
