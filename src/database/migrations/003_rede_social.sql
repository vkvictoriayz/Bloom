-- 003: rede social da Bloom
--  * imagem opcional nas publicações (feed e comunidades) e marca de edição;
--  * ícone predefinido como alternativa à foto (candidatas e empresas) e
--    ícone das comunidades temáticas;
--  * conversas diretas entre candidatas (separadas das conversas com empresas).
-- Aplicada automaticamente pelo servidor (src/database/migracoes.js), uma vez.
-- Só acrescenta tabelas e colunas; nenhum dado existente é alterado.

ALTER TABLE PUBLICACAO ADD COLUMN editada_em DATETIME NULL;

CREATE TABLE IF NOT EXISTS PUBLICACAO_IMAGEM (
  id_imagem INT AUTO_INCREMENT PRIMARY KEY,
  id_publicacao INT NOT NULL,
  chave CHAR(32) NOT NULL,
  mime VARCHAR(20) NOT NULL,
  dados MEDIUMBLOB NOT NULL,
  largura SMALLINT UNSIGNED NULL,
  altura SMALLINT UNSIGNED NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_publicacao_imagem (id_publicacao),
  UNIQUE KEY uq_publicacao_imagem_chave (chave),
  CONSTRAINT fk_publicacao_imagem FOREIGN KEY (id_publicacao) REFERENCES PUBLICACAO (id_publicacao) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ICONE_PERFIL (
  id_icone INT AUTO_INCREMENT PRIMARY KEY,
  dono_tipo ENUM('usuaria', 'empresa') NOT NULL,
  dono_id INT NOT NULL,
  icone VARCHAR(40) NOT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_icone_perfil (dono_tipo, dono_id)
);

ALTER TABLE COMUNIDADE ADD COLUMN icone VARCHAR(40) NULL;

-- Cada par de candidatas tem uma conversa só: id_usuaria_a < id_usuaria_b.
CREATE TABLE IF NOT EXISTS CONVERSA_DIRETA (
  id_conversa_direta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuaria_a INT NOT NULL,
  id_usuaria_b INT NOT NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conversa_direta (id_usuaria_a, id_usuaria_b),
  KEY ix_conversa_direta_b (id_usuaria_b),
  CONSTRAINT fk_conversa_direta_a FOREIGN KEY (id_usuaria_a) REFERENCES CADASTRO_USUARIA (id_usuario),
  CONSTRAINT fk_conversa_direta_b FOREIGN KEY (id_usuaria_b) REFERENCES CADASTRO_USUARIA (id_usuario)
);

CREATE TABLE IF NOT EXISTS MENSAGEM_DIRETA (
  id_mensagem_direta INT AUTO_INCREMENT PRIMARY KEY,
  id_conversa_direta INT NOT NULL,
  id_autora INT NOT NULL,
  texto VARCHAR(1000) NOT NULL,
  enviada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lida_em DATETIME NULL,
  KEY ix_mensagem_direta (id_conversa_direta, enviada_em),
  CONSTRAINT fk_mensagem_direta_conversa FOREIGN KEY (id_conversa_direta) REFERENCES CONVERSA_DIRETA (id_conversa_direta),
  CONSTRAINT fk_mensagem_direta_autora FOREIGN KEY (id_autora) REFERENCES CADASTRO_USUARIA (id_usuario)
);
