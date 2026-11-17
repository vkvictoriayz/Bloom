CREATE TABLE IF NOT EXISTS CURRICULO_CANDIDATA (
  id_curriculo INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nome_arquivo VARCHAR(150) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  tamanho INT NOT NULL,
  dados MEDIUMBLOB NOT NULL,
  enviado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_curriculo_usuaria (id_usuario),
  CONSTRAINT fk_curriculo_usuaria FOREIGN KEY (id_usuario) REFERENCES CADASTRO_USUARIA (id_usuario)
);

CREATE TABLE IF NOT EXISTS CANDIDATURA_CURRICULO (
  id_candidatura_curriculo INT AUTO_INCREMENT PRIMARY KEY,
  id_candidatura INT NOT NULL,
  nome_arquivo VARCHAR(150) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  tamanho INT NOT NULL,
  dados MEDIUMBLOB NOT NULL,
  enviado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidatura_curriculo (id_candidatura),
  CONSTRAINT fk_candidatura_curriculo FOREIGN KEY (id_candidatura) REFERENCES CANDIDATURAS (id_candidatura) ON DELETE CASCADE
);
