CREATE TABLE IF NOT EXISTS DENUNCIA (
  id_denuncia INT AUTO_INCREMENT PRIMARY KEY,
  tipo_conta ENUM('usuaria', 'empresa') NOT NULL,
  id_conta INT NOT NULL,
  alvo_tipo ENUM('publicacao', 'publicacao_empresa', 'comentario', 'perfil', 'empresa', 'vaga', 'comunidade') NOT NULL,
  alvo_id INT NOT NULL,
  motivo VARCHAR(30) NOT NULL,
  descricao VARCHAR(500) NULL,
  status ENUM('aberta', 'resolvida', 'descartada') NOT NULL DEFAULT 'aberta',
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_admin INT NULL,
  resolucao VARCHAR(300) NULL,
  resolvida_em DATETIME NULL,
  UNIQUE KEY uq_denuncia (tipo_conta, id_conta, alvo_tipo, alvo_id),
  KEY ix_denuncia_status (status, criada_em),
  KEY ix_denuncia_alvo (alvo_tipo, alvo_id),
  CONSTRAINT fk_denuncia_admin FOREIGN KEY (id_admin) REFERENCES ADMINS (id_admin)
);
