// "320 KB", "1,4 MB" — tamanho de arquivo para mostrar na tela.
export const tamanhoLegivel = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
