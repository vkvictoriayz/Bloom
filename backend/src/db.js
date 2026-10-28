import mysql from "mysql2/promise";

export function criarDb(config) {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  return {
    // SELECT -> array de linhas | INSERT/UPDATE -> { insertId, affectedRows... }
    async query(sql, params = []) {
      const [resultado] = await pool.execute(sql, params);
      return resultado;
    },

    // Executa várias queries; se qualquer uma falhar, desfaz todas (rollback).
    async transacao(callback) {
      const conexao = await pool.getConnection();
      try {
        await conexao.beginTransaction();
        const tx = {
          async query(sql, params = []) {
            const [resultado] = await conexao.execute(sql, params);
            return resultado;
          },
        };
        const retorno = await callback(tx);
        await conexao.commit();
        return retorno;
      } catch (erro) {
        await conexao.rollback();
        throw erro;
      } finally {
        conexao.release();
      }
    },

    encerrar: () => pool.end(),
  };
}
