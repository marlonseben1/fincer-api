import { Router } from 'express';
import { ApiResponse } from '../../lib/index.js';
import { authenticate } from '../../middlewares/index.js';
import { BANCOS } from './bancos.constants.js';

const router = Router();

router.get('/', authenticate, (_req, res) => {
  const bancos = Object.entries(BANCOS).map(([codigo, nome]) => ({
    codigo,
    nome,
  }));
  ApiResponse.success(res, { bancos });
});

export { router as bancosRoutes };
