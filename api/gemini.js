export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType } = req.body;
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key Groq belum diset di Vercel Environment Variables.' });
    }

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview', // Diperbarui ke model vision aktif
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              },
              {
                type: 'text',
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
            ]
          }
        ],
        temperature: 0.1
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error?.message || `Gagal dari Groq API: ${response.status}`);
    }

    const textContent = result.choices[0].message.content;

    return res.status(200).json({
      candidates: [{
        content: {
          parts: [{ text: textContent }]
        }
      }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
