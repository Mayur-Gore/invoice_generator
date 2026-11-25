const mongoose = require('mongoose');
const User = require('../models/User');
const Invoice = require('../models/Invoice');

/**
 * Single Database Operations Module
 * All database operations (Authentication, Users, Invoices/Quotations) are handled here.
 */

// Helper to check if mongoose is connected
const isConnected = () => mongoose.connection.readyState === 1;

// ==========================================
// USER & AUTHENTICATION OPERATIONS
// ==========================================

/**
 * Authenticate user credentials without encryption as requested:
 * ("dont add any incepretion we'll add the id and pass by our self into the database directly")
 * Checks both username/id and password/pass in plain text.
 */
async function authenticateUser(usernameOrId, password) {
  if (!isConnected()) {
    // If DB is offline / not connected, provide fallback / guidance
    console.warn('[DB Operations] Database not connected. Authentication cannot query MongoDB.');
    throw new Error('Database is not connected. Please ensure MongoDB credentials in .env are configured.');
  }

  const query = {
    $or: [
      { username: String(usernameOrId).trim() },
      { id: String(usernameOrId).trim() }
    ]
  };

  const user = await User.findOne(query);
  if (!user) {
    return null;
  }

  // Check plain text password or pass
  const storedPassword = user.password || user.pass;
  if (storedPassword === String(password)) {
    return {
      _id: user._id,
      username: user.username || user.id,
      name: user.name || 'Administrator',
      role: user.role || 'admin'
    };
  }

  return null;
}

/**
 * Create a new user with plain text credentials
 */
async function createUser(userData) {
  if (!isConnected()) {
    throw new Error('Database not connected.');
  }

  const user = new User({
    username: userData.username || userData.id,
    id: userData.id || userData.username,
    password: userData.password || userData.pass,
    pass: userData.pass || userData.password,
    name: userData.name || 'Administrator',
    role: userData.role || 'admin'
  });

  return await user.save();
}

/**
 * Find user by username or ID
 */
async function findUser(usernameOrId) {
  if (!isConnected()) return null;
  return await User.findOne({
    $or: [
      { username: String(usernameOrId).trim() },
      { id: String(usernameOrId).trim() }
    ]
  }).select('-password -pass');
}

/**
 * List all users (without passwords)
 */
async function getAllUsers() {
  if (!isConnected()) return [];
  return await User.find({}).select('-password -pass').sort({ createdAt: -1 });
}

// ==========================================
// INVOICE & BILL OPERATIONS
// ==========================================

/**
 * Save or update an invoice/quotation by invoice number (invNo)
 */
