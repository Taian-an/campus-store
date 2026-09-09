const express = require('express');
const prisma = require('../lib/prisma');
const { verifyJwt, requireRole } = require('../middleware/auth');
const { verifyDepartmentEnrollment } = require('../services/peerClient');

const router = express.Router();

router.use(verifyJwt);

// Any authenticated user places an order for themselves.
router.post('/', async (req, res) => {
  try {
    const { items, discountCode } = req.body; // items: [{ productId, quantity }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items is required' });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => parseInt(i.productId)) } },
    });
    const priceById = new Map(products.map((p) => [p.id, Number(p.basePrice)]));

    let totalAmount = 0;
    const orderItemsData = items.map((i) => {
      const productId = parseInt(i.productId);
      const unitPrice = priceById.get(productId);
      if (unitPrice === undefined) throw new Error(`Unknown productId ${productId}`);
      totalAmount += unitPrice * i.quantity;
      return { productId, quantity: i.quantity, unitPrice };
    });

    // Discount requires live verification against the partner enrollment API;
    // fail-closed per proposal §9.2 — any partner failure just skips it.
    let discountApplied = false;
    if (discountCode) {
      const eligible = await verifyDepartmentEnrollment({
        studentId: req.user.id,
        department: req.user.department,
      });
      if (eligible) {
        totalAmount *= 0.9;
        discountApplied = true;
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount,
        discountApplied,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message || 'Order creation failed' });
  }
});

router.get('/mine', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// STAFF/ADMIN can see every order, not just their own.
router.get('/', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, user: { select: { id: true, email: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
