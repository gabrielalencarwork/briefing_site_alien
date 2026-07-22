// Serverless function da Vercel — roda no servidor, não no navegador do cliente.
// Por isso não sofre bloqueio de CORS ao chamar a API da InfinitePay.
// Acessível pelo site em: /api/create-payment-link

// Troque pela sua InfiniteTag (sem o símbolo $).
const INFINITEPAY_HANDLE = process.env.INFINITEPAY_HANDLE || 'gabriel-alencar88';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const { price, description } = req.body || {};
    const priceCents = Number(price);

    if (!priceCents || priceCents <= 0) {
      res.status(400).json({ error: 'Valor inválido' });
      return;
    }

    const infiniteRes = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: INFINITEPAY_HANDLE,
        redirect_url: req.headers.origin || 'https://alienmkt.com.br',
        order_nsu: 'briefing-' + Date.now(),
        items: [
          {
            quantity: 1,
            price: priceCents,
            description: description || 'Projeto Alien Marketing Inteligente',
          },
        ],
      }),
    });

    const data = await infiniteRes.json();

    if (!infiniteRes.ok || !data.url) {
      res.status(502).json({ error: 'A InfinitePay recusou a requisição', detail: data });
      return;
    }

    res.status(200).json({ url: data.url });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao gerar o link', detail: String(err) });
  }
}