async function saveInvoice(data) {
  if (!isConnected()) {
    throw new Error('Database is not connected. Please verify MongoDB credentials in .env.');
  }

  const invNo = String(data.invNo || '').trim();
  if (!invNo) {
    throw new Error('Invoice / Quotation Number is required.');
  }

  // Transform incoming payload to match Invoice schema structure
  const updatePayload = {
    docType: data.docType || 'invoice',
    invNo: invNo,
    company: {
      name: data.coName || 'Techwave Enterprises',
      address: data.coAddress || '',
      phone: data.coPhone || '',
      email: data.coEmail || '',
      gstin: data.coGstin || '',
      state: data.coState || 'Maharashtra',
      stateCode: data.coStateCode || '27',
      bank: data.bank || ''
    },
    transport: data.transport || '',
    poNo: data.poNo || '',
    poDate: data.poDate || '',
    supplyDate: data.supplyDate || '',
    supplyTime: data.supplyTime || '',
    vehicle: data.vehicle || '',
    placeOfSupply: data.placeOfSupply || '',
    gstOpt: data.gstOpt || 'with',
    preparedBy: data.preparedBy || '',
    dueDate: data.dueDate || '',
    payStatus: data.payStatus || '',

    receiver: {
      name: data.bName || (data.receiver && data.receiver.name) || '',
      address: data.bAddress || (data.receiver && data.receiver.address) || '',
      state: data.bState || (data.receiver && data.receiver.state) || 'Maharashtra',
      stateCode: data.bStateCode || (data.receiver && data.receiver.stateCode) || '27',
      gstin: data.bGstin || (data.receiver && data.receiver.gstin) || ''
    },

    consignee: {
      same: data.same !== undefined ? data.same : true,
      name: data.cName || (data.consignee && data.consignee.name) || '',
      address: data.cAddress || (data.consignee && data.consignee.address) || '',
      state: data.cState || (data.consignee && data.consignee.state) || '',
      stateCode: data.cStateCode || (data.consignee && data.consignee.stateCode) || '',
      gstin: data.cGstin || (data.consignee && data.consignee.gstin) || ''
    },

    items: Array.isArray(data.items) ? data.items.map(it => ({
      name: it.name || '',
      desc: it.desc || '',
      hsn: it.hsn || '',
      qty: Number(it.qty) || 1,
      unit: it.unit || 'Nos.',
      rate: Number(it.rate) || 0,
      disc: Number(it.disc) || 0,
      gst: Number(it.gst) || 0,
      taxable: Number(it.taxable) || 0,
      cgstRate: Number(it.cgstRate || it.cr) || 0,
      cgstAmount: Number(it.cgstAmount || it.ca) || 0,
      sgstRate: Number(it.sgstRate || it.sr) || 0,
      sgstAmount: Number(it.sgstAmount || it.sa) || 0,
      igstRate: Number(it.igstRate || it.ir) || 0,
      igstAmount: Number(it.igstAmount || it.ia) || 0,
      net: Number(it.net) || 0
    })) : [],

    taxMode: data.taxMode || 'auto',
    taxType: data.taxType || 'intra',
    freight: Number(data.freight) || 0,
    roundMode: data.roundMode || 'auto',
    terms: data.terms || '',
    orientation: data.orientation || 'portrait',

    totals: {
      subTotal: Number(data.subTotal || (data.totals && data.totals.subTotal)) || 0,
      totalDiscount: Number(data.totalDiscount || (data.totals && data.totals.totalDiscount)) || 0,
      totalTaxable: Number(data.totalTaxable || (data.totals && data.totals.totalTaxable)) || 0,
      cgstTotal: Number(data.cgstTotal || (data.totals && data.totals.cgstTotal)) || 0,
      sgstTotal: Number(data.sgstTotal || (data.totals && data.totals.sgstTotal)) || 0,
      igstTotal: Number(data.igstTotal || (data.totals && data.totals.igstTotal)) || 0,
      grossTotal: Number(data.grossTotal || (data.totals && data.totals.grossTotal)) || 0,
      roundOff: Number(data.roundOff || (data.totals && data.totals.roundOff)) || 0,
      grandTotal: Number(data.grandTotal || (data.totals && data.totals.grandTotal)) || 0,
      grandTotalWords: data.grandTotalWords || (data.totals && data.totals.grandTotalWords) || ''
    },

    rawFormState: data.rawFormState || data
  };

  const invoice = await Invoice.findOneAndUpdate(
    { invNo: invNo },
    updatePayload,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return invoice;
}

/**
 * Get an invoice by its invoice number
 */
async function getInvoiceByNo(invNo) {
  if (!isConnected()) throw new Error('Database not connected.');
  return await Invoice.findOne({ invNo: String(invNo).trim() });
}

/**
 * Get all invoices with optional filtering and pagination
 */
async function getAllInvoices(options = {}) {
  if (!isConnected()) return [];

  const filter = {};
  if (options.docType) {
    filter.docType = options.docType;
  }
  if (options.search) {
    const s = options.search;
    filter.$or = [
      { invNo: { $regex: s, $options: 'i' } },
      { 'receiver.name': { $regex: s, $options: 'i' } },
      { 'company.name': { $regex: s, $options: 'i' } },
      { poNo: { $regex: s, $options: 'i' } }
    ];
  }

  const query = Invoice.find(filter).sort({ updatedAt: -1, createdAt: -1 });

  if (options.limit) {
    query.limit(Number(options.limit));
  }
  if (options.skip) {
    query.skip(Number(options.skip));
  }

  return await query.exec();
}

/**
 * Delete invoice by invoice number
 */
async function deleteInvoiceByNo(invNo) {
  if (!isConnected()) throw new Error('Database not connected.');
  return await Invoice.findOneAndDelete({ invNo: String(invNo).trim() });
}

/**
 * Get next sequential invoice number from DB based on financial year
 * Format: 001/2026-27 or QT-001/2026-27
 */
async function getNextInvoiceNumber(docType = 'invoice') {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const fy = `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;

  const prefix = docType === 'quotation' ? 'QT-' : '';
  const regex = new RegExp(`^${prefix}(\\d+)/${fy}$`);

  if (!isConnected()) {
    // Fallback if DB is disconnected
    return `${prefix}001/${fy}`;
  }

  const docs = await Invoice.find({
    docType: docType,
    invNo: { $regex: regex }
  }).select('invNo');

  let maxSeq = 0;
  docs.forEach(doc => {
    const match = regex.exec(doc.invNo);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}/${fy}`;
}

/**
 * Summary statistics for invoices
 */
async function getInvoiceStats() {
  if (!isConnected()) return null;

  const totalInvoices = await Invoice.countDocuments({ docType: 'invoice' });
  const totalQuotations = await Invoice.countDocuments({ docType: 'quotation' });

  const agg = await Invoice.aggregate([
    {
      $group: {
        _id: '$docType',
        totalTaxable: { $sum: '$totals.totalTaxable' },
        totalTax: { $sum: { $add: ['$totals.cgstTotal', '$totals.sgstTotal', '$totals.igstTotal'] } },
        totalAmount: { $sum: '$totals.grandTotal' }
      }
    }
  ]);

  return {
    totalInvoices,
    totalQuotations,
    financials: agg
  };
}

module.exports = {
  isConnected,
  authenticateUser,
  createUser,
  findUser,
  getAllUsers,
  saveInvoice,
  getInvoiceByNo,
  getAllInvoices,
  deleteInvoiceByNo,
  getNextInvoiceNumber,
  getInvoiceStats
};
