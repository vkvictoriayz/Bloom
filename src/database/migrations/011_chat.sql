ALTER TABLE MENSAGEM ADD COLUMN apagada_em DATETIME NULL;

CREATE TABLE IF NOT EXISTS MENSAGEM_IMAGEM (
  id_imagem INT AUTO_INCREMENT PRIMARY KEY,
  origem ENUM('empresa', 'direta') NOT NULL,
  id_mensagem INT NOT NULL,
  chave CHAR(32) NOT NULL UNIQUE,
  mime VARCHAR(20) NOT NULL,
  dados MEDIUMBLOB NOT NULL,
  largura INT NULL,
  altura INT NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mensagem_imagem (origem, id_mensagem)
);

CREATE TABLE IF NOT EXISTS BLOQUEIO (
  id_bloqueio INT AUTO_INCREMENT PRIMARY KEY,
  id_usuaria INT NOT NULL,
  id_bloqueada INT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bloqueio (id_usuaria, id_bloqueada),
  CONSTRAINT fk_bloqueio_usuaria FOREIGN KEY (id_usuaria) REFERENCES CADASTRO_USUARIA (id_usuario),
  CONSTRAINT fk_bloqueio_bloqueada FOREIGN KEY (id_bloqueada) REFERENCES CADASTRO_USUARIA (id_usuario)
);
