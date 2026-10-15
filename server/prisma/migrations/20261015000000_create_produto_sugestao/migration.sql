-- CreateTable
CREATE TABLE "ProdutoSugestao" (
    "produtoId" TEXT NOT NULL,
    "sugestaoId" TEXT NOT NULL,

    CONSTRAINT "ProdutoSugestao_pkey" PRIMARY KEY ("produtoId", "sugestaoId")
);

-- Backfill existing comma-separated suggestions when the column exists.
INSERT INTO "ProdutoSugestao" ("produtoId", "sugestaoId")
SELECT DISTINCT p."id", trim(suggestion_id)
FROM "Produto" p
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(p."sugestoesIds", ''), '\s*,\s*') AS suggestion_id
JOIN "Produto" target ON target."id" = trim(suggestion_id)
WHERE trim(suggestion_id) <> ''
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "ProdutoSugestao" ADD CONSTRAINT "ProdutoSugestao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProdutoSugestao" ADD CONSTRAINT "ProdutoSugestao_sugestaoId_fkey" FOREIGN KEY ("sugestaoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop legacy column after backfill.
ALTER TABLE "Produto" DROP COLUMN IF EXISTS "sugestoesIds";

-- CreateIndex
CREATE INDEX "ProdutoSugestao_sugestaoId_idx" ON "ProdutoSugestao"("sugestaoId");