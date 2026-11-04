import type { TipoCategoria } from '../../generated/prisma/client.js';

interface CategoriaInicial {
  nome: string;
  tipo: TipoCategoria;
  icone: string; // nome do ícone no front (MUI Icons)
}

/** Criadas no onboarding, quando o usuário opta pelas categorias iniciais. */
export const CATEGORIAS_INICIAIS: CategoriaInicial[] = [
  { nome: 'Mercado', tipo: 'DESPESA', icone: 'ShoppingCart' },
  { nome: 'Alimentação', tipo: 'DESPESA', icone: 'Restaurant' },
  { nome: 'Transporte', tipo: 'DESPESA', icone: 'Commute' },
  { nome: 'Moradia', tipo: 'DESPESA', icone: 'Home' },
  { nome: 'Saúde', tipo: 'DESPESA', icone: 'LocalHospital' },
  { nome: 'Lazer', tipo: 'DESPESA', icone: 'TheaterComedy' },
  { nome: 'Assinaturas', tipo: 'DESPESA', icone: 'Subscriptions' },
  { nome: 'Compras', tipo: 'DESPESA', icone: 'Storefront' },
  { nome: 'Educação', tipo: 'DESPESA', icone: 'School' },
  { nome: 'Outros', tipo: 'DESPESA', icone: 'MoreHoriz' },
  { nome: 'Salário', tipo: 'RECEITA', icone: 'Work' },
  { nome: 'Reembolsos', tipo: 'RECEITA', icone: 'CurrencyExchange' },
  { nome: 'Outros', tipo: 'RECEITA', icone: 'MoreHoriz' },
];
