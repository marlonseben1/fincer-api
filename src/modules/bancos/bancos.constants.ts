/**
 * Bancos pelo código COMPE. Para adicionar um banco, basta incluir aqui:
 * a coluna `contas.banco` guarda só o código, sem precisar de migration.
 */
export const BANCOS = {
  '001': 'Banco do Brasil',
  '033': 'Santander',
  '077': 'Inter',
  '102': 'XP Investimentos',
  '104': 'Caixa',
  '208': 'BTG Pactual',
  '237': 'Bradesco',
  '260': 'Nubank',
  '323': 'Mercado Pago',
  '336': 'C6 Bank',
  '341': 'Itaú',
  '380': 'PicPay',
  '748': 'Sicredi',
  '756': 'Sicoob',
} as const;

export type CodigoBanco = keyof typeof BANCOS;
