/** `interrupted` kent alleen iOS (na de achtergrond of een telefoontje); ook die komt pas terug met `resume()`. */
export function moetHervatten(status: string): boolean {
  return status === 'suspended' || status === 'interrupted'
}
