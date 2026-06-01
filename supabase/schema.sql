-- =============================================================
-- Cases Store - Supabase Schema SQL
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================================

-- Extensao para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- Tabela: store_settings
-- Configuracoes gerais da loja
-- =============================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'CASES STORE',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuracao padrao se nao existir
INSERT INTO store_settings (name, logo_url)
SELECT 'CASES STORE', ''
WHERE NOT EXISTS (SELECT 1 FROM store_settings LIMIT 1);

-- =============================================================
-- Tabela: phones
-- Aparelhos cadastrados
-- =============================================================
CREATE TABLE IF NOT EXISTS phones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  storage TEXT NOT NULL,
  imei TEXT DEFAULT '',
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  observation TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- Tabela: phone_photos
-- Fotos dos aparelhos (salvar URL e path do Supabase Storage)
-- NAO salvar base64 aqui
-- =============================================================
CREATE TABLE IF NOT EXISTS phone_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- Tabela: phone_checklist
-- Itens de checklist tecnico por aparelho
-- =============================================================
CREATE TABLE IF NOT EXISTS phone_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'static' CHECK (type IN ('static', 'custom')),
  checked BOOLEAN DEFAULT FALSE,
  value TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- Tabela: installment_rates
-- Taxas de parcelamento (1x a 12x)
-- =============================================================
CREATE TABLE IF NOT EXISTS installment_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  months INTEGER NOT NULL UNIQUE CHECK (months >= 1 AND months <= 12),
  rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir taxas padrao se nao existirem
INSERT INTO installment_rates (months, rate)
VALUES
  (1, 0), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6),
  (7, 7), (8, 8), (9, 9), (10, 10), (11, 11), (12, 12)
ON CONFLICT (months) DO NOTHING;

-- =============================================================
-- Triggers para atualizar updated_at automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phones_updated_at
  BEFORE UPDATE ON phones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_rates_updated_at
  BEFORE UPDATE ON installment_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- Row Level Security (RLS)
-- Sistema administrativo simples: permitir tudo com anon key
-- =============================================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_rates ENABLE ROW LEVEL SECURITY;

-- Politicas para store_settings
CREATE POLICY "Permitir leitura publica store_settings"
  ON store_settings FOR SELECT USING (true);
CREATE POLICY "Permitir insercao store_settings"
  ON store_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao store_settings"
  ON store_settings FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao store_settings"
  ON store_settings FOR DELETE USING (true);

-- Politicas para phones
CREATE POLICY "Permitir leitura publica phones"
  ON phones FOR SELECT USING (true);
CREATE POLICY "Permitir insercao phones"
  ON phones FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao phones"
  ON phones FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao phones"
  ON phones FOR DELETE USING (true);

-- Politicas para phone_photos
CREATE POLICY "Permitir leitura publica phone_photos"
  ON phone_photos FOR SELECT USING (true);
CREATE POLICY "Permitir insercao phone_photos"
  ON phone_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao phone_photos"
  ON phone_photos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao phone_photos"
  ON phone_photos FOR DELETE USING (true);

-- Politicas para phone_checklist
CREATE POLICY "Permitir leitura publica phone_checklist"
  ON phone_checklist FOR SELECT USING (true);
CREATE POLICY "Permitir insercao phone_checklist"
  ON phone_checklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao phone_checklist"
  ON phone_checklist FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao phone_checklist"
  ON phone_checklist FOR DELETE USING (true);

-- Politicas para installment_rates
CREATE POLICY "Permitir leitura publica installment_rates"
  ON installment_rates FOR SELECT USING (true);
CREATE POLICY "Permitir insercao installment_rates"
  ON installment_rates FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao installment_rates"
  ON installment_rates FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao installment_rates"
  ON installment_rates FOR DELETE USING (true);

-- =============================================================
-- Indices para performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_phones_status ON phones(status);
CREATE INDEX IF NOT EXISTS idx_phones_brand ON phones(brand);
CREATE INDEX IF NOT EXISTS idx_phone_photos_phone_id ON phone_photos(phone_id);
CREATE INDEX IF NOT EXISTS idx_phone_checklist_phone_id ON phone_checklist(phone_id);
CREATE INDEX IF NOT EXISTS idx_installment_rates_months ON installment_rates(months);

-- FIM DO SCHEMA
