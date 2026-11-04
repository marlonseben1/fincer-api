import type { Response } from 'express';
import { HttpStatus } from '../constants/http-status.js';

export const ApiResponse = {
  success: <T>(
    res: Response,
    data: T,
    status: number = HttpStatus.OK,
  ): void => {
    res.status(status).json({ success: true, data });
  },
  created: <T>(res: Response, data: T): void => {
    res.status(HttpStatus.CREATED).json({ success: true, data });
  },
};
