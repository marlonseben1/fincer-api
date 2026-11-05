import { Router } from 'express';
import { ApiResponse, requireUsuarioId } from '../../lib/index.js';
import { authenticate, validateQuery } from '../../middlewares/index.js';
import {
  type ListarFornecedoresQuery,
  listarFornecedoresQuerySchema,
} from './fornecedores.schemas.js';
import { listarFornecedores } from './fornecedores.service.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(listarFornecedoresQuerySchema),
  async (req, res) => {
    const query = res.locals.query as ListarFornecedoresQuery;
    const fornecedores = await listarFornecedores(requireUsuarioId(req), query);
    ApiResponse.success(res, { fornecedores });
  },
);

export { router as fornecedoresRoutes };
