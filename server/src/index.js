import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`API listening at http://localhost:${port}`));
  })
  .catch(e => {
    console.error('Database connection failed:', e.message);
    process.exit(1);
  });
