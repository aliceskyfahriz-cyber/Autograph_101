// Util autentikasi PROTOTYPE (frontend-only, data di localStorage).
// PERINGATAN: hash di sini hash demo ringan untuk kebutuhan Capstone/prototype,
// BUKAN kriptografi aman. Untuk produksi wajib backend (server + bcrypt/JWT),
// seperti versi FINAL_SYSTEM (Level 2) yang memakai server.js + database.
export function hashPassword(password) {
  const s = 'tpm-salt::' + String(password ?? '')
  let h1 = 0x811c9dc5
  let h2 = 5381
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i) + round
      h1 = Math.imul(h1 ^ c, 0x01000193)
      h2 = Math.imul(h2, 33) ^ c
    }
  }
  return 'h' + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)
}
