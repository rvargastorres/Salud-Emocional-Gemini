const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Configuración de la Base de Datos (SQLite) ---
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    // Crear tablas si no existen
    db.serialize(() => {
        // Tabla de usuarios (simplificada para el MVP)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT
        )`, (err) => {
            if (err) console.error("Error creando tabla users:", err);
            // Insertar un usuario de prueba si no existe
            db.get("SELECT * FROM users WHERE id = 1", (err, row) => {
                if (!row) {
                    db.run("INSERT INTO users (id) VALUES (1)");
                }
            });
        });

        // Tabla de entradas del diario
        db.run(`CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            emotion_score INTEGER NOT NULL,
            thoughts_text TEXT,
            entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);
    });
  }
});


// --- Rutas de la API ---

// [POST] /api/entries - Crear una nueva entrada en el diario
app.post('/api/entries', (req, res) => {
  const { emotion_score, thoughts_text } = req.body;
  // Para el MVP, usamos un user_id predefinido.
  const user_id = 1; 

  if (!emotion_score) {
    return res.status(400).json({ error: 'El campo emotion_score es requerido.' });
  }

  const sql = `INSERT INTO entries (user_id, emotion_score, thoughts_text) VALUES (?, ?, ?)`;
  db.run(sql, [user_id, emotion_score, thoughts_text], function(err) {
    if (err) {
      console.error('Error al insertar en la base de datos:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
    res.status(201).json({ id: this.lastID, message: 'Entrada guardada correctamente.' });
  });
});

// [GET] /api/entries - Obtener todas las entradas del diario
app.get('/api/entries', (req, res) => {
    // Para el MVP, obtenemos las entradas del user_id predefinido.
    const user_id = 1;
    const sql = `SELECT id, emotion_score, thoughts_text, entry_date FROM entries WHERE user_id = ? ORDER BY entry_date DESC`;

    db.all(sql, [user_id], (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
