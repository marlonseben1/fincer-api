import { BANCOS, type CodigoBanco } from './bancos.constants.js';

export function isCodigoBanco(codigo: string): codigo is CodigoBanco {
  return Object.hasOwn(BANCOS, codigo);
}
