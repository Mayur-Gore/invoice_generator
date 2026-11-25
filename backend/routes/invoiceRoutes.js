const express = require('express');
const router = express.Router();
const dbOperations = require('../db/operations');

/**
 * Normalize invoice number param across single-segment (%2F) and multi-segment (/) paths.
 */
function resolveInvNo(param) {
  if (Array.isArray(param)) return decodeURIComponent(param.join('/'));
  return decodeURIComponent(String(param || ''));
}

/**
 * GET /api/invoices
 * List all invoices / quotations with optional search & filtering
 */
router.get('/', async (req, res) => {
  try {
    const { docType, search, limit, skip } = req.query;
    const invoices = await dbOperations.getAllInvoices({ docType, search, limit, skip });
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/invoices/next-no
 * Get next sequential invoice / quotation number
 */
router.get('/next-no', async (req, res) => {
  try {
    const docType = req.query.docType || 'invoice';
    const nextNo = await dbOperations.getNextInvoiceNumber(docType);
    res.json({ success: true, nextNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/invoices/stats
 * Aggregate dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await dbOperations.getInvoiceStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/invoices/:invNo (also handles unencoded slashes like 001/2026-27)
 * Get single invoice by invoice number
 */
router.get('/*invNo', async (req, res) => {
  try {
    const invNo = resolveInvNo(req.params.invNo);
    const invoice = await dbOperations.getInvoiceByNo(invNo);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/invoices
 * Create or update an invoice in MongoDB
 */
router.post('/', async (req, res) => {
  try {
    const saved = await dbOperations.saveInvoice(req.body);
    res.status(200).json({
      success: true,
      message: `Invoice ${saved.invNo} successfully saved to MongoDB.`,
      data: saved
    });
  } catch (error) {
    console.error('Error saving invoice:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/invoices/:invNo (also handles unencoded slashes like 001/2026-27)
 * Delete invoice by invoice number
 */
router.delete('/*invNo', async (req, res) => {
  try {
    const invNo = resolveInvNo(req.params.invNo);
    const deleted = await dbOperations.deleteInvoiceByNo(invNo);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    res.json({
      success: true,
      message: `Invoice ${invNo} deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
