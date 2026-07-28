ALTER TABLE "confirmacoes_presenca"
  ADD COLUMN "nomes_confirmados" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "confirmacoes_presenca"
SET "nomes_confirmados" = ARRAY["nome_convidado"]
WHERE cardinality("nomes_confirmados") = 0;
