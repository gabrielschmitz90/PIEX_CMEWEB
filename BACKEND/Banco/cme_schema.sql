PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    nome TEXT,
    perfil TEXT NOT NULL DEFAULT 'ADMIN' CHECK (perfil IN ('ADMIN', 'EDITOR')),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela que faltava: departamento_membros referenciava equipe(id), mas ela não existia.
CREATE TABLE IF NOT EXISTS equipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    descricao TEXT,
    foto TEXT,  -- nome do arquivo da foto em uploads/ (veja POST /api/equipe/{id}/foto)
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1))
);

CREATE TABLE IF NOT EXISTS eventos (
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

CREATE TABLE IF NOT EXISTS departamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    responsavel TEXT,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1))
);

CREATE TABLE IF NOT EXISTS departamento_membros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    departamento_id INTEGER NOT NULL,
    equipe_id INTEGER,
    nome_membro TEXT,
    funcao TEXT,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (equipe_id) REFERENCES equipe(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS biblioteca_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    resumo TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('Artigo','Estudo','Publicacao')),
    autor TEXT,
    data_publicacao TEXT NOT NULL,
    link TEXT,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON eventos(categoria);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data_evento);
CREATE INDEX IF NOT EXISTS idx_biblioteca_tipo ON biblioteca_itens(tipo);
CREATE INDEX IF NOT EXISTS idx_biblioteca_data ON biblioteca_itens(data_publicacao);
