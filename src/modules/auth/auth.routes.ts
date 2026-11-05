import { Router } from 'express';
import { clearAuthCookie, setAuthCookie } from '../../lib/cookies.js';
import { ApiResponse, requireUsuarioId } from '../../lib/index.js';
import {
  authenticate,
  authRateLimit,
  validateBody,
} from '../../middlewares/index.js';
import {
  type LoginInput,
  loginSchema,
  type OnboardingInput,
  onboardingSchema,
} from './auth.schemas.js';
import {
  buscarUsuarioAtual,
  concluirOnboarding,
  loginComGoogle,
} from './auth.service.js';

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

router.post(
  '/onboarding',
  authenticate,
  validateBody(onboardingSchema),
  async (req, res) => {
    const usuario = await concluirOnboarding(
      requireUsuarioId(req),
      req.body as OnboardingInput,
    );
    ApiResponse.success(res, { usuario });
  },
);

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  ApiResponse.success(res, { message: 'Sessão encerrada.' });
});

export { router as authRoutes };
