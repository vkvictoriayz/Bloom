ALTER TABLE CADASTRO_USUARIA ADD COLUMN email_verificado_em DATETIME NULL;
ALTER TABLE CADASTRO_EMPRESA ADD COLUMN email_verificado_em DATETIME NULL;

CREATE TABLE IF NOT EXISTS VERIFICACAO_EMAIL (
  id_verificacao_email INT AUTO_INCREMENT PRIMARY KEY,
  tipo_conta ENUM('usuaria', 'empresa') NOT NULL,
  id_conta INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expira_em DATETIME NOT NULL,
  usado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_verificacao_email_conta (tipo_conta, id_conta)
);
