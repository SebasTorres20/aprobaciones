INSERT INTO users (username, display_name) VALUES
('j.rod', 'Juan Rodriguez'),
('m.gomez', 'Maria Gomez'),
('a.salazar', 'Ana Salazar')
ON CONFLICT (username) DO NOTHING;

INSERT INTO request_types (name) VALUES
('Despliegue'),
('Acceso'),
('Cambio técnico')
ON CONFLICT (name) DO NOTHING;

INSERT INTO requests (title, description, requester, approver, type_id, status)
VALUES ('Publicar microservicio v1.2', 'Desplegar versión 1.2 en entorno staging', 'j.rod', 'm.gomez', 1, 'PENDIENTE')
ON CONFLICT DO NOTHING;