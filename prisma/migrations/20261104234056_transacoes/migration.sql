-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('RECEITA', 'DESPESA', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "categoria_padrao_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "valor" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "descricao" VARCHAR(200),
    "conta_id" TEXT NOT NULL,
    "conta_destino_id" TEXT,
    "categoria_id" TEXT,
    "fornecedor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_usuario_id_nome_key" ON "fornecedores"("usuario_id", "nome");

-- CreateIndex
CREATE INDEX "transacoes_usuario_id_data_idx" ON "transacoes"("usuario_id", "data");

-- CreateIndex
CREATE INDEX "transacoes_conta_id_idx" ON "transacoes"("conta_id");

-- CreateIndex
CREATE INDEX "transacoes_conta_destino_id_idx" ON "transacoes"("conta_destino_id");

-- CreateIndex
CREATE INDEX "transacoes_categoria_id_idx" ON "transacoes"("categoria_id");

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_categoria_padrao_id_fkey" FOREIGN KEY ("categoria_padrao_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_conta_destino_id_fkey" FOREIGN KEY ("conta_destino_id") REFERENCES "contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
