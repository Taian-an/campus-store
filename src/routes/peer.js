const express = require('express');
const crypto = require('crypto');
const prisma = require('../lib/prisma');

const router = express.Router();

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function verifyPeerApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'Missing x-api-key' });

  const record = await prisma.peerApiKeyIssued.findFirst({
    where: { keyHash: hashKey(key), isActive: true },
  });
  if (!record) return res.status(403).json({ error: 'Invalid or inactive API key' });

  req.partnerName = record.partnerName;
  next();
}

// Expose: lets a partner system place a bulk merchandise pre-order tied to
// their event, without going through student checkout (proposal §9.1).
router.post('/preorders', verifyPeerApiKey, async (req, res) => {
  try {
    const { partnerRef, items, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items is required' });
    }

    const skus = items.map((i) => parseInt(i.sku));
    const products = await prisma.product.findMany({ where: { id: { in: skus } } });
    const priceById = new Map(products.map((p) => [p.id, Number(p.basePrice)]));

    let estimatedTotal = 0;
    for (const item of items) {
      const price = priceById.get(parseInt(item.sku));
      if (price === undefined) return res.status(400).json({ error: `Unknown sku ${item.sku}` });
      estimatedTotal += price * item.quantity;
    }

    console.log(`Peer pre-order from ${req.partnerName}: ref=${partnerRef} notes=${notes || ''}`);

    res.status(202).json({
      orderId: `preorder-${partnerRef}-${Date.now()}`,
      status: 'PENDING',
      estimatedTotal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Pre-order processing failed' });
  }
});

module.exports = router;
