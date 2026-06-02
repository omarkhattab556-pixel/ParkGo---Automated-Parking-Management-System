import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { APP } from './config/constants.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import subscriberRoutes from './routes/subscriber.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import parkingRoutes from './routes/parking.routes.js';
import facilityRoutes from './routes/facility.routes.js';
import reportsRoutes from './routes/reports.routes.js';

import { startFreeInstallersJob } from './jobs/freeInstallers.job.js';
import { startCancelExpiredJob } from './jobs/cancelExpiredReservations.job.js';
import { startCheckLateReturnsJob } from './jobs/checkLateReturns.job.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (curl, health checks) that send no Origin,
      // and any origin in the configured allow-list.
      if (!origin || APP.CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
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
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/reports', reportsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(APP.PORT, () => {
  console.log(`\nParkGo API listening on http://localhost:${APP.PORT}`);
  console.log(`  env:      ${APP.NODE_ENV}`);
  console.log(`  frontend: ${APP.FRONTEND_URL}`);
  console.log(`  health:   http://localhost:${APP.PORT}/health\n`);

  if (APP.NODE_ENV !== 'test') {
    startFreeInstallersJob();
    startCancelExpiredJob();
    startCheckLateReturnsJob();
  }
});
