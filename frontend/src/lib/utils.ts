export function formatCurrency(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} menit`;
}
