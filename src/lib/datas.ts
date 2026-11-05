import { FUSO_HORARIO } from '../constants/fuso-horario.js';

const formatadorDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_HORARIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Data de hoje no fuso do app, como "YYYY-MM-DD". */
export function hoje(): string {
  return formatadorDia.format(new Date());
}

/** "YYYY-MM-DD" -> Date à meia-noite UTC (formato das colunas @db.Date). */
export function paraData(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Date de uma coluna @db.Date -> "YYYY-MM-DD". */
export function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Mês atual no fuso do app, como "YYYY-MM". */
export function mesAtual(): string {
  return hoje().slice(0, 7);
}

/** Soma (ou subtrai) meses de um "YYYY-MM". */
export function somarMeses(mes: string, quantidade: number): string {
  const [ano = 0, numero = 1] = mes.split('-').map(Number);
  const data = new Date(Date.UTC(ano, numero - 1 + quantidade, 1));
  return data.toISOString().slice(0, 7);
}

/** Intervalo [inicio, fim) de um mês, como "YYYY-MM-DD". */
export function intervaloDoMes(mes: string) {
  return { inicio: `${mes}-01`, fim: `${somarMeses(mes, 1)}-01` };
}
