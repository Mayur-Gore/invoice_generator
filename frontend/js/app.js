(function () {
      "use strict";
      var KEY = "techwave_invoice_v1";
      /* Receiver (Billed To) GSTIN is fixed. To change it, edit the value below. */
      var RECEIVER_GSTIN = "27AAFPY8345R1ZJ";
      var $ = function (s, r) { return (r || document).querySelector(s) };
      var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) };

      function pad(n) { return String(n).padStart(2, "0") }
      function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) }

      var COMPANY_KEYS = ["coAddress", "coPhone", "coEmail", "coGstin", "coState", "coStateCode", "bank"];

      function blankItem() { return { name: "", desc: "", hsn: "", qty: 1, unit: "Nos.", rate: 0, disc: 0, gst: 18 } }
      function defaults() {
        return {
          coAddress: "Fourth Floor Ten No.1, LIG 20, Navi Mumbai, - 400706", coPhone: "9975589895, 9823158790", coEmail: "techwave8790@gmail.com", coGstin: "27AAFPY8345R1ZJ", coState: "Maharashtra", coStateCode: "27", bank: "A/c No.: 4168976430",
          invNo: "", transport: "", poNo: "", poDate: "", supplyDate: today(), supplyTime: "17:00", vehicle: "", placeOfSupply: "",
          bName: "", bAddress: "", bState: "Maharashtra", bStateCode: "27", bGstin: RECEIVER_GSTIN,
          same: true, cName: "", cAddress: "", cState: "", cStateCode: "", cGstin: "27AAFPY8345R1ZJ",
          docType: "invoice", gstOpt: "with", preparedBy: "", recNo: "", dueDate: "", payStatus: "", taxMode: "auto", freight: 0, roundMode: "auto", orientation: "portrait",
          terms: "Terms & Conditions:\n1. Prices are in Indian Rupees and GST is shown separately above.\n2. Delivery: Within 5–7 working days from confirmed purchase order, subject to stock availability.\n3. Payment: 100% within 15 days from delivery / invoice date.\n4. Warranty: As per respective manufacturer's standard warranty, where applicable.\n\nWe trust you will find our offer most competitive and request you favor us with your valued purchase / work order.\nWe are always at your service and thanking you in the meanwhile, we remain.\n\nThanking you,",
          items: [blankItem()]
        };
      }

      var S = defaults();
      function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { } }
      try {
        var saved = JSON.parse(localStorage.getItem(KEY) || "null");
        if (saved && typeof saved === "object") { S = Object.assign(defaults(), saved); if (!S.items || !S.items.length) S.items = [blankItem()] }
      } catch (e) { }
      if (!S.bGstin) S.bGstin = RECEIVER_GSTIN;
      /* fill the new defaults into company details saved by an earlier version */
      var D0 = defaults();
      if (!S.coAddress) S.coAddress = D0.coAddress;
      if (!S.coPhone || S.coPhone === "8356058098") S.coPhone = D0.coPhone;
      if (!S.bank) S.bank = D0.bank;
      if (S.terms === "1. Interest @24% will be charged on invoices not paid on due date.\n2. All disputes subject to Pune jurisdiction only.") S.terms = D0.terms;
      // Load selected invoice from previous bills view
