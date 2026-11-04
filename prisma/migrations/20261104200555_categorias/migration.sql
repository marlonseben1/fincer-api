-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('RECEITA', 'DESPESA');

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nome" VARCHAR(30) NOT NULL,
    "icone" VARCHAR(50),
    "tipo" "TipoCategoria" NOT NULL,
    "arquivada_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categorias_usuario_id_idx" ON "categorias"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_usuario_id_tipo_nome_key" ON "categorias"("usuario_id", "tipo", "nome");

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

