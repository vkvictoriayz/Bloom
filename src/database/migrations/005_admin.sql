-- 005: área de administração
--  * as tabelas ADMINS, LOGS_ADMIN e DASHBOARD_ADMIN são as do "banco bloom.sql"
--    (criadas aqui só se não existirem);
--  * contas de candidata e empresa podem ser suspensas por um administrador;
--  * administradores podem ser desativados; o registro de ações ganha detalhes.
-- Aplicada automaticamente pelo servidor (src/database/migracoes.js), uma vez.
-- Só acrescenta tabelas e colunas; nenhum dado existente é alterado.

CREATE TABLE IF NOT EXISTS ADMINS (
  id_admin INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  nome_usuario VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  nivel_acesso VARCHAR(50),
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS LOGS_ADMIN (
  id_log INT AUTO_INCREMENT PRIMARY KEY,
  id_admin INT NOT NULL,
  acao VARCHAR(100) NOT NULL,
  tabela_afetada VARCHAR(100),
  registro_id INT,
  data_acao DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_LOGS_ADMIN_ADMIN FOREIGN KEY (id_admin) REFERENCES ADMINS (id_admin)
);

CREATE TABLE IF NOT EXISTS DASHBOARD_ADMIN (
  id_dashboard INT AUTO_INCREMENT PRIMARY KEY,
  data_referencia DATE NOT NULL UNIQUE,
  total_usuarios INT DEFAULT 0,
  total_empresas INT DEFAULT 0,
  total_vagas INT DEFAULT 0,
  total_candidaturas INT DEFAULT 0,
  novos_usuarios_dia INT DEFAULT 0,
  novas_empresas_dia INT DEFAULT 0,
  novas_vagas_dia INT DEFAULT 0,
  novas_candidaturas_dia INT DEFAULT 0,
  atualizacao_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ADMINS ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE ADMINS ADD COLUMN ultimo_acesso DATETIME NULL;
ALTER TABLE LOGS_ADMIN ADD COLUMN detalhes VARCHAR(500) NULL;

ALTER TABLE CADASTRO_USUARIA ADD COLUMN suspensa_em DATETIME NULL;
ALTER TABLE CADASTRO_USUARIA ADD COLUMN motivo_suspensao VARCHAR(300) NULL;
ALTER TABLE CADASTRO_EMPRESA ADD COLUMN suspensa_em DATETIME NULL;
ALTER TABLE CADASTRO_EMPRESA ADD COLUMN motivo_suspensao VARCHAR(300) NULL;