if (localStorage.getItem('selectedInvoice')) {
  try {
    var savedInv = JSON.parse(localStorage.getItem('selectedInvoice'));
    S = Object.assign(defaults(), savedInv);
    localStorage.removeItem('selectedInvoice');
    persist();
  } catch(e) {}
}


      /* ---------- helpers ---------- */
      function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] }) }
      function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0 }
      function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }
      function money(n) { return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
      function dmy(iso) { if (!iso) return ""; var p = iso.split("-"); return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : iso }
      function t12(t) { if (!t) return ""; var p = t.split(":"), h = +p[0], m = p[1], ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return pad(h) + ":" + m + " " + ap }

      var ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
      var TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      function below100(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "") }
      function below1000(n) { var s = ""; if (n >= 100) { s = ONES[Math.floor(n / 100)] + " Hundred"; n %= 100; if (n) s += " " } return s + (n ? below100(n) : "") }
      function wordsInt(n) {
        if (n === 0) return "Zero";
        var parts = [], cr = Math.floor(n / 1e7); n %= 1e7;
        var lk = Math.floor(n / 1e5); n %= 1e5;
        var th = Math.floor(n / 1e3); n %= 1e3;
        if (cr) parts.push(wordsInt(cr) + " Crore");
        if (lk) parts.push(below100(lk) + " Lakh");
        if (th) parts.push(below100(th) + " Thousand");
        if (n) parts.push(below1000(n));
        return parts.join(" ");
      }
      function amountWords(amt) {
        var total = Math.round(amt * 100), rs = Math.floor(total / 100), ps = total % 100;
        var s = "Rupees " + wordsInt(rs);
        if (ps) s += " and " + below100(ps) + " Paise";
        return s + " Only";
      }

      /* ---------- calculation ---------- */
      function consigneeOf() {
        return S.same ? { name: S.bName, addr: S.bAddress, state: S.bState, code: S.bStateCode, gstin: S.bGstin }
          : { name: S.cName, addr: S.cAddress, state: S.cState, code: S.cStateCode, gstin: S.cGstin };
      }
      function taxType() {
        /* quotations show GST as one combined amount (IGST columns); CGST / SGST columns are not shown */
        if (S.docType === "quotation") return "inter";
        if (S.taxMode === "intra") return "intra";
        if (S.taxMode === "inter") return "inter";
        var a = String(S.coStateCode || "").trim(), b = String(consigneeOf().code || S.bStateCode || "").trim();
        return (a && b && a !== b) ? "inter" : "intra";
      }
      function compute() {
        var type = taxType(), rows = [], sum = { total: 0, disc: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, net: 0 };
        S.items.forEach(function (it) {
          var qty = num(it.qty), rate = num(it.rate), gst = (S.docType === "quotation" && S.gstOpt === "without") ? 0 : num(it.gst);
          var total = r2(qty * rate), disc = Math.min(Math.max(num(it.disc), 0), total), taxable = r2(total - disc);
          var row = { it: it, qty: qty, rate: rate, total: total, disc: disc, taxable: taxable, gst: gst, cr: 0, ca: 0, sr: 0, sa: 0, ir: 0, ia: 0 };
          if (type === "intra") { row.cr = row.sr = gst / 2; row.ca = r2(taxable * gst / 200); row.sa = r2(taxable * gst / 200) }
          else { row.ir = gst; row.ia = r2(taxable * gst / 100) }
          row.net = r2(taxable + row.ca + row.sa + row.ia);
          sum.net += row.net;
          sum.total += total; sum.disc += disc; sum.taxable += taxable; sum.cgst += row.ca; sum.sgst += row.sa; sum.igst += row.ia;
          rows.push(row);
        });
        Object.keys(sum).forEach(function (k) { sum[k] = r2(sum[k]) });
        var freight = r2(Math.max(num(S.freight), 0));
        var gross = r2(sum.taxable + sum.cgst + sum.sgst + sum.igst);
        var pre = r2(gross + freight), grand = pre, round = 0;
        if (S.roundMode === "auto") { grand = Math.round(pre); round = r2(grand - pre) }
        return { type: type, rows: rows, sum: sum, freight: freight, gross: gross, round: round, grand: grand };
      }

      /* ---------- invoice markup ---------- */
      var LOGO = '<svg viewBox="0 0 170 100" aria-hidden="true"><defs><clipPath id="twc"><rect x="0" y="10" width="200" height="80"/></clipPath></defs>' +
        '<g transform="translate(24,0) skewX(-14)"><rect x="0" y="10" width="62" height="15" fill="#0b2a6b"/><rect x="22" y="25" width="17" height="65" fill="#0b2a6b"/>' +
        '<g clip-path="url(#twc)"><polyline points="58,0 75,92 96,40 117,92 134,0" fill="none" stroke="#1e56d8" stroke-width="15" stroke-linejoin="miter" stroke-miterlimit="10"/></g></g>' +
        '<polygon points="72,0 50,48 62,48 42,100 80,40 66,40 82,0" fill="#f26a1b" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>';
      function pct(n) { return n ? (Math.round(n * 100) / 100) + "%" : "" }

      function render() {
        var c = compute(), cons = consigneeOf(), landscape = S.orientation === "landscape";
        var h = "";
        if (S.docType === "quotation") { commitSheet(quoteHtml(c, cons), landscape); return }
        h += '<div class="inv-head"><div class="brand">' + LOGO + '<div><div class="name">TECH<b>WAVE</b></div><div class="sub">ENTERPRISES</div><div class="tag">POWERING YOUR INDUSTRY</div></div></div>';
        h += '<div class="contact">' + (S.coAddress ? '<div class="addr">' + esc(S.coAddress) + '</div>' : '') +
          (S.coPhone ? '<div><b>Mobile:</b> ' + esc(S.coPhone) + '</div>' : '') + (S.coEmail ? '<div><b>Email:</b> ' + esc(S.coEmail) + '</div>' : '') +
          (S.coGstin ? '<div><b>GSTIN:</b> ' + '27AAFPY8345R1ZJ' + '</div>' : '') + '</div></div>';
        h += S.docType === "quotation" ? '<div class="inv-title"><span class="hl">Quotation</span></div>' : '<div class="inv-title">Tax Invoice</div>';
        document.title = (S.docType === "quotation" ? "Quotation" : "Tax Invoice") + (S.invNo ? " " + S.invNo.replace(/[\\/:*?"<>|]+/g, "-") : "") + " - Techwave Enterprises";

        h += '<div class="meta">' +
          '<div><b>GSTIN:</b> ' + '27AAFPY8345R1ZJ' + '</div><div><b>Mode of Transport:</b> ' + uv(S.transport) + '</div>' +
          '<div><b>Serial Number Invoice:</b> ' + uv(S.invNo) + '</div><div><b>Vehicle No:</b> ' + uv(S.vehicle) + '</div>' +
          '<div><b>P.O. No. &amp; Date:</b> ' + uv(S.poNo + (S.poDate ? (S.poNo ? " " : "") + dmy(S.poDate) : "")) + '</div>' +
          '<div><b>Date &amp; Time of Supply:</b> ' + uv(dmy(S.supplyDate) + (S.supplyTime ? " & " + t12(S.supplyTime) : "")) + '</div>' +
          '<div><b>State / Code:</b> ' + esc(S.coState) + ' / ' + esc(S.coStateCode) + '</div><div><b>Place of Supply:</b> ' + uv(S.placeOfSupply) + '</div>' +
          '</div>';

        function uv(v) { return '<span class="uv">' + esc(v) + '</span>' }
        function party(title, p) {
          return '<div><h4>' + title + '</h4><div class="line"><b>Name:</b> ' + uv(p.name) + '</div><div class="line"><b>Address:</b> ' + uv(p.addr) + '</div>' +
            '<div><b>State:</b> ' + uv(p.state) + ' &nbsp; <b>State Code:</b> ' + uv(p.code) + '</div><div><b>GSTIN/Unique ID:</b> ' + uv(p.gstin) + '</div></div>';
        }
        h += '<div class="parties">' + party("Details of Receiver (Billed To)", { name: S.bName, addr: S.bAddress, state: S.bState, code: S.bStateCode, gstin: S.bGstin }) +
          party("Details of Consignee (Shipped To)", cons) + '</div>';

        var hasDisc = c.sum.disc > 0; /* Total and Discount columns appear only when a discount is given (otherwise Total = Taxable Value), which leaves room for larger text */
        h += '<table class="items">' +
          '<thead><tr><th rowspan="2" class="wrap">S. No</th><th rowspan="2" class="wrap" style="min-width:28mm">Description of Goods</th><th rowspan="2" class="wrap">HSN Code</th><th rowspan="2">Qty.</th><th rowspan="2">Unit</th><th rowspan="2">Rate</th>' + (hasDisc ? '<th rowspan="2">Total</th><th rowspan="2">Discount</th>' : '') + '<th rowspan="2" class="wrap">Taxable Value</th>' + (c.type === "intra" ? '<th colspan="2">CGST</th><th colspan="2">SGST</th>' : '<th colspan="2">IGST</th>') + '<th rowspan="2" class="wrap">Total Amount</th></tr>' +
          '<tr>' + (c.type === "intra" ? "<th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th>" : "<th>Rate</th><th>Amount</th>") + '</tr></thead><tbody>';
        c.rows.forEach(function (r, i) {
          var intra = c.type === "intra";
          h += '<tr><td class="c">' + (i + 1) + '</td><td class="desc">' + esc(r.it.desc) + '</td><td class="c">' + esc(r.it.hsn) + '</td>' +
            '<td class="c">' + esc(r.qty) + '</td><td class="c">' + esc(r.it.unit) + '</td><td class="n">' + money(r.rate) + '</td>' +
            (hasDisc ? '<td class="n">' + money(r.total) + '</td><td class="n">' + (r.disc ? money(r.disc) : "") + '</td>' : '') + '<td class="n">' + money(r.taxable) + '</td>' +
            (intra ? '<td class="c">' + pct(r.cr) + '</td><td class="n">' + money(r.ca) + '</td><td class="c">' + pct(r.sr) + '</td><td class="n">' + money(r.sa) + '</td>'
              : '<td class="c">' + pct(r.ir) + '</td><td class="n">' + money(r.ia) + '</td>') +
            '<td class="n"><b>' + money(r.net) + '</b></td></tr>';
        });
        var fillMm = Math.max(0, 4 - c.rows.length) * 9;
        if (fillMm) { h += '<tr class="fill" style="height:' + fillMm + 'mm">' + new Array((c.type === "intra" ? 13 : 11) + (hasDisc ? 2 : 0)).join("<td></td>") + '</tr>' }
        h += '<tr style="font-weight:700;background:#f5f8ff"><td colspan="6" class="n" style="border-top:1px solid #333">Sub-total</td>' + (hasDisc ? '<td class="n" style="border-top:1px solid #333">' + money(c.sum.total) + '</td><td class="n" style="border-top:1px solid #333">' + money(c.sum.disc) + '</td>' : '') + '<td class="n" style="border-top:1px solid #333">' + money(c.sum.taxable) + '</td>' +
          (c.type === "intra" ? '<td style="border-top:1px solid #333"></td><td class="n" style="border-top:1px solid #333">' + money(c.sum.cgst) + '</td><td style="border-top:1px solid #333"></td><td class="n" style="border-top:1px solid #333">' + money(c.sum.sgst) + '</td>'
            : '<td style="border-top:1px solid #333"></td><td class="n" style="border-top:1px solid #333">' + money(c.sum.igst) + '</td>') + '<td class="n" style="border-top:1px solid #333">' + money(c.sum.net) + '</td></tr>';
        h += '</tbody></table>';

        h += '<div class="bottom"><div class="row"><div class="left"><div><b>INVOICE TOTAL (In Words)</b></div><div class="words">' + esc(amountWords(c.grand)) + '</div>' +
          (S.terms ? '<div class="terms">' + esc(S.terms) + '</div>' : '') + (S.bank ? '<div class="bank"><b>Bank details</b>\n' + esc(S.bank) + '</div>' : '') + '</div>' +
          '<div class="sum"><div><span>TOTAL</span><span>' + money(c.gross) + '</span></div><div><span>Freight Charges</span><span>' + (c.freight ? money(c.freight) : "") + '</span></div>' +
          '<div><span>Round Off</span><span>' + (c.round ? (c.round > 0 ? "+" : "−") + money(Math.abs(c.round)) : "") + '</span></div><div><span>INVOICE TOTAL (₹)</span><span>' + money(c.grand) + '</span></div></div></div>' +
          '<div class="sign"><div>Received the goods in good condition.<br><br>Receiver\'s signature</div><div class="r"><div>For <b>Techwave Enterprises</b></div><div>Authorized Signatory</div></div></div></div>';
        h += '<div class="foot">Your Trusted Partner in Industrial Electrical Solutions</div>';

        commitSheet(h, landscape);
      }

      function commitSheet(h, landscape) {
        var sh = $("#sheet");
        sh.innerHTML = h;
        if (!landscape && tableTooWideForPortrait()) landscape = true;
        sh.classList.toggle("landscape", landscape);
        $("#pageRule").textContent = "@page{size:A4 " + (landscape ? "landscape" : "portrait") + ";margin:8mm}";
        sh.style.zoom = "";
        fitPreview();
      }

      /* ---------- quotation page (template layout: Items · Specification · Unit price · Quantity · Amount) ---------- */
      function quoteHtml(c, cons) {
        var h = "", rates = [];
        h += '<div class="q-head"><div class="q-brand">' + LOGO + '<div><div class="q-name">TECH<b>WAVE</b></div><div class="q-sub">ENTERPRISES</div><div class="q-slogan">POWERING YOUR INDUSTRY</div></div></div>' +
          '<div class="q-title"><span>Quotation</span></div></div>';
        var meta = '<tr><td>DATE :</td><td>' + esc(dmy(S.supplyDate)) + '</td></tr><tr><td>Quote No:</td><td>' + esc(S.invNo) + '</td></tr><tr><td>Expiration Date:</td><td>' + esc(dmy(S.dueDate)) + '</td></tr>' +
          (S.poNo || S.poDate ? '<tr><td>P.O. No.:</td><td>' + esc(S.poNo) + (S.poDate ? (S.poNo ? " " : "") + dmy(S.poDate) : "") + '</td></tr>' : '') +
          (S.placeOfSupply ? '<tr><td>Place of Supply:</td><td>' + esc(S.placeOfSupply) + '</td></tr>' : '');
        function who(p) {
          return '<div><b>' + esc(p.name) + '</b></div>' + (p.addr ? '<div class="q-pre">' + esc(p.addr) + '</div>' : '') +
            ((p.state || p.code) ? '<div>' + esc(p.state) + (p.code ? ' (State Code: ' + esc(p.code) + ')' : '') + '</div>' : '') + (p.gstin ? '<div>GSTIN: ' + esc(p.gstin) + '</div>' : '');
        }
        h += '<div class="q-top"><div>' +
          '<div class="q-lbl">Address:</div><div><b>Techwave Enterprises</b></div>' + (S.coAddress ? '<div class="q-pre">' + esc(S.coAddress) + '</div>' : '') +
          (S.coPhone ? '<div>Mobile: ' + esc(S.coPhone) + '</div>' : '') + (S.coEmail ? '<div>Email: ' + esc(S.coEmail) + '</div>' : '') +
          (S.coGstin ? '<div>GSTIN: ' + esc(S.coGstin) + ((S.coState || S.coStateCode) ? ' &nbsp;|&nbsp; ' + esc(S.coState) + (S.coStateCode ? ' (Code: ' + esc(S.coStateCode) + ')' : '') : '') + '</div>' : '') +
          '<div class="q-lbl" style="margin-top:3mm">To :</div>' + who({ name: S.bName, addr: S.bAddress, state: S.bState, code: S.bStateCode, gstin: S.bGstin }) +
          '</div><div><table class="q-meta">' + meta + '</table>' +
          '</div></div>';
        h += '<div class="q-by">Quotation prepared by : <span>' + esc(S.preparedBy) + '</span></div>';
        h += '<table class="qitems"><colgroup><col style="width:7%"><col style="width:43%"><col style="width:17%"><col style="width:15%"><col style="width:18%"></colgroup>' +
          '<thead><tr><th>S. No</th><th>Items</th><th>Unit Price</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>';
        c.rows.forEach(function (r, i) {
          if (r.gst && rates.indexOf(r.gst) < 0) rates.push(r.gst);
          h += '<tr><td class="c">' + (i + 1) + '</td><td>' + (r.it.name ? '<b>' + esc(r.it.name) + '</b>' : '') + (r.it.hsn ? '<div class="q-hsn">HSN: ' + esc(r.it.hsn) + '</div>' : '') + '</td>' +
            '<td class="n">' + money(r.rate) + '</td><td class="c">' + esc(r.qty) + ' ' + esc(r.it.unit) + '</td><td class="n">' + money(r.total) + '</td></tr>';
        });
        var fillMm = Math.max(0, 5 - c.rows.length) * 8;
        h += '<tr class="last" style="height:' + Math.max(fillMm, 2) + 'mm"><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>';
        var gstLabel = rates.length ? "GST " + rates.map(function (x) { return (Math.round(x * 100) / 100) + "%" }).join(" / ") : "GST";
        var noGst = S.gstOpt === "without";
        var terms = String(S.terms || "").replace(/^\s*terms\s*(&|and)\s*conditions\s*:?\s*\n?/i, "");
        if (noGst) terms = terms.replace(/GST is shown separately above\./i, "GST is not included.");
        h += '<div class="q-bottom"><div class="q-left"><div class="q-lbl">Grand total (in words)</div><div class="q-words">' + esc(amountWords(c.grand)) + '</div>' +
          (terms ? '<div class="q-lbl">Terms and Conditions :</div><div class="q-pre">' + esc(terms) + '</div>' : '') +
          (S.bank ? '<div class="q-lbl" style="margin-top:3mm">Bank details</div><div class="q-pre">' + esc(S.bank) + '</div>' : '') + '</div>' +
          '<div class="q-tot"><div><span>Sub Total</span><span>₹ ' + money(c.sum.total) + '</span></div>' +
          (c.sum.disc ? '<div><span>Discount</span><span>− ₹ ' + money(c.sum.disc) + '</span></div>' : '') +
          (noGst ? '' : '<div><span>' + gstLabel + '</span><span>₹ ' + money(c.sum.igst) + '</span></div>') +
          (c.freight ? '<div><span>Freight</span><span>₹ ' + money(c.freight) + '</span></div>' : '') +
          (c.round ? '<div><span>Round Off</span><span>' + (c.round > 0 ? "+" : "−") + ' ₹ ' + money(Math.abs(c.round)) + '</span></div>' : '') +
          '<div><span>Grand Total</span><span>₹ ' + money(c.grand) + '</span></div></div></div>';
        h += '<div class="q-foot"><div class="q-accept"><div class="q-acceptl">To accept this quotation, please sign here and return :<span class="ln"></span></div>' +
          '<div class="q-sig"><div>For <b>Techwave Enterprises</b></div><div>Authorized Signatory</div></div></div>' +
          '<div class="q-contact">If you have any questions about this quotation, please contact<br><b>Techwave Enterprises</b>' + (S.coPhone ? ' , PH : ' + esc(S.coPhone) : '') + (S.coEmail ? ' , ' + esc(S.coEmail) : '') + '</div>' +
          '<div class="q-thanks">THANK YOU FOR YOUR BUSINESS!</div></div>';
        h += '<div class="foot">Your Trusted Partner in Industrial Electrical Solutions</div>';
        return h;
      }

      /* The item table always uses large 11pt text (headings 8.5pt).
         If its columns need more width than portrait A4 offers, the sheet switches to landscape instead of shrinking the text. */
      function tableTooWideForPortrait() {
        var t = $("table.items"); if (!t) return false;
        var availPx = (210 - 16) * 96 / 25.4;
        var box = document.createElement("div");
        box.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;padding:0;width:" + availPx + "px";
        var c = t.cloneNode(true); c.style.width = "1px"; c.style.fontSize = "11pt"; box.appendChild(c); document.body.appendChild(box);
        var need = c.offsetWidth; document.body.removeChild(box);
        return need > availPx + 2;
      }

      /* shrink the A4 sheet on narrow screens (screen only; print resets zoom) */
      function fitPreview() {
        var sh = $("#sheet"), wrap = $("#previewWrap");
        sh.style.zoom = "";
        var avail = wrap.clientWidth - 4, need = sh.offsetWidth;
        if (avail > 0 && need > avail) sh.style.zoom = (avail / need).toFixed(3);
      }
      window.addEventListener("resize", fitPreview);
      window.addEventListener("beforeprint", function () { $("#sheet").style.zoom = "1" });
      window.addEventListener("afterprint", fitPreview);

      /* ---------- items form ---------- */
      function renderItems() {
        var box = $("#itemsBox"); box.innerHTML = "";
        S.items.forEach(function (it, i) {
          var d = document.createElement("div"); d.className = "item";
          d.innerHTML = '<div class="item-head"><span>Item ' + (i + 1) + '</span>' + (S.items.length > 1 ? '<button class="btn-small btn-danger" data-del="' + i + '">Remove</button>' : '') + '</div>' +
            (S.docType === "quotation" ? '<div style="margin-bottom:8px"><label>Item name</label><input data-i="' + i + '" data-f="name" value="' + esc(it.name) + '"></div>' : '') +
            (S.docType === "quotation" ? "" : '<div style="margin-bottom:8px"><label>Description of goods</label><textarea data-i="' + i + '" data-f="desc" rows="2">' + esc(it.desc) + '</textarea></div>') +
            '<div class="grid3">' +
            '<div><label>HSN Code</label><input data-i="' + i + '" data-f="hsn" value="' + esc(it.hsn) + '"></div>' +
            '<div><label>Qty.</label><input type="number" min="0" step="any" data-i="' + i + '" data-f="qty" value="' + esc(it.qty) + '"></div>' +
            '<div><label>Unit</label><input data-i="' + i + '" data-f="unit" value="' + esc(it.unit) + '"></div>' +
            '<div><label>Rate (₹)</label><input type="number" min="0" step="any" data-i="' + i + '" data-f="rate" value="' + esc(it.rate) + '"></div>' +
            '<div><label>Discount (₹)</label><input type="number" min="0" step="any" data-i="' + i + '" data-f="disc" value="' + esc(it.disc) + '"></div>' +
            '<div><label>GST %</label><input type="number" min="0" step="any" data-i="' + i + '" data-f="gst" value="' + esc(it.gst) + '"></div></div>';
          box.appendChild(d);
        });
      }
      $("#itemsBox").addEventListener("input", function (e) {
        var t = e.target, i = t.getAttribute("data-i"), f = t.getAttribute("data-f");
        if (i === null) return;
        S.items[+i][f] = t.value; persist(); render();
      });
      $("#itemsBox").addEventListener("click", function (e) {
        var i = e.target.getAttribute("data-del");
        if (i === null) return;
        S.items.splice(+i, 1); persist(); renderItems(); render();
      });
      $("#addItem").addEventListener("click", function () {
        var last = S.items[S.items.length - 1] || {};
        var n = blankItem(); n.gst = last.gst != null ? last.gst : 18; n.unit = last.unit || "Nos.";
        S.items.push(n); persist(); renderItems(); render();
      });

      /* ---------- simple fields ---------- */
      function syncForm() {
        $$("[data-k]").forEach(function (el) {
          var k = el.getAttribute("data-k");
          if (el.type === "checkbox") el.checked = !!S[k]; else el.value = S[k] == null ? "" : S[k];
        });
        $("#consigneeFields").style.display = S.same ? "none" : "";
      }
      $$("[data-k]").forEach(function (el) {
        el.addEventListener("input", function () {
          var k = el.getAttribute("data-k");
          S[k] = el.type === "checkbox" ? el.checked : el.value;
          if (k === "same") $("#consigneeFields").style.display = S.same ? "none" : "";
          if (k === "docType") onDocType();
          persist(); render();
        });
        el.addEventListener("change", function () { if (el.type === "checkbox") el.dispatchEvent(new Event("input")) });
      });

      /* ---------- buttons ---------- */
      $("#btnPrint").addEventListener("click", function () {
        recordAndPrint();
      });
      function startNewInvoice(skipConfirm) {
        if (!skipConfirm && !confirm("Start a new invoice? Your company details will be kept.")) return;
        var d = defaults();
        COMPANY_KEYS.forEach(function (k) { d[k] = S[k] });
        d.terms = S.terms; d.orientation = S.orientation; d.docType = S.docType;
        S = d; S.recNo = ""; S.invNo = nextInvNo(); persist(); applyDocType(); syncForm(); renderItems(); render(); updateEditModeUI();
        syncNextNoFromDb();
      }
      $("#btnReset").addEventListener("click", function () { startNewInvoice(false); });
      function tab(which) {
        document.body.className = "tab-" + which;
        $("#tabEdit").classList.toggle("on", which === "edit");
        $("#tabPrev").classList.toggle("on", which === "preview");
        if (which === "preview") setTimeout(fitPreview, 0);
      }
      $("#tabEdit").addEventListener("click", function () { tab("edit") });
      $("#tabPrev").addEventListener("click", function () { tab("preview") });


      /* =====================================================================
         REGISTERS & AUTOMATIC NUMBERING
         Numbers: invoices 001/2026-27 · quotations QT-001/2026-27 (financial year Apr–Mar)
         ===================================================================== */
      var CFG = {
        invoice: {
          type: "invoice", prefix: "", logKey: "techwave_invoice_log_v1", ctrKey: "techwave_invoice_counter_v1",
          statusList: ["Paid", "Unpaid", "Partially Paid", "Overdue"]
        },
        quotation: {
          type: "quotation", prefix: "QT-", logKey: "techwave_quotation_log_v1", ctrKey: "techwave_quotation_counter_v1",
          statusList: ["Open", "Accepted", "Rejected", "Expired"]
        }
      };
      function cfgNow() { return S.docType === "quotation" ? CFG.quotation : CFG.invoice }

      var toastT = null;
      function setMsg(t, bad) {
        var m = $("#toast"); if (!t) { m.style.display = "none"; return }
        m.textContent = t; m.style.background = bad ? "#b42318" : "#17233f"; m.style.display = "block";
        clearTimeout(toastT); toastT = setTimeout(function () { m.style.display = "none" }, bad ? 9000 : 4500);
      }

      /* --- local log of every saved record (backup + source for "Download register") --- */
      function readLog(cfg) { try { return JSON.parse(localStorage.getItem(cfg.logKey) || "[]") } catch (e) { return [] } }
      function upsertLog(cfg, rec) {
        var log = readLog(cfg), k = rec.no.toUpperCase(), i = log.findIndex(function (r) { return String(r.no).toUpperCase() === k });
        if (i >= 0) log[i] = rec; else log.push(rec);
        try { localStorage.setItem(cfg.logKey, JSON.stringify(log)) } catch (e) { }
        return i >= 0;
      }

      /* --- automatic numbers --- */
      function fyOf(d) { d = d || new Date(); var y = d.getFullYear(), m = d.getMonth() + 1, a = m >= 4 ? y : y - 1; return a + "-" + String((a + 1) % 100).padStart(2, "0") }
      function noRe(cfg) { return new RegExp("^\\s*" + cfg.prefix + "(\\d+)\\s*/\\s*(\\d{4}-\\d{2})\\s*$") }
      function isValidNo(cfg, no) { return noRe(cfg).test(String(no || "")) }
      function seqOf(cfg, no, fy) { var m = noRe(cfg).exec(String(no || "")); return m && m[2] === fy ? parseInt(m[1], 10) : 0 }
      function readCtr(cfg) { try { return JSON.parse(localStorage.getItem(cfg.ctrKey) || "{}") || {} } catch (e) { return {} } }
      function bumpCounter(cfg, no) {
        var m = noRe(cfg).exec(String(no || "")); if (!m) return;
        var c = readCtr(cfg), n = parseInt(m[1], 10); if (!(c[m[2]] >= n)) { c[m[2]] = n; try { localStorage.setItem(cfg.ctrKey, JSON.stringify(c)) } catch (e) { } }
      }
      function makeNo(cfg, n, fy) { return cfg.prefix + String(n).padStart(3, "0") + "/" + fy }
      function highest(cfg, fy) { var hi = readCtr(cfg)[fy] || 0; readLog(cfg).forEach(function (r) { hi = Math.max(hi, seqOf(cfg, r.no, fy)) }); return hi }
      function nextNo(cfg) { var fy = fyOf(); return makeNo(cfg, highest(cfg, fy) + 1, fy) }
      function nextInvNo() { return nextNo(cfgNow()) }

      /* --- form labels that depend on the document type --- */
      function applyDocType() {
        var q = S.docType === "quotation", cfg = cfgNow();
        $("#prepWrap").style.display = q ? "" : "none"; $("#gstWrap").style.display = q ? "" : "none"; $("#consCard").style.display = q ? "none" : "";
        $("#lblNo").textContent = q ? "Quotation Number (auto)" : "Serial Number Invoice (auto)";
        $("#lblDue").textContent = q ? "Valid Until" : "Due Date";
        $("#lblStatus").textContent = q ? "Quotation Status" : "Payment Status";
        var sel = $("[data-k=payStatus]"), list = [""].concat(cfg.statusList);
        if (list.indexOf(S.payStatus) < 0) S.payStatus = "";
        sel.innerHTML = list.map(function (o) { return '<option value="' + o + '">' + o + "</option>" }).join("");
        sel.value = S.payStatus;
      }
      function onDocType() { S.invNo = nextInvNo(); S.payStatus = ""; S.recNo = ""; applyDocType(); syncForm(); renderItems(); persist() }

      function recordOf(cfg) {
        var c = compute(), rem = [], q = cfg.type === "quotation";
        if (c.freight) rem.push("Includes freight ₹" + money(c.freight));
        if (c.round) rem.push("Round-off " + (c.round > 0 ? "+" : "−") + money(Math.abs(c.round)));
        return { no: String(S.invNo || "").trim(), date: S.supplyDate || "", vendor: "Techwave Enterprises", cust: String(S.bName || "").trim(), gst: S.coGstin || "",
          taxable: c.sum.taxable, cgst: c.sum.cgst, sgst: c.sum.sgst, igst: c.sum.igst, total: c.grand, due: S.dueDate || "", status: S.payStatus || "",
          src: q ? "Quotation generator" : "Invoice generator", rem: rem.join("; ") };
      }
      /* save the current invoice / quotation locally. Resolves {ok, reason, text} */
      async function saveRecord() {
        var cfg = cfgNow(), word = cfg.type === "quotation" ? "Quotation" : "Invoice", rec = recordOf(cfg);
        if (!rec.no) return { ok: false, reason: "nonumber", text: "The " + word.toLowerCase() + " number is empty." };
        var was = upsertLog(cfg, rec); bumpCounter(cfg, rec.no); S.recNo = rec.no; persist();
        return { ok: true, text: word + " " + rec.no + " " + (was ? "updated" : "saved") + " on this device." };
      }

      /* Save this document directly to MongoDB */
      async function saveToMongoDb(silent) {
        var c = compute();
        var payload = {
          docType: S.docType,
          invNo: S.invNo,
          coName: "Techwave Enterprises",
          coAddress: S.coAddress,
          coPhone: S.coPhone,
          coEmail: S.coEmail,
          coGstin: S.coGstin,
          coState: S.coState,
          coStateCode: S.coStateCode,
          bank: S.bank,
          transport: S.transport,
          poNo: S.poNo,
          poDate: S.poDate,
          supplyDate: S.supplyDate,
          supplyTime: S.supplyTime,
          vehicle: S.vehicle,
          placeOfSupply: S.placeOfSupply,
          gstOpt: S.gstOpt,
          preparedBy: S.preparedBy,
          dueDate: S.dueDate,
          payStatus: S.payStatus,
          bName: S.bName,
          bAddress: S.bAddress,
          bState: S.bState,
          bStateCode: S.bStateCode,
          bGstin: S.bGstin,
          same: S.same,
          cName: S.cName,
          cAddress: S.cAddress,
          cState: S.cState,
          cStateCode: S.cStateCode,
          cGstin: S.cGstin,
          items: c.rows.map(function (r) {
            return {
              name: r.it.name || "",
              desc: r.it.desc || "",
              hsn: r.it.hsn || "",
              qty: r.qty,
              unit: r.it.unit || "Nos.",
              rate: r.rate,
              disc: r.disc,
              gst: r.gst,
              taxable: r.taxable,
              cgstRate: r.cr,
              cgstAmount: r.ca,
              sgstRate: r.sr,
              sgstAmount: r.sa,
              igstRate: r.ir,
              igstAmount: r.ia,
              net: r.net
            };
          }),
          taxMode: S.taxMode,
          taxType: c.type,
          freight: c.freight,
          roundMode: S.roundMode,
          terms: S.terms,
          orientation: S.orientation,
          totals: {
            subTotal: c.sum.total,
            totalDiscount: c.sum.disc,
            totalTaxable: c.sum.taxable,
            cgstTotal: c.sum.cgst,
            sgstTotal: c.sum.sgst,
            igstTotal: c.sum.igst,
            grossTotal: c.gross,
            roundOff: c.round,
            grandTotal: c.grand,
            grandTotalWords: amountWords(c.grand)
          },
          rawFormState: S
        };

        try {
          var wasEditing = !!(S.recNo && S.recNo === S.invNo);
          var res = await fetch(window.apiUrl("/api/invoices"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          var data = await res.json();
          if (data.success) {
            S.recNo = S.invNo;
            upsertLog(cfgNow(), recordOf(cfgNow()));
            bumpCounter(cfgNow(), S.invNo);
            persist();
            updateEditModeUI();
            if (!silent) setMsg("✓ " + (S.docType === "quotation" ? "Quotation " : "Invoice ") + S.invNo + (wasEditing ? " updated in MongoDB!" : " saved to MongoDB!"), false);
            var btn = $("#btnSaveDb");
            if (btn) {
              btn.textContent = wasEditing ? "💾 Updated ✓" : "💾 Saved ✓";
              btn.classList.add("ok");
              setTimeout(function () {
                updateEditModeUI();
                btn.classList.remove("ok");
              }, 3000);
            }
            return true;
          } else {
            if (!silent) setMsg("MongoDB: " + (data.message || "Could not save to DB"), true);
            return false;
          }
        } catch (e) {
          if (!silent) setMsg("MongoDB offline: bill saved locally on device.", false);
          return false;
        }
      }

      async function recordAndPrint() {
        /* Automatically record bill to MongoDB */
        saveToMongoDb(true);
        var r = await saveRecord();
        setMsg(r.text, !r.ok);
        window.print();
      }

      /* numbers are system-generated only: replace blanks and any hand-typed value */
      if (!isValidNo(cfgNow(), S.invNo)) { S.invNo = nextInvNo(); persist() }
      applyDocType();

      /* Save to MongoDB Button */
      var btnSaveDb = $("#btnSaveDb");
      if (btnSaveDb) {
        btnSaveDb.addEventListener("click", function () {
          saveToMongoDb(false);
        });
      }

      /* User profile display & Logout handler */
      try {
        var userStr = localStorage.getItem("techwave_user");
        if (userStr) {
          var userObj = JSON.parse(userStr);
          var nameEl = $("#userNameDisplay");
          if (nameEl && userObj) {
            nameEl.textContent = "👤 " + (userObj.name || userObj.username || "Admin");
          }
        }
      } catch (e) { }

      var btnLogout = $("#btnLogout");
      if (btnLogout) {
        btnLogout.addEventListener("click", function () {
          if (confirm("Are you sure you want to sign out?")) {
            localStorage.removeItem("techwave_user");
            window.location.replace("index.html");
          }
        });
      }

      /* Sync next number from MongoDB */
      async function syncNextNoFromDb() {
        if (S.recNo) return;
        try {
          var res = await fetch(window.apiUrl("/api/invoices/next-no?docType=" + S.docType));
          var data = await res.json();
          if (data && data.success && data.nextNo && !S.recNo) {
            var fy = fyOf(), curSeq = seqOf(cfgNow(), S.invNo, fy), dbSeq = seqOf(cfgNow(), data.nextNo, fy);
            if (dbSeq > curSeq) {
              S.invNo = data.nextNo;
              persist();
              syncForm();
              render();
            }
          }
        } catch (e) { }
      }

      /* ---------- Edit existing bill indicator & Previous Bills modal ---------- */
      function updateEditModeUI() {
        var isEdit = !!(S.recNo && S.recNo === S.invNo);
        var banner = $("#editBanner");
        if (banner) {
          banner.style.display = isEdit ? "flex" : "none";
          if (isEdit) {
            $("#editBannerNo").textContent = S.invNo;
            $("#editBannerSub").textContent = (S.docType === "quotation" ? "Quotation" : "Tax Invoice") + (S.bName ? " · " + S.bName : "");
          }
        }
        var btnSave = $("#btnSaveDb");
        if (btnSave && !btnSave.classList.contains("ok")) {
          btnSave.textContent = isEdit ? "💾 Update Bill" : "💾 Save to DB";
          btnSave.title = isEdit ? "Update this saved bill in MongoDB" : "Save this bill directly to MongoDB database";
        }
      }

      var btnBannerUpdate = $("#btnBannerUpdate");
      if (btnBannerUpdate) btnBannerUpdate.addEventListener("click", function () { saveToMongoDb(false); });
      var btnBannerNew = $("#btnBannerNew");
      if (btnBannerNew) btnBannerNew.addEventListener("click", function () { startNewInvoice(true); });

      function stateFromDbDoc(doc) {
        var base = defaults();
        if (doc.rawFormState && typeof doc.rawFormState === "object") {
          base = Object.assign(base, doc.rawFormState);
        }
        base.docType = doc.docType || base.docType || "invoice";
        base.invNo = doc.invNo || base.invNo || "";
        base.recNo = doc.invNo || base.recNo || "";
        if (doc.company) {
          if (doc.company.address !== undefined) base.coAddress = doc.company.address;
          if (doc.company.phone !== undefined) base.coPhone = doc.company.phone;
          if (doc.company.email !== undefined) base.coEmail = doc.company.email;
          if (doc.company.gstin !== undefined) base.coGstin = doc.company.gstin;
          if (doc.company.state !== undefined) base.coState = doc.company.state;
          if (doc.company.stateCode !== undefined) base.coStateCode = doc.company.stateCode;
          if (doc.company.bank !== undefined) base.bank = doc.company.bank;
        }
        if (doc.receiver) {
          base.bName = doc.receiver.name != null ? doc.receiver.name : base.bName;
          base.bAddress = doc.receiver.address != null ? doc.receiver.address : base.bAddress;
          base.bState = doc.receiver.state != null ? doc.receiver.state : base.bState;
          base.bStateCode = doc.receiver.stateCode != null ? doc.receiver.stateCode : base.bStateCode;
          base.bGstin = doc.receiver.gstin || base.bGstin || RECEIVER_GSTIN;
        }
        if (doc.consignee) {
          base.same = doc.consignee.same !== undefined ? !!doc.consignee.same : base.same;
          base.cName = doc.consignee.name != null ? doc.consignee.name : base.cName;
          base.cAddress = doc.consignee.address != null ? doc.consignee.address : base.cAddress;
          base.cState = doc.consignee.state != null ? doc.consignee.state : base.cState;
          base.cStateCode = doc.consignee.stateCode != null ? doc.consignee.stateCode : base.cStateCode;
          base.cGstin = doc.consignee.gstin != null ? doc.consignee.gstin : base.cGstin;
        }
        ["transport", "poNo", "poDate", "supplyDate", "supplyTime", "vehicle", "placeOfSupply", "gstOpt", "preparedBy", "dueDate", "payStatus", "taxMode", "roundMode", "terms", "orientation"].forEach(function (k) {
          if (doc[k] !== undefined) base[k] = doc[k];
        });
        if (doc.freight !== undefined) base.freight = doc.freight;
        if (Array.isArray(doc.items) && doc.items.length) {
          base.items = doc.items.map(function (it) {
            return {
              name: it.name || "",
              desc: it.desc || "",
              hsn: it.hsn || "",
              qty: it.qty != null ? it.qty : 1,
              unit: it.unit || "Nos.",
              rate: it.rate != null ? it.rate : 0,
              disc: it.disc != null ? it.disc : 0,
              gst: it.gst != null ? it.gst : 18
            };
          });
        }
        if (!base.items || !base.items.length) base.items = [blankItem()];
        return base;
      }

      function loadInvoiceIntoEditor(doc) {
        S = stateFromDbDoc(doc);
        persist();
        applyDocType();
        syncForm();
        renderItems();
        render();
        updateEditModeUI();
        closePrevBills();
        tab("edit");
        setMsg("Loaded " + (S.docType === "quotation" ? "Quotation " : "Invoice ") + S.invNo + " — edit any fields and click Update Bill.", false);
      }

      var prevBillsList = [];
      var prevTypeFilter = "";

      function openPrevBills() {
        var modal = $("#prevBillsModal");
        if (!modal) return;
        modal.style.display = "flex";
        fetchPrevBills();
      }
      function closePrevBills() {
        var modal = $("#prevBillsModal");
        if (modal) modal.style.display = "none";
      }

      async function fetchPrevBills() {
        var grid = $("#prevBillsGrid");
        if (grid) grid.innerHTML = '<div class="bills-empty">Loading saved bills...</div>';
        try {
          var res = await fetch(window.apiUrl("/api/invoices"));
          var data = await res.json();
          if (data && data.success) {
            prevBillsList = Array.isArray(data.data) ? data.data : [];
            renderPrevBillsGrid();
          } else {
            if (grid) grid.innerHTML = '<div class="bills-empty">Could not load bills: ' + esc((data && data.message) || "Unknown error") + '</div>';
          }
        } catch (e) {
          if (grid) grid.innerHTML = '<div class="bills-empty">Unable to reach server to load previous bills.</div>';
        }
      }

      function statusClass(st) {
        return String(st || "").toLowerCase().replace(/\s+/g, "-");
      }

      function renderPrevBillsGrid() {
        var grid = $("#prevBillsGrid"), cnt = $("#prevBillsCount");
        if (!grid) return;
        var q = String(($("#prevBillsSearch") && $("#prevBillsSearch").value) || "").trim().toLowerCase();
        var st = String(($("#prevBillsStatus") && $("#prevBillsStatus").value) || "").trim();

        var filtered = prevBillsList.filter(function (doc) {
          if (prevTypeFilter && doc.docType !== prevTypeFilter) return false;
          if (st && String(doc.payStatus || "") !== st) return false;
          if (q) {
            var cust = (doc.receiver && doc.receiver.name) || (doc.rawFormState && doc.rawFormState.bName) || "";
            var gstin = (doc.receiver && doc.receiver.gstin) || "";
            var hay = [doc.invNo, cust, doc.poNo, gstin, doc.payStatus].join(" ").toLowerCase();
            if (hay.indexOf(q) < 0) return false;
          }
          return true;
        });

        if (cnt) cnt.textContent = String(filtered.length);
        if (!filtered.length) {
          grid.innerHTML = '<div class="bills-empty">No matching saved bills found.</div>';
          return;
        }

        grid.innerHTML = filtered.map(function (doc) {
          var isQuote = doc.docType === "quotation";
          var cust = (doc.receiver && doc.receiver.name) || (doc.rawFormState && doc.rawFormState.bName) || "Unnamed Customer";
          var total = doc.totals && doc.totals.grandTotal != null ? Number(doc.totals.grandTotal) : 0;
          var itemCount = Array.isArray(doc.items) ? doc.items.length : 0;
          var status = doc.payStatus || (isQuote ? "Open" : "Unpaid");
          var isActive = S.recNo && S.recNo === doc.invNo;
          return '<div class="bill-card' + (isActive ? ' active' : '') + '" data-inv="' + esc(doc.invNo) + '">' +
            '<div class="bill-card-top">' +
              '<div><span class="bill-type' + (isQuote ? ' quote' : '') + '">' + (isQuote ? 'Quotation' : 'Tax Invoice') + '</span>' +
              '<div class="bill-no">' + esc(doc.invNo) + '</div></div>' +
              '<span class="status-badge ' + esc(statusClass(status)) + '">' + esc(status) + '</span>' +
            '</div>' +
            '<div class="bill-cust" title="' + esc(cust) + '">' + esc(cust) + '</div>' +
            '<div class="bill-meta"><span>Date: ' + esc(dmy(doc.supplyDate) || "—") + '</span><span>' + itemCount + ' item' + (itemCount === 1 ? '' : 's') + '</span></div>' +
            '<div class="bill-card-foot">' +
              '<div class="bill-amt">₹ ' + money(total) + '</div>' +
              '<div class="bill-actions">' +
                '<button type="button" class="btn-small btn-edit-bill" data-inv="' + esc(doc.invNo) + '">✏️ Edit</button>' +
                '<button type="button" class="btn-small btn-danger btn-del-bill" data-inv="' + esc(doc.invNo) + '" title="Delete bill">🗑</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join("");
      }

      async function deleteBillFromModal(invNo) {
        if (!confirm("Delete " + invNo + " permanently from MongoDB?")) return;
        try {
          var res = await fetch(window.apiUrl("/api/invoices/" + encodeURIComponent(invNo)), { method: "DELETE" });
          var data = await res.json();
          if (data && data.success) {
            prevBillsList = prevBillsList.filter(function (d) { return d.invNo !== invNo; });
            if (S.recNo === invNo) {
              S.recNo = "";
              persist();
              updateEditModeUI();
            }
            renderPrevBillsGrid();
            setMsg("Deleted " + invNo + " from MongoDB.", false);
          } else {
            setMsg((data && data.message) || "Could not delete bill.", true);
          }
        } catch (e) {
          setMsg("Error deleting bill from server.", true);
        }
      }

      var btnPrevBills = $("#btnPrevBills");
      if (btnPrevBills) btnPrevBills.addEventListener("click", openPrevBills);
      var btnClosePrevBills = $("#btnClosePrevBills");
      if (btnClosePrevBills) btnClosePrevBills.addEventListener("click", closePrevBills);
      var btnRefreshBills = $("#btnRefreshBills");
      if (btnRefreshBills) btnRefreshBills.addEventListener("click", fetchPrevBills);
      var prevBillsModal = $("#prevBillsModal");
      if (prevBillsModal) {
        prevBillsModal.addEventListener("click", function (e) {
          if (e.target === prevBillsModal) closePrevBills();
        });
      }
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && prevBillsModal && prevBillsModal.style.display !== "none") closePrevBills();
      });
      var prevBillsSearch = $("#prevBillsSearch");
      if (prevBillsSearch) prevBillsSearch.addEventListener("input", renderPrevBillsGrid);
      var prevBillsStatus = $("#prevBillsStatus");
      if (prevBillsStatus) prevBillsStatus.addEventListener("change", renderPrevBillsGrid);
      var prevBillsTypeTabs = $("#prevBillsTypeTabs");
      if (prevBillsTypeTabs) {
        prevBillsTypeTabs.addEventListener("click", function (e) {
          var btn = e.target.closest(".pill");
          if (!btn) return;
          prevTypeFilter = btn.getAttribute("data-type") || "";
          $$(".pill", prevBillsTypeTabs).forEach(function (p) { p.classList.toggle("on", p === btn); });
          renderPrevBillsGrid();
        });
      }
      var prevBillsGrid = $("#prevBillsGrid");
      if (prevBillsGrid) {
        prevBillsGrid.addEventListener("click", function (e) {
          var delBtn = e.target.closest(".btn-del-bill");
          if (delBtn) {
            e.stopPropagation();
            deleteBillFromModal(delBtn.getAttribute("data-inv"));
            return;
          }
          var card = e.target.closest(".bill-card");
          if (!card) return;
          var invNo = card.getAttribute("data-inv");
          var doc = prevBillsList.find(function (d) { return d.invNo === invNo; });
          if (doc) loadInvoiceIntoEditor(doc);
        });
      }

      syncNextNoFromDb();
      updateEditModeUI();

      syncForm(); renderItems(); render();
      window.__invoice = { applyDocType: applyDocType, nextInvNo: nextInvNo, saveRecord: saveRecord, saveToMongoDb: saveToMongoDb, openPrevBills: openPrevBills, loadInvoiceIntoEditor: loadInvoiceIntoEditor, compute: compute, amountWords: amountWords, state: function () { return S } };
    })();
