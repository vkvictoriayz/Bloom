-- Dados de identificação da candidata, separados do cadastro principal.
-- Só a própria candidata lê/edita por /api/candidata/identificacao; empresas nunca recebem estes campos.
-- nome_civil: nome do documento (usado para identificação); nome_social: priorizado na exibição.
-- identidade_genero: dado sensível (LGPD, art. 5º, II). Não aparece no perfil, para empresas nem no painel.
CREATE TABLE IF NOT EXISTS USUARIA_IDENTIFICACAO (
  id_usuario INT PRIMARY KEY,
  nome_civil VARCHAR(100) NOT NULL,
  nome_social VARCHAR(100) NULL,
  identidade_genero ENUM('mulher_cis', 'mulher_trans', 'nao_informar') NOT NULL DEFAULT 'nao_informar',
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_identificacao_usuaria FOREIGN KEY (id_usuario) REFERENCES CADASTRO_USUARIA (id_usuario) ON DELETE CASCADE
);

-- Registro de cada aceite/ciência no cadastro (e de opt-in de comunicações, que é separado e opcional).
CREATE TABLE IF NOT EXISTS CONSENTIMENTO (
  id_consentimento INT AUTO_INCREMENT PRIMARY KEY,
  tipo_conta ENUM('usuaria', 'empresa') NOT NULL,
  id_conta INT NOT NULL,
  tipo ENUM('termos_privacidade', 'ciencia_tratamento', 'comunicacoes') NOT NULL,
  versao VARCHAR(20) NOT NULL,
  aceito TINYINT(1) NOT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_consentimento_conta (tipo_conta, id_conta)
);
