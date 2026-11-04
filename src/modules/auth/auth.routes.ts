import { Router } from 'express';
import { requireUsuarioId } from '../../lib/auth-context.js';
import { clearAuthCookie, setAuthCookie } from '../../lib/cookies.js';
import { ApiResponse } from '../../lib/http-response.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authRateLimit } from '../../middlewares/rate-limit.js';
import { validateBody } from '../../middlewares/validate.js';
import { type LoginInput, loginSchema } from './auth.schemas.js';
import { buscarUsuarioAtual, loginComGoogle } from './auth.service.js';

const router = Router();

router.post(
  '/google',
  authRateLimit,
  validateBody(loginSchema),
  async (req, res) => {
    const { token: googleToken } = req.body as LoginInput;
    const { token, usuario } = await loginComGoogle(googleToken);

    setAuthCookie(res, token);
    ApiResponse.success(res, { usuario });
  },
);

router.get('/me', authenticate, async (req, res) => {
  const usuario = await buscarUsuarioAtual(requireUsuarioId(req));
  ApiResponse.success(res, { usuario });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  ApiResponse.success(res, { message: 'Sessão encerrada.' });
});

export { router as authRoutes };
