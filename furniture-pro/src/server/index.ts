import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'fsdpro-api', by: 'Lerwinson Mendoza' }));
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const port = Number(process.env.SERVER_PORT) || 4000;
app.listen(port, () => console.log(`FSD Pro API listening on http://localhost:${port}/api`));
