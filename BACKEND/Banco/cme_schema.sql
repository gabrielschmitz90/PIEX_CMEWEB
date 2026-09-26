

CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    nome TEXT,
    perfil TEXT NOT NULL DEFAULT 'ADMIN' CHECK (perfil IN ('ADMIN', 'EDITOR')),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_evento TEXT NOT NULL,
    hora_inicio TEXT,
    hora_fim TEXT,
    categoria TEXT NOT NULL CHECK (categoria IN ('Estudo','Seminário','Seminarios','Palestra','Sociais','Reunião','Reuniao')),
    palestrante TEXT,
    local TEXT,
    link_participacao TEXT,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    responsavel TEXT,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1))
);

CREATE TABLE departamento_membros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    departamento_id INTEGER NOT NULL,
    equipe_id INTEGER,
    nome_membro TEXT,
    funcao TEXT,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (equipe_id) REFERENCES equipe(id) ON DELETE SET NULL
);

CREATE TABLE contatos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    assunto TEXT,
    mensagem TEXT NOT NULL,
    respondido INTEGER NOT NULL DEFAULT 0 CHECK (respondido IN (0,1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contatos_respondido ON contatos(respondido);

CREATE INDEX idx_eventos_categoria ON eventos(categoria);

CREATE INDEX idx_eventos_data ON eventos(data_evento);
