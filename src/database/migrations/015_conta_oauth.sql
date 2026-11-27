-- Contas da Bloom ligadas a um login externo (Google ou GitHub).
-- id_provedor é o identificador estável da pessoa no provedor (não o e-mail).
CREATE TABLE IF NOT EXISTS CONTA_OAUTH (
  id_conta_oauth INT AUTO_INCREMENT PRIMARY KEY,
  tipo_conta ENUM('usuaria', 'empresa') NOT NULL,
  id_conta INT NOT NULL,
  provedor ENUM('google', 'github') NOT NULL,
  id_provedor VARCHAR(100) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conta_oauth_provedor (provedor, tipo_conta, id_provedor),
  INDEX idx_conta_oauth_conta (tipo_conta, id_conta)
);
