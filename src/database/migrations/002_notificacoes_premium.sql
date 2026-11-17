CREATE TABLE IF NOT EXISTS PREFERENCIA_NOTIFICACAO (
  id_preferencia INT AUTO_INCREMENT PRIMARY KEY,
  tipo_conta ENUM('usuaria','empresa') NOT NULL,
  id_conta INT NOT NULL,
  vagas_compativeis BOOLEAN NOT NULL DEFAULT TRUE,
  candidaturas BOOLEAN NOT NULL DEFAULT TRUE,
  mensagens BOOLEAN NOT NULL DEFAULT TRUE,
  convites BOOLEAN NOT NULL DEFAULT TRUE,
  comunidade BOOLEAN NOT NULL DEFAULT TRUE,
  plataforma BOOLEAN NOT NULL DEFAULT TRUE,
  atualizada_em DATETIME NULL,
  UNIQUE KEY UK_PREFERENCIA_CONTA (tipo_conta, id_conta)
);

CREATE TABLE IF NOT EXISTS CONVITE (
  id_convite INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  id_usuario INT NOT NULL,
  id_vaga INT NOT NULL,
  mensagem VARCHAR(500) NULL,
  criado_em DATETIME NOT NULL,
  UNIQUE KEY UK_CONVITE (id_vaga, id_usuario),
  CONSTRAINT FK_CONVITE_EMPRESA FOREIGN KEY (id_empresa) REFERENCES CADASTRO_EMPRESA(id_empresa),
  CONSTRAINT FK_CONVITE_USUARIO FOREIGN KEY (id_usuario) REFERENCES CADASTRO_USUARIA(id_usuario),
  CONSTRAINT FK_CONVITE_VAGA FOREIGN KEY (id_vaga) REFERENCES VAGAS(id_vaga)
);

CREATE TABLE IF NOT EXISTS PLANO (
  id_plano INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nome VARCHAR(80) NOT NULL,
  publico ENUM('usuaria','empresa') NOT NULL,
  tipo ENUM('assinatura','avulso') NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  rotulo_preco VARCHAR(30) NOT NULL,
  beneficios JSON NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ASSINATURA (
  id_assinatura INT AUTO_INCREMENT PRIMARY KEY,
  tipo_conta ENUM('usuaria','empresa') NOT NULL,
  id_conta INT NOT NULL,
  id_plano INT NOT NULL,
  status ENUM('pendente','ativa','pausada','cancelada','falhou') NOT NULL DEFAULT 'pendente',
  provedor VARCHAR(20) NOT NULL,
  id_externo VARCHAR(80) NULL UNIQUE,
  proximo_pagamento DATETIME NULL,
  criada_em DATETIME NOT NULL,
  atualizada_em DATETIME NOT NULL,
  cancelada_em DATETIME NULL,
  KEY IX_ASSINATURA_CONTA (tipo_conta, id_conta),
  CONSTRAINT FK_ASSINATURA_PLANO FOREIGN KEY (id_plano) REFERENCES PLANO(id_plano)
);

CREATE TABLE IF NOT EXISTS CAMPANHA (
  id_campanha INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  id_plano INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  texto VARCHAR(300) NOT NULL,
  link VARCHAR(255) NULL,
  status ENUM('aguardando_pagamento','paga','cancelada') NOT NULL DEFAULT 'aguardando_pagamento',
  criada_em DATETIME NOT NULL,
  paga_em DATETIME NULL,
  KEY IX_CAMPANHA_EMPRESA (id_empresa),
  CONSTRAINT FK_CAMPANHA_EMPRESA FOREIGN KEY (id_empresa) REFERENCES CADASTRO_EMPRESA(id_empresa),
  CONSTRAINT FK_CAMPANHA_PLANO FOREIGN KEY (id_plano) REFERENCES PLANO(id_plano)
);

CREATE TABLE IF NOT EXISTS PAGAMENTO (
  id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
  tipo_conta ENUM('usuaria','empresa') NOT NULL,
  id_conta INT NOT NULL,
  id_plano INT NOT NULL,
  id_assinatura INT NULL,
  id_campanha INT NULL,
  provedor VARCHAR(20) NOT NULL,
  id_externo VARCHAR(80) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  moeda CHAR(3) NOT NULL DEFAULT 'BRL',
  pago_em DATETIME NULL,
  registrado_em DATETIME NOT NULL,
  KEY IX_PAGAMENTO_CONTA (tipo_conta, id_conta),
  CONSTRAINT FK_PAGAMENTO_PLANO FOREIGN KEY (id_plano) REFERENCES PLANO(id_plano),
  CONSTRAINT FK_PAGAMENTO_ASSINATURA FOREIGN KEY (id_assinatura) REFERENCES ASSINATURA(id_assinatura),
  CONSTRAINT FK_PAGAMENTO_CAMPANHA FOREIGN KEY (id_campanha) REFERENCES CAMPANHA(id_campanha)
);

INSERT IGNORE INTO PLANO (codigo, nome, publico, tipo, preco, rotulo_preco, beneficios, ativo) VALUES
('premium_empresa', 'Plano Premium', 'empresa', 'assinatura', 99.90, '/mês',
 JSON_ARRAY('Maior destaque na plataforma', 'Mais visibilidade para oportunidades', 'Perfil ampliado para sua empresa', 'Suporte prioritário'), TRUE),
('premium_candidata', 'Plano Premium', 'usuaria', 'assinatura', 99.90, '/mês',
 JSON_ARRAY('Maior destaque na plataforma', 'Mais visibilidade para oportunidades', 'Suporte prioritário'), TRUE),
('publicidade', 'Publicidade', 'empresa', 'avulso', 150.00, 'por campanha',
 JSON_ARRAY('Campanhas publicitárias na plataforma', 'Divulgação para o público da Bloom', 'Mais alcance para sua empresa', 'Divulgue sua marca, produtos ou serviços'), TRUE);
