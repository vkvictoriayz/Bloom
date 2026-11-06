-- 001 — Área da empresa: status de candidatura, rascunho e campos de vaga,
-- campos novos do perfil da empresa.
-- Só acrescenta colunas e valores; nenhum dado é apagado.
-- Aplicada automaticamente pelo servidor (src/database/migracoes.js), uma vez.

-- Candidaturas: novas etapas "Recebida" e "Em entrevista".
-- 1) aceita os dois nomes durante a troca; 2) "Pendente" vira "Recebida";
-- 3) fica só com a lista nova.
ALTER TABLE CANDIDATURAS MODIFY status ENUM('Pendente','Recebida','Em análise','Em entrevista','Aprovada','Reprovada') NOT NULL DEFAULT 'Recebida';
UPDATE CANDIDATURAS SET status = 'Recebida' WHERE status = 'Pendente';
ALTER TABLE CANDIDATURAS MODIFY status ENUM('Recebida','Em análise','Em entrevista','Aprovada','Reprovada') NOT NULL DEFAULT 'Recebida';

-- Vagas: rascunho, nível, benefícios e faixa salarial (salario = mínimo).
ALTER TABLE VAGAS MODIFY status ENUM('Rascunho','Aberta','Pausada','Encerrada');
ALTER TABLE VAGAS MODIFY data_publicacao DATE NULL;
ALTER TABLE VAGAS ADD COLUMN nivel VARCHAR(30) NULL;
ALTER TABLE VAGAS ADD COLUMN beneficios VARCHAR(500) NULL;
ALTER TABLE VAGAS ADD COLUMN salario_max DECIMAL(10,2) NULL;

-- Perfil da empresa: área de atuação, LinkedIn, e-mail de contato e
-- informações adicionais.
ALTER TABLE PERFIL_EMPRESA ADD COLUMN area_atuacao VARCHAR(100) NULL;
ALTER TABLE PERFIL_EMPRESA ADD COLUMN linkedin VARCHAR(255) NULL;
ALTER TABLE PERFIL_EMPRESA ADD COLUMN email_contato VARCHAR(150) NULL;
ALTER TABLE PERFIL_EMPRESA ADD COLUMN informacoes VARCHAR(1000) NULL;
