import { Router } from 'express';
import { ApiResponse, requireUsuarioId } from '../../lib/index.js';
import { authenticate, validateQuery } from '../../middlewares/index.js';
import {
  type CategoriasQuery,
  type ComparativoQuery,
  categoriasQuerySchema,
  comparativoQuerySchema,
  type ResumoQuery,
  resumoQuerySchema,
} from './dashboard.schemas.js';
import { comparativo, porCategoria, resumo } from './dashboard.service.js';

const router = Router();

router.use(authenticate);

router.get('/resumo', validateQuery(resumoQuerySchema), async (req, res) => {
  const query = res.locals.query as ResumoQuery;
  ApiResponse.success(res, await resumo(requireUsuarioId(req), query));
});

router.get(
  '/comparativo',
  validateQuery(comparativoQuerySchema),
  async (req, res) => {
    const query = res.locals.query as ComparativoQuery;
    const meses = await comparativo(requireUsuarioId(req), query);
    ApiResponse.success(res, { meses });
  },
);

router.get(
  '/categorias',
  validateQuery(categoriasQuerySchema),
  async (req, res) => {
    const query = res.locals.query as CategoriasQuery;
    ApiResponse.success(res, await porCategoria(requireUsuarioId(req), query));
  },
);

export { router as dashboardRoutes };
