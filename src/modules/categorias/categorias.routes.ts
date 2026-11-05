import { Router } from 'express';
import { HttpStatus } from '../../constants/http-status.js';
import { ApiResponse, requireUsuarioId } from '../../lib/index.js';
import {
  authenticate,
  validateBody,
  validateQuery,
} from '../../middlewares/index.js';
import {
  type AtualizarCategoriaInput,
  atualizarCategoriaSchema,
  type CriarCategoriaInput,
  criarCategoriaSchema,
  type ListarCategoriasQuery,
  listarCategoriasQuerySchema,
} from './categorias.schemas.js';
import {
  arquivarCategoria,
  atualizarCategoria,
  buscarCategoria,
  criarCategoria,
  listarCategorias,
  restaurarCategoria,
} from './categorias.service.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(listarCategoriasQuerySchema),
  async (req, res) => {
    const query = res.locals.query as ListarCategoriasQuery;
    const categorias = await listarCategorias(requireUsuarioId(req), query);
    ApiResponse.success(res, { categorias });
  },
);

router.get('/:id', async (req, res) => {
  const categoria = await buscarCategoria(requireUsuarioId(req), req.params.id);
  ApiResponse.success(res, { categoria });
});

router.post('/', validateBody(criarCategoriaSchema), async (req, res) => {
  const categoria = await criarCategoria(
    requireUsuarioId(req),
    req.body as CriarCategoriaInput,
  );
  ApiResponse.created(res, { categoria });
});

router.patch<{ id: string }>(
  '/:id',
  validateBody(atualizarCategoriaSchema),
  async (req, res) => {
    const categoria = await atualizarCategoria(
      requireUsuarioId(req),
      req.params.id,
      req.body as AtualizarCategoriaInput,
    );
    ApiResponse.success(res, { categoria });
  },
);

router.delete('/:id', async (req, res) => {
  await arquivarCategoria(requireUsuarioId(req), req.params.id);
  res.status(HttpStatus.NO_CONTENT).end();
});

router.post('/:id/restaurar', async (req, res) => {
  const categoria = await restaurarCategoria(
    requireUsuarioId(req),
    req.params.id,
  );
  ApiResponse.success(res, { categoria });
});

export { router as categoriasRoutes };
