export function detectarClientes(texto: string): boolean {
  return /(clientes?|deuda|cuentas corrientes|morosos|ranking de clientes|contactos comerciales)/.test(texto);
}
