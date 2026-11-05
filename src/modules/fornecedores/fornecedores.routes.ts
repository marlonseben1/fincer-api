import { Router } from 'express';
import { requireUsuarioId } from '../../lib/auth-context.js';
import { ApiResponse } from '../../lib/http-response.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateQuery } from '../../middlewares/validate.js';
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
