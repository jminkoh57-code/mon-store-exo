import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "db",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "todos",
  password: process.env.DB_PASSWORD ?? "todos",
  database: process.env.DB_NAME ?? "todos",
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      text VARCHAR(255) NOT NULL,
      done TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_todos_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    );
  `;

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const connection = await pool.getConnection();

      try {
        for (const statement of schema.split(";").map((sql) => sql.trim()).filter(Boolean)) {
          await connection.query(statement);
        }
      } finally {
        connection.release();
      }

      return;
    } catch (error) {
      if (attempt === 30) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export { pool, initDb };
