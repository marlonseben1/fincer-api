import { Router } from 'express';
import { HttpStatus } from '../../constants/http-status.js';
import { requireUsuarioId } from '../../lib/auth-context.js';
import { ApiResponse } from '../../lib/http-response.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import {
  type AtualizarTransacaoInput,
  atualizarTransacaoSchema,
  type CriarLancamentoInput,
  type CriarTransferenciaInput,
  criarLancamentoSchema,
  criarTransferenciaSchema,
  type ListarTransacoesQuery,
  listarTransacoesQuerySchema,
} from './transacoes.schemas.js';
import {
  atualizarTransacao,
  buscarTransacao,
  criarLancamento,
  criarTransferencia,
  excluirTransacao,
  listarTransacoes,
} from './transacoes.service.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(listarTransacoesQuerySchema),
  async (req, res) => {
    const query = res.locals.query as ListarTransacoesQuery;
    const resultado = await listarTransacoes(requireUsuarioId(req), query);
    ApiResponse.success(res, resultado);
  },
);

router.get('/:id', async (req, res) => {
  const transacao = await buscarTransacao(requireUsuarioId(req), req.params.id);
  ApiResponse.success(res, { transacao });
});

router.post('/', validateBody(criarLancamentoSchema), async (req, res) => {
  const transacao = await criarLancamento(
    requireUsuarioId(req),
    req.body as CriarLancamentoInput,
  );
  ApiResponse.created(res, { transacao });
});

router.post(
  '/transferencias',
  validateBody(criarTransferenciaSchema),
  async (req, res) => {
    const transacao = await criarTransferencia(
      requireUsuarioId(req),
      req.body as CriarTransferenciaInput,
    );
    ApiResponse.created(res, { transacao });
  },
);

router.patch<{ id: string }>(
  '/:id',
  validateBody(atualizarTransacaoSchema),
  async (req, res) => {
    const transacao = await atualizarTransacao(
      requireUsuarioId(req),
      req.params.id,
      req.body as AtualizarTransacaoInput,
    );
    ApiResponse.success(res, { transacao });
  },
);

router.delete('/:id', async (req, res) => {
  await excluirTransacao(requireUsuarioId(req), req.params.id);
  res.status(HttpStatus.NO_CONTENT).end();
});

export { router as transacoesRoutes };
