import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Fraud Detection Endpoint
  app.post('/api/verify-watch', async (req, res) => {
    const { videoId, watchDuration, eventBatch, userId } = req.body;

    // Prompt Gemini to analyze behavior pattern
    // In a real app, 'eventBatch' would contain mouse movements, pauses, speed changes, etc.
    const prompt = `Analyze this video watch behavior for potential bot/fraud activity in a watch-to-earn app.
    User ID: ${userId}
    Video ID: ${videoId}
    Watch Duration: ${watchDuration}s
    Events: ${JSON.stringify(eventBatch)}
    
    Return a JSON object with:
    { "isLegitimate": boolean, "fraudScore": number (0-1), "reason": string }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Simple parse (in production, use robust JSON extraction)
      const data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
      res.json(data);
    } catch (error) {
      console.error("AI Verification failed:", error);
      res.status(500).json({ error: "Verification failed", isLegitimate: true }); // Fail open for UX, but log error
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
