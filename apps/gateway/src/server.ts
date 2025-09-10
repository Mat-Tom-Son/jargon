import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/error';
import { makeRouter } from './routes';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(requestId);

// Mount the API routes.  The routes module handles compilation,
// policy checks, execution, and context generation.
app.use(makeRouter());

// Global error handler
app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Translation gateway listening on ${port}`);
});