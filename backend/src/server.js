import express from 'express';
import cors from 'cors';
import { authMiddleware, requireAdmin, sanitizeClaims } from './auth.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

app.use(express.json());
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/me', authMiddleware, (req, res) => {
  res.json({
    ok: true,
    claims: sanitizeClaims(req.auth),
  });
});

app.get('/admin', authMiddleware, requireAdmin, (req, res) => {
  res.json({
    ok: true,
    message: 'admin access granted',
    subject: req.auth.sub,
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const message = err instanceof Error ? err.message : 'Unexpected error';
  return res.status(500).json({ error: 'server_error', message });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
