declare module 'parse-database-url' {
  interface DatabaseConfig {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  
  function parseDbUrl(url: string): DatabaseConfig
  export = parseDbUrl
}