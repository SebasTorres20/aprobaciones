-- init.sql: crear esquema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS users (
username TEXT PRIMARY KEY,
display_name TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS request_types (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL UNIQUE
);


CREATE TABLE IF NOT EXISTS requests (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
title TEXT NOT NULL,
description TEXT,
requester TEXT NOT NULL,
approver TEXT NOT NULL,
type_id INT,
status TEXT NOT NULL DEFAULT 'PENDIENTE',
created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
FOREIGN KEY (requester) REFERENCES users(username),
FOREIGN KEY (approver) REFERENCES users(username),
FOREIGN KEY (type_id) REFERENCES request_types(id)
);


CREATE TABLE IF NOT EXISTS history (
id SERIAL PRIMARY KEY,
request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
status TEXT NOT NULL,
changed_by TEXT NOT NULL,
comment TEXT,
changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);