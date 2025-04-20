// dev.js
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`🔧 Dev server running at http://localhost:${PORT}`);
  console.log(`🧠 OpenAI Key loaded: ${process.env.OPENAI_API_KEY ? '✅' : '❌ Not set'}`);
  console.log(`🔐 Supabase URL loaded: ${process.env.SUPABASE_URL ? '✅' : '❌ Not set'}`);
});

