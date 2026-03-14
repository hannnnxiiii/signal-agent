import mysql from "mysql2/promise";

export function createBlogConnection(databaseUrl: string) {
  return mysql.createConnection(databaseUrl);
}
