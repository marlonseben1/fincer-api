import { Router } from 'express';
import { HttpStatus } from '../../constants/http-status.js';
import { requireUsuarioId } from '../../lib/auth-context.js';
import { ApiResponse } from '../../lib/http-response.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import {
  type AtualizarContaInput,
  atualizarContaSchema,
  type CriarContaInput,
  criarContaSchema,
  type ListarContasQuery,
  listarContasQuerySchema,
} from './contas.schemas.js';
import {
  arquivarConta,
  atualizarConta,
  buscarConta,
  criarConta,
  listarContas,
} from './contas.service.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(listarContasQuerySchema), async (req, res) => {
  const query = res.locals.query as ListarContasQuery;
  const contas = await listarContas(requireUsuarioId(req), query);
  ApiResponse.success(res, { contas });
});

router.get('/:id', async (req, res) => {
  const conta = await buscarConta(requireUsuarioId(req), req.params.id);
  ApiResponse.success(res, { conta });
});

router.post('/', validateBody(criarContaSchema), async (req, res) => {
  const conta = await criarConta(
    requireUsuarioId(req),
    req.body as CriarContaInput,
  );
  ApiResponse.created(res, { conta });
});

router.patch<{ id: string }>(
  '/:id',
  validateBody(atualizarContaSchema),
  async (req, res) => {
    const conta = await atualizarConta(
      requireUsuarioId(req),
      req.params.id,
      req.body as AtualizarContaInput,
    );
    ApiResponse.success(res, { conta });
  },
);

router.delete('/:id', async (req, res) => {
  await arquivarConta(requireUsuarioId(req), req.params.id);
  res.status(HttpStatus.NO_CONTENT).end();
});

export { router as contasRoutes };
