CREATE TYPE "GiftStatus" AS ENUM ('disponivel', 'reservado');

CREATE TABLE "presentes" (
  "id" SERIAL NOT NULL,
  "nome" TEXT NOT NULL,
  "categoria" TEXT,
  "descricao" TEXT,
  "valor_formatado" TEXT,
  "valor_centavos" INTEGER,
  "linha_planilha" INTEGER,
  "status" "GiftStatus" NOT NULL DEFAULT 'disponivel',
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "presentes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reservas" (
  "id" SERIAL NOT NULL,
  "presente_id" INTEGER NOT NULL,
  "nome_convidado" TEXT NOT NULL,
  "whatsapp_convidado" TEXT,
  "mensagem" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "presentes_linha_planilha_key" ON "presentes"("linha_planilha");
CREATE INDEX "presentes_status_idx" ON "presentes"("status");
CREATE INDEX "presentes_categoria_idx" ON "presentes"("categoria");
CREATE UNIQUE INDEX "reservas_presente_id_key" ON "reservas"("presente_id");

ALTER TABLE "reservas"
  ADD CONSTRAINT "reservas_presente_id_fkey"
  FOREIGN KEY ("presente_id") REFERENCES "presentes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
