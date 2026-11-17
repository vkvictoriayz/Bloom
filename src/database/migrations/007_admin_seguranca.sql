-- 007: segurança da equipe e comunicados
--  * verificação em duas etapas (código de 6 dígitos de um app autenticador)
--    para administradores, com códigos de recuperação;
--  * troca de senha obrigatória no primeiro acesso de quem foi criado no painel;
--  * comunicados da equipe para candidatas e empresas.
-- Aplicada automaticamente pelo servidor (src/database/migracoes.js), uma vez.
-- Só acrescenta colunas e uma tabela; nenhum dado existente é alterado.

ALTER TABLE ADMINS ADD COLUMN totp_segredo VARCHAR(200) NULL;
ALTER TABLE ADMINS ADD COLUMN totp_ativo TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE ADMINS ADD COLUMN totp_ultimo_passo BIGINT NULL;
ALTER TABLE ADMINS ADD COLUMN codigos_recuperacao TEXT NULL;
ALTER TABLE ADMINS ADD COLUMN deve_trocar_senha TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS COMUNICADO (
  id_comunicado INT AUTO_INCREMENT PRIMARY KEY,
  id_admin INT NOT NULL,
  publico ENUM('todos', 'usuarias', 'empresas') NOT NULL,
  texto VARCHAR(300) NOT NULL,
  link VARCHAR(200) NULL,
  enviados INT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunicado_admin FOREIGN KEY (id_admin) REFERENCES ADMINS (id_admin)
);
