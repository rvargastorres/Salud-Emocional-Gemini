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
