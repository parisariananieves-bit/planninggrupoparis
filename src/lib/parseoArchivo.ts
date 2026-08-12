export function normalizarEncabezado(h: string) {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Lee un .xlsx/.xls/.csv y devuelve las filas como objetos { columna: valor },
// usando el primer renglón como encabezados. La librería de Excel se carga
// recién cuando hace falta (import dinámico), para no inflar el bundle inicial.
export function leerFilasDeArchivo(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = async () => {
      try {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(reader.result, { type: 'binary' })
        const hoja = wb.Sheets[wb.SheetNames[0]]
        const filas: Record<string, unknown>[] = XLSX.utils.sheet_to_json(hoja, { defval: '' })
        resolve(filas)
      } catch {
        reject(new Error('No pude leer ese archivo. Probá exportarlo como .xlsx o .csv de nuevo.'))
      }
    }
    reader.readAsBinaryString(file)
  })
}
