-- 010: verificação de quem representa a empresa
--  * como o vínculo foi confirmado: "dominio" (e-mail da conta no mesmo
--    domínio do site da empresa, confirmado pelo link) ou "equipe" (a equipe
--    da Bloom conferiu por um canal oficial, no painel);
--  * quando foi confirmado.
-- Aplicada automaticamente pelo servidor (src/database/migracoes.js), uma vez.

ALTER TABLE EMPRESA_DADOS_CADASTRAIS ADD COLUMN representante_metodo VARCHAR(20) NULL;
ALTER TABLE EMPRESA_DADOS_CADASTRAIS ADD COLUMN representante_verificado_em DATETIME NULL;
