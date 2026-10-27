CREATE DATABASE BLOOM;
USE BLOOM;



CREATE TABLE CADASTRO_USUARIA (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL
);


CREATE TABLE PERFIL_USUARIA (
    id_perfil_usuaria INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    foto VARCHAR(255),
    descricao VARCHAR(500),
    localizacao VARCHAR(150),
    curriculo VARCHAR(255),

    CONSTRAINT FK_PERFIL_USUARIA_USUARIO
        FOREIGN KEY (id_usuario)
        REFERENCES CADASTRO_USUARIA(id_usuario)
    ON DELETE CASCADE
);


CREATE TABLE EXPERIENCIA (
    id_experiencia INT AUTO_INCREMENT PRIMARY KEY,
    id_perfil_usuaria INT NOT NULL,
    nome_empresa VARCHAR(100),
    cargo VARCHAR(100),
    descricao VARCHAR(250),
    data_inicio DATE,
    data_fim DATE,

    CONSTRAINT FK_EXPERIENCIA_PERFIL
        FOREIGN KEY (id_perfil_usuaria)
        REFERENCES PERFIL_USUARIA(id_perfil_usuaria)
    ON DELETE CASCADE
);


CREATE TABLE FORMACAO (
    id_formacao INT AUTO_INCREMENT PRIMARY KEY,
    id_perfil_usuaria INT NOT NULL,
    instituicao VARCHAR(150) NOT NULL,
    curso VARCHAR(150) NOT NULL,
    nivel VARCHAR(50),
    data_inicio DATE,
    data_conclusao DATE,

    CONSTRAINT FK_FORMACAO_PERFIL
        FOREIGN KEY (id_perfil_usuaria)
        REFERENCES PERFIL_USUARIA(id_perfil_usuaria)
    ON DELETE CASCADE
);


CREATE TABLE HABILIDADE (
    id_habilidade INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);


CREATE TABLE PERFIL_HABILIDADE (
    id_perfil_usuaria INT NOT NULL,
    id_habilidade INT NOT NULL,

    PRIMARY KEY (id_perfil_usuaria, id_habilidade),

    CONSTRAINT FK_PERFIL_HABILIDADE_PERFIL
        FOREIGN KEY (id_perfil_usuaria)
        REFERENCES PERFIL_USUARIA(id_perfil_usuaria)
    ON DELETE CASCADE,

    CONSTRAINT FK_PERFIL_HABILIDADE_HABILIDADE
        FOREIGN KEY (id_habilidade)
        REFERENCES HABILIDADE(id_habilidade)
    ON DELETE CASCADE
);



CREATE TABLE CADASTRO_EMPRESA (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL
);


CREATE TABLE PERFIL_EMPRESA (
    id_perfil_empresa INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL UNIQUE,
    logo VARCHAR(255),
    descricao VARCHAR(500),
    localizacao VARCHAR(150),
    site VARCHAR(255),

    CONSTRAINT FK_PERFIL_EMPRESA_EMPRESA
        FOREIGN KEY (id_empresa)
        REFERENCES CADASTRO_EMPRESA(id_empresa)
    ON DELETE CASCADE
);


CREATE TABLE VAGAS (
    id_vaga INT AUTO_INCREMENT PRIMARY KEY,
    id_perfil_empresa INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    requisitos VARCHAR(500),
    area VARCHAR(100),
    localizacao VARCHAR(150),
    modalidade VARCHAR(50),
    tipo_contrato VARCHAR(50),
    salario DECIMAL(10,2),
    data_publicacao DATE,
    status ENUM('Aberta','Pausada','Encerrada'),

    CONSTRAINT FK_VAGAS_PERFIL_EMPRESA
        FOREIGN KEY (id_perfil_empresa)
        REFERENCES PERFIL_EMPRESA(id_perfil_empresa)
    ON DELETE RESTRICT
);


CREATE TABLE CANDIDATURAS (
    id_candidatura INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_vaga INT NOT NULL,
    data_candidatura DATE,
    status ENUM('Pendente','Em análise','Aprovada','Reprovada')
    NOT NULL DEFAULT 'Pendente',

    CONSTRAINT FK_CANDIDATURA_USUARIO
        FOREIGN KEY (id_usuario)
        REFERENCES CADASTRO_USUARIA(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT FK_CANDIDATURA_VAGA
        FOREIGN KEY (id_vaga)
        REFERENCES VAGAS(id_vaga),

    CONSTRAINT UK_CANDIDATURA_USUARIO_VAGA
        UNIQUE (id_usuario, id_vaga)
   
);


CREATE TABLE FAVORITOS (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_vaga INT NOT NULL,
    data_favorito DATE,

    CONSTRAINT FK_FAVORITO_USUARIO
        FOREIGN KEY (id_usuario)
        REFERENCES CADASTRO_USUARIA(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT FK_FAVORITO_VAGA
        FOREIGN KEY (id_vaga)
        REFERENCES VAGAS(id_vaga),

    CONSTRAINT UK_FAVORITO_USUARIO_VAGA
        UNIQUE (id_usuario, id_vaga)
   
);


CREATE TABLE CONFIG_USUARIA (
    id_config_usu INT AUTO_INCREMENT PRIMARY KEY,
    id_usuaria INT NOT NULL UNIQUE,
    perfil_publico BOOLEAN,
    receber_notif_email BOOLEAN,
    mostrar_experiencia BOOLEAN,
    mostrar_contato BOOLEAN,
    idioma_preferido VARCHAR(50),
    modo_noturno BOOLEAN,

    CONSTRAINT FK_CONFIG_USUARIA
        FOREIGN KEY (id_usuaria)
        REFERENCES CADASTRO_USUARIA(id_usuario)
    ON DELETE CASCADE
);



CREATE TABLE CONFIG_EMPRESA (
    id_config_empresa INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL UNIQUE,
    perfil_publico BOOLEAN,
    receber_notif_email BOOLEAN,
    mostrar_vagas BOOLEAN,
    mostrar_contato BOOLEAN,
    idioma_preferido VARCHAR(50),
    modo_noturno BOOLEAN,

    CONSTRAINT FK_CONFIG_EMPRESA
        FOREIGN KEY (id_empresa)
        REFERENCES CADASTRO_EMPRESA(id_empresa)
    ON DELETE CASCADE
);



CREATE TABLE ADMINS (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nome_usuario VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nivel_acesso VARCHAR(50),
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE LOGS_ADMIN (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_admin INT NOT NULL,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    registro_id INT,
    data_acao DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_LOGS_ADMIN_ADMIN
        FOREIGN KEY (id_admin)
        REFERENCES ADMINS(id_admin)
);


CREATE TABLE DASHBOARD_ADMIN (
    id_dashboard INT AUTO_INCREMENT PRIMARY KEY,
    data_referencia DATE NOT NULL UNIQUE,
    total_usuarios INT DEFAULT 0,
    total_empresas INT DEFAULT 0,
    total_vagas INT DEFAULT 0,
    total_candidaturas INT DEFAULT 0,
    novos_usuarios_dia INT DEFAULT 0,
    novas_empresas_dia INT DEFAULT 0,
    novas_vagas_dia INT DEFAULT 0,
    novas_candidaturas_dia INT DEFAULT 0,
    atualizacao_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
