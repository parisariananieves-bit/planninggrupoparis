// Redimensiona y comprime una imagen en el navegador antes de mandarla al
// backend, para que el POST no se vaya de tamaño con fotos de celular
// (que suelen pesar 3-8 MB). Devuelve el base64 SIN el prefijo "data:...".
export function comprimirImagen(file: File, maxAncho = 1200, calidad = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'))
      img.onload = () => {
        const escala = Math.min(1, maxAncho / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * escala
        canvas.height = img.height * escala

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/jpeg', calidad)
        resolve(dataUrl.split(',')[1])
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
