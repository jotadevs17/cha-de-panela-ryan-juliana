CREATE TABLE "confirmacoes_presenca" (
  "id" SERIAL NOT NULL,
  "nome_convidado" TEXT NOT NULL,
  "whatsapp_convidado" TEXT,
  "quantidade_pessoas" INTEGER NOT NULL DEFAULT 1,
  "mensagem" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "confirmacoes_presenca_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "confirmacoes_presenca_whatsapp_convidado_key" ON "confirmacoes_presenca"("whatsapp_convidado");
CREATE INDEX "confirmacoes_presenca_criado_em_idx" ON "confirmacoes_presenca"("criado_em");
