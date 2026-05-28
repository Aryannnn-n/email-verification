// Local Express dev server runner.

import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n  🚀 Express Email Verifier running at http://localhost:${PORT}\n`);
});