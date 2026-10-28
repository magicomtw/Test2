import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key belum diset di Vercel Environment Variables.' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        {
          text: `Baca foto tabel atau catatan inventaris pakaian ini. Ekstrak setiap baris barang menjadi data terstruktur. Kembalikan HANYA JSON array valid tanpa markdown atau penjelasan, dengan format persis: [{"name":"nama barang","color":"warna","size":"ukuran","qty":1}].
Aturan:
- name = nama barang; jika tidak terlihat, gunakan "Barang Scan".
- color = warna; jika tidak ada, gunakan "-".
- size = ukuran yang terlihat (S, M, L, XL, XXL, XXXL atau ukuran lain yang terbaca); jika tidak ada, gunakan "-".
- qty = jumlah sebagai angka; jika tidak jelas, gunakan 1.
- Abaikan judul, header kolom, total, dan catatan yang bukan baris barang. Jangan mengarang baris yang tidak terlihat.
- Jika foto berisi tabel dengan jumlah per ukuran pada kolom terpisah, buat satu objek untuk setiap kombinasi barang/warna/ukuran dan isi qty dengan angka yang sesuai.
- Jangan masukkan teks lain di luar JSON array.`
        }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    return res.status(200).json({
      candidates: [{
        content: {
          parts: [{ text: response.text }]
        }
      }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
