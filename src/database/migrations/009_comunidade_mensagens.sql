-- 009: comunidades e mensagens com mais recursos de rede social
--  * capa (imagem de topo) das comunidades, guardada no banco como as fotos;
--  * regras da comunidade, escritas por quem criou;
--  * mensagens entre candidatas podem ser apagadas por quem enviou (o texto
--    sai do banco; fica só o aviso "mensagem apagada").
-- Aplicada automaticamente pelo servidor (src/database/migracoes.js), uma vez.

ALTER TABLE COMUNIDADE ADD COLUMN regras VARCHAR(1000) NULL;

CREATE TABLE IF NOT EXISTS COMUNIDADE_CAPA (
  id_comunidade INT PRIMARY KEY,
  chave CHAR(32) NOT NULL UNIQUE,
  mime VARCHAR(20) NOT NULL,
  dados MEDIUMBLOB NOT NULL,
  atualizada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunidade_capa FOREIGN KEY (id_comunidade) REFERENCES COMUNIDADE (id_comunidade)
);

ALTER TABLE MENSAGEM_DIRETA ADD COLUMN apagada_em DATETIME NULL;
