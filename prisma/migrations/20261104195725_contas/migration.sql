-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'CARTEIRA', 'CARTAO_CREDITO');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "conta_padrao_id" TEXT;

-- CreateTable
CREATE TABLE "contas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "tipo" "TipoConta" NOT NULL,
    "banco" VARCHAR(3),
    "saldo_inicial" INTEGER NOT NULL DEFAULT 0,
    "arquivada_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contas_usuario_id_idx" ON "contas"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_conta_padrao_id_key" ON "usuarios"("conta_padrao_id");

-- AddForeignKey
ALTER TABLE "contas" ADD CONSTRAINT "contas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_conta_padrao_id_fkey" FOREIGN KEY ("conta_padrao_id") REFERENCES "contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

