import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { APP } from './config/constants.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: APP.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (APP.NODE_ENV !== 'test') {
  app.use(morgan(APP.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', env: APP.NODE_ENV, time: new Date().toISOString() })
);

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(APP.PORT, () => {
  console.log(`\nParkGo API listening on http://localhost:${APP.PORT}`);
  console.log(`  env:      ${APP.NODE_ENV}`);
  console.log(`  frontend: ${APP.FRONTEND_URL}`);
  console.log(`  health:   http://localhost:${APP.PORT}/health\n`);
});
