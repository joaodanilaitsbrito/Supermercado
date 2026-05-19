-- ============================================================
--  SUPERMERCADO PDV — Script completo para Supabase
--  Cole no SQL Editor do Supabase e clique em "Run"
-- ============================================================

-- 1. CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
  id        SERIAL PRIMARY KEY,
  nome      TEXT NOT NULL,
  icone     TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
  id            SERIAL PRIMARY KEY,
  codigo_barras TEXT UNIQUE NOT NULL,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  categoria_id  INT REFERENCES categorias(id),
  preco         NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  estoque       INT NOT NULL DEFAULT 0,
  unidade       TEXT NOT NULL DEFAULT 'UN',
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OPERADORES
CREATE TABLE IF NOT EXISTS operadores (
  id        SERIAL PRIMARY KEY,
  nome      TEXT NOT NULL,
  cpf       TEXT UNIQUE,
  matricula TEXT UNIQUE NOT NULL,
  senha     TEXT NOT NULL,
  ativo     BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VENDAS
CREATE TABLE IF NOT EXISTS vendas (
  id              SERIAL PRIMARY KEY,
  operador_id     INT REFERENCES operadores(id),
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto        NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL DEFAULT 'dinheiro',
  valor_pago      NUMERIC(10,2),
  troco           NUMERIC(10,2) DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'aberta',
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  finalizado_em   TIMESTAMPTZ
);

-- 5. ITENS DA VENDA
CREATE TABLE IF NOT EXISTS itens_venda (
  id         SERIAL PRIMARY KEY,
  venda_id   INT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id INT NOT NULL REFERENCES produtos(id),
  quantidade NUMERIC(10,3) NOT NULL DEFAULT 1,
  preco_unit NUMERIC(10,2) NOT NULL,
  subtotal   NUMERIC(10,2) NOT NULL,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_nome   ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_itens_venda     ON itens_venda(venda_id);

-- 7. TRIGGER atualiza timestamp
CREATE OR REPLACE FUNCTION fn_atualiza_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tg_produtos_atualiza
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

-- 8. CATEGORIAS
INSERT INTO categorias (nome, icone) VALUES
  ('Hortifrúti','🥦'),('Laticínios','🥛'),('Carnes','🥩'),
  ('Padaria','🍞'),('Bebidas','🥤'),('Limpeza','🧹'),
  ('Higiene','🧴'),('Mercearia','🛒'),('Congelados','❄️'),
  ('Snacks e Doces','🍫')
ON CONFLICT DO NOTHING;

-- 9. OPERADORES
INSERT INTO operadores (nome, cpf, matricula, senha) VALUES
  ('Carlos Mendes','123.456.789-00','OP001','1234'),
  ('Fernanda Lima','987.654.321-00','OP002','1234'),
  ('Roberto Alves','456.789.123-00','OP003','1234')
ON CONFLICT DO NOTHING;

-- 10. PRODUTOS
INSERT INTO produtos (codigo_barras, nome, preco, estoque, unidade, categoria_id) VALUES
  ('7891234560001','Banana Prata (kg)',3.49,200,'KG',1),
  ('7891234560002','Maçã Fuji (kg)',7.99,150,'KG',1),
  ('7891234560003','Alface Crespa',2.29,80,'UN',1),
  ('7891234560004','Tomate Italiano (kg)',5.99,120,'KG',1),
  ('7891234560005','Cebola (kg)',4.49,180,'KG',1),
  ('7891234560006','Batata Inglesa (kg)',3.99,200,'KG',1),
  ('7891234560007','Limão Taiti (kg)',6.99,100,'KG',1),
  ('7891234560008','Melancia (unid)',14.90,20,'UN',1),
  ('7891234560010','Leite Integral 1L Tiroleza',4.89,300,'UN',2),
  ('7891234560011','Leite Desnatado 1L Tiroleza',5.29,200,'UN',2),
  ('7891234560012','Queijo Mussarela 500g',19.90,80,'UN',2),
  ('7891234560013','Queijo Prato Fatiado 200g',12.50,60,'UN',2),
  ('7891234560014','Iogurte Natural 170g Danúbio',3.49,120,'UN',2),
  ('7891234560015','Manteiga com Sal 200g Aviação',9.99,90,'UN',2),
  ('7891234560016','Requeijão Cremoso 200g',7.89,70,'UN',2),
  ('7891234560017','Creme de Leite 200ml Mococa',3.29,150,'UN',2),
  ('7891234560020','Frango Inteiro Congelado (kg)',9.99,50,'KG',3),
  ('7891234560021','Peito de Frango (kg)',18.90,40,'KG',3),
  ('7891234560022','Carne Moída Patinho (kg)',32.90,30,'KG',3),
  ('7891234560023','Costela Bovina (kg)',39.90,20,'KG',3),
  ('7891234560024','Linguiça Toscana 500g Seara',13.99,60,'UN',3),
  ('7891234560025','Salsicha 500g Sadia',8.49,80,'UN',3),
  ('7891234560030','Pão de Forma Integral 500g Seven',6.99,100,'UN',4),
  ('7891234560031','Pão de Forma Tradicional 500g',5.49,120,'UN',4),
  ('7891234560032','Bolo de Chocolate Fatiado 400g',11.90,40,'UN',4),
  ('7891234560033','Torrada Tradicional 160g Wickbold',5.29,80,'UN',4),
  ('7891234560034','Biscoito Cream Cracker 200g',4.19,100,'UN',4),
  ('7891234560040','Refrigerante Coca-Cola 2L',9.99,200,'UN',5),
  ('7891234560041','Refrigerante Guaraná 2L',7.49,180,'UN',5),
  ('7891234560042','Água Mineral 500ml Crystal',1.99,500,'UN',5),
  ('7891234560043','Água Mineral 1,5L Crystal',3.49,300,'UN',5),
  ('7891234560044','Suco de Laranja 1L Del Valle',7.99,100,'UN',5),
  ('7891234560045','Cerveja Skol Lata 350ml',3.49,400,'UN',5),
  ('7891234560046','Energético Monster 473ml',10.99,80,'UN',5),
  ('7891234560047','Chá Gelado Lipton Limão 1L',5.99,90,'UN',5),
  ('7891234560050','Detergente Líquido Ypê 500ml',2.29,200,'UN',6),
  ('7891234560051','Sabão em Pó Omo 1kg',16.99,80,'UN',6),
  ('7891234560052','Amaciante Comfort 1L',9.49,70,'UN',6),
  ('7891234560053','Água Sanitária 1L Qboa',3.99,150,'UN',6),
  ('7891234560054','Desengordurante Spray 500ml',7.99,60,'UN',6),
  ('7891234560055','Papel Higiênico Neve 12 rolos',19.90,100,'UN',6),
  ('7891234560056','Esponja de Limpeza c/2',3.49,120,'UN',6),
  ('7891234560060','Shampoo Seda Ceramidas 325ml',12.99,90,'UN',7),
  ('7891234560061','Condicionador Pantene 200ml',13.49,80,'UN',7),
  ('7891234560062','Sabonete Dove Hidratante 90g',3.99,200,'UN',7),
  ('7891234560063','Creme Dental Colgate 90g',4.29,150,'UN',7),
  ('7891234560064','Desodorante Rexona Roll-On 50ml',10.49,80,'UN',7),
  ('7891234560065','Absorvente Always com Abas c/8',6.99,70,'UN',7),
  ('7891234560066','Aparelho de Barbear Gillette c/2',7.99,60,'UN',7),
  ('7891234560070','Arroz Branco Tipo 1 5kg Camil',22.90,80,'UN',8),
  ('7891234560071','Feijão Carioca 1kg Camil',7.99,120,'UN',8),
  ('7891234560072','Macarrão Espaguete 500g',4.49,150,'UN',8),
  ('7891234560073','Óleo de Soja 900ml Soya',7.49,100,'UN',8),
  ('7891234560074','Açúcar Cristal 1kg União',4.99,200,'UN',8),
  ('7891234560075','Sal Refinado 1kg Cisne',2.49,250,'UN',8),
  ('7891234560076','Café Torrado 500g Melitta',15.99,90,'UN',8),
  ('7891234560077','Farinha de Trigo 1kg Renata',5.49,110,'UN',8),
  ('7891234560078','Extrato de Tomate 340g Elefante',4.29,130,'UN',8),
  ('7891234560079','Atum em Lata 170g Coqueiro',7.99,100,'UN',8),
  ('7891234560080','Pizza Mussarela 460g Sadia',19.90,40,'UN',9),
  ('7891234560081','Lasanha Bolonhesa 600g Nestlé',18.49,35,'UN',9),
  ('7891234560082','Batata Frita Congelada 400g',12.99,50,'UN',9),
  ('7891234560083','Sorvete Creme 1,5L Kibon',22.90,30,'UN',9),
  ('7891234560090','Bolacha Recheada Oreo 120g',5.49,120,'UN',10),
  ('7891234560091','Chips de Batata 96g',7.99,100,'UN',10),
  ('7891234560092','Chocolate ao Leite 100g Lacta',6.99,90,'UN',10),
  ('7891234560093','Barra de Cereal Nutry 25g',2.49,150,'UN',10),
  ('7891234560094','Pipoca Micro-ondas Yoki 100g',3.99,110,'UN',10),
  ('7891234560095','Amendoim Torrado c/Sal 150g',4.29,130,'UN',10)
ON CONFLICT (codigo_barras) DO NOTHING;

-- 11. ROW LEVEL SECURITY (RLS)
ALTER TABLE produtos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE operadores  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_leitura"    ON produtos    FOR SELECT USING (true);
CREATE POLICY "categorias_leitura"  ON categorias  FOR SELECT USING (true);
CREATE POLICY "operadores_leitura"  ON operadores  FOR SELECT USING (true);
CREATE POLICY "vendas_insert"       ON vendas      FOR INSERT WITH CHECK (true);
CREATE POLICY "vendas_select"       ON vendas      FOR SELECT USING (true);
CREATE POLICY "vendas_update"       ON vendas      FOR UPDATE USING (true);
CREATE POLICY "itens_insert"        ON itens_venda FOR INSERT WITH CHECK (true);
CREATE POLICY "itens_select"        ON itens_venda FOR SELECT USING (true);
