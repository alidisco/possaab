import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET - fetch all or query
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const barcode = searchParams.get('barcode');

    switch (entity) {
      case 'products': {
        if (id) {
          const product = db.prepare(`
            SELECT p.*, c.name_en as category_name, c.name_ar as category_name_ar
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
          `).get(id);
          const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(id);
          return NextResponse.json({ product, variants });
        }
        let query = `
          SELECT p.*, c.name_en as category_name, c.name_ar as category_name_ar,
          (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count,
          (SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = p.id) as total_stock
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id 
          WHERE p.is_active = 1
        `;
        const params: string[] = [];
        if (search) {
          query += ` AND (p.name_en LIKE ? OR p.name_ar LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY p.created_at DESC';
        const products = db.prepare(query).all(...params);
        return NextResponse.json({ products });
      }

      case 'variants': {
        if (barcode) {
          const variant = db.prepare(`
            SELECT pv.*, p.name_en as product_name, p.name_ar as product_name_ar
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE pv.barcode = ? AND pv.is_active = 1
          `).get(barcode);
          return NextResponse.json({ variant });
        }
        if (search) {
          const variants = db.prepare(`
            SELECT pv.*, p.name_en as product_name, p.name_ar as product_name_ar
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE pv.is_active = 1 AND (
              pv.barcode LIKE ? OR pv.sku LIKE ? OR pv.variant_name LIKE ? 
              OR p.name_en LIKE ? OR p.name_ar LIKE ?
            )
            LIMIT 20
          `).all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
          return NextResponse.json({ variants });
        }
        const variants = db.prepare(`
          SELECT pv.*, p.name_en as product_name, p.name_ar as product_name_ar
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          WHERE pv.is_active = 1
          ORDER BY pv.created_at DESC
        `).all();
        return NextResponse.json({ variants });
      }

      case 'categories': {
        const categories = db.prepare('SELECT * FROM categories ORDER BY name_en').all();
        return NextResponse.json({ categories });
      }

      case 'customers': {
        let query = 'SELECT * FROM customers WHERE 1=1';
        const params: string[] = [];
        const type = searchParams.get('type');
        if (type) {
          query += ' AND type = ?';
          params.push(type);
        }
        if (search) {
          query += ' AND (name LIKE ? OR company_name LIKE ? OR phone LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY created_at DESC';
        const customers = db.prepare(query).all(...params);
        return NextResponse.json({ customers });
      }

      case 'suppliers': {
        const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
        return NextResponse.json({ suppliers });
      }

      case 'invoices': {
        let query = `
          SELECT i.*, u.name as cashier_name, c.name as customer_name, c.company_name
          FROM invoices i
          JOIN users u ON i.cashier_id = u.id
          LEFT JOIN customers c ON i.customer_id = c.id
          WHERE 1=1
        `;
        const params: string[] = [];
        const status = searchParams.get('status');
        if (status) {
          query += ' AND i.payment_status = ?';
          params.push(status);
        }
        query += ' ORDER BY i.created_at DESC LIMIT 100';
        const invoices = db.prepare(query).all(...params);
        return NextResponse.json({ invoices });
      }

      case 'expenses': {
        const expenses = db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC').all();
        return NextResponse.json({ expenses });
      }

      case 'settings': {
        const settings = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
        const settingsObj: Record<string, string> = {};
        settings.forEach((s) => { settingsObj[s.key] = s.value; });
        return NextResponse.json({ settings: settingsObj });
      }

      case 'users': {
        const users = db.prepare(
          'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
        ).all();
        return NextResponse.json({ users });
      }

      case 'dashboard': {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = db.prepare(`
          SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total 
          FROM invoices WHERE date(created_at) = date(?)
        `).get(today) as { count: number; total: number };

        const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number };

        const lowStock = db.prepare(`
          SELECT COUNT(*) as count FROM product_variants 
          WHERE stock_quantity <= min_stock AND is_active = 1
        `).get() as { count: number };

        const pendingPayments = db.prepare(`
          SELECT COUNT(*) as count, COALESCE(SUM(remaining_amount), 0) as total 
          FROM invoices WHERE payment_status IN ('partial', 'unpaid')
        `).get() as { count: number; total: number };

        const recentSales = db.prepare(`
          SELECT i.*, u.name as cashier_name, c.name as customer_name, c.company_name
          FROM invoices i
          JOIN users u ON i.cashier_id = u.id
          LEFT JOIN customers c ON i.customer_id = c.id
          ORDER BY i.created_at DESC LIMIT 10
        `).all();

        const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices').get() as { total: number };

        const lowStockItems = db.prepare(`
          SELECT pv.*, p.name_en as product_name 
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          WHERE pv.stock_quantity <= pv.min_stock AND pv.is_active = 1
          LIMIT 10
        `).all();

        return NextResponse.json({
          todaySales,
          totalProducts: totalProducts.count,
          lowStock: lowStock.count,
          pendingPayments,
          recentSales,
          totalRevenue: totalRevenue.total,
          lowStockItems,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }
  } catch (error) {
    console.error('DB GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST - create
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { entity, data } = body;

    switch (entity) {
      case 'products': {
        const createProductTx = db.transaction(() => {
          // 1. Insert product
          const productResult = db.prepare(`
            INSERT INTO products (name_en, name_ar, category_id, description, has_variants)
            VALUES (?, ?, ?, ?, ?)
          `).run(data.name_en, data.name_ar || null, data.category_id || null, data.description || null, data.has_variants ? 1 : 0);
          
          const productId = productResult.lastInsertRowid;

          // 2. If has_variants is false, automatically create the default variant
          if (!data.has_variants) {
            const retail = parseFloat(data.retail_price) || 0;
            const wholesale = parseFloat(data.wholesale_price) || retail; // Auto fallback to retail price
            const cost = parseFloat(data.cost_price) || 0;
            const stock = parseFloat(data.stock_quantity) || 0;
            const minStock = parseFloat(data.min_stock) || 0;

            const variantResult = db.prepare(`
              INSERT INTO product_variants (product_id, barcode, sku, variant_name, wattage, color, size, unit_type, cost_price, retail_price, wholesale_price, stock_quantity, min_stock)
              VALUES (?, ?, ?, 'Default', null, null, null, ?, ?, ?, ?, ?, ?)
            `).run(
              productId, data.barcode || null, data.sku || null, data.unit_type || 'piece',
              cost, retail, wholesale, stock, minStock
            );

            // Log initial inventory log
            if (stock > 0) {
              db.prepare(`
                INSERT INTO inventory_logs (variant_id, action_type, quantity_before, quantity_after, quantity_change, reference_type, notes, created_by)
                VALUES (?, 'initial', 0, ?, ?, 'manual', 'Initial stock', ?)
              `).run(variantResult.lastInsertRowid, stock, stock, data.created_by || 1);
            }
          }

          return productId;
        });

        const productId = createProductTx();
        return NextResponse.json({ success: true, id: productId });
      }

      case 'variants': {
        const retail = parseFloat(data.retail_price) || 0;
        const wholesale = parseFloat(data.wholesale_price) || retail; // Auto fallback to retail price
        const cost = parseFloat(data.cost_price) || 0;
        const stock = parseFloat(data.stock_quantity) || 0;
        const minStock = parseFloat(data.min_stock) || 0;

        const result = db.prepare(`
          INSERT INTO product_variants (product_id, barcode, sku, variant_name, wattage, color, size, unit_type, cost_price, retail_price, wholesale_price, stock_quantity, min_stock)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          data.product_id, data.barcode || null, data.sku || null, data.variant_name || null,
          data.wattage || null, data.color || null, data.size || null, data.unit_type || 'piece',
          cost, retail, wholesale, stock, minStock
        );

        // Log initial inventory
        if (stock > 0) {
          db.prepare(`
            INSERT INTO inventory_logs (variant_id, action_type, quantity_before, quantity_after, quantity_change, reference_type, notes, created_by)
            VALUES (?, 'initial', 0, ?, ?, 'manual', 'Initial stock', ?)
          `).run(result.lastInsertRowid, stock, stock, data.created_by || 1);
        }

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
      }


      case 'categories': {
        const result = db.prepare(
          'INSERT INTO categories (name_en, name_ar, parent_id) VALUES (?, ?, ?)'
        ).run(data.name_en, data.name_ar || null, data.parent_id || null);
        return NextResponse.json({ success: true, id: result.lastInsertRowid });
      }

      case 'customers': {
        const result = db.prepare(`
          INSERT INTO customers (type, company_name, name, phone, address, notes, credit_limit)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(data.type, data.company_name || null, data.name || null, data.phone || null, data.address || null, data.notes || null, data.credit_limit || null);
        return NextResponse.json({ success: true, id: result.lastInsertRowid });
      }

      case 'suppliers': {
        const result = db.prepare(`
          INSERT INTO suppliers (name, phone, address, notes)
          VALUES (?, ?, ?, ?)
        `).run(data.name, data.phone || null, data.address || null, data.notes || null);
        return NextResponse.json({ success: true, id: result.lastInsertRowid });
      }

      case 'invoices': {
        const createInvoice = db.transaction(() => {
          // Create invoice
          const invoiceResult = db.prepare(`
            INSERT INTO invoices (invoice_number, customer_id, cashier_id, payment_status, currency, exchange_rate, subtotal, discount_amount, discount_type, total_amount, paid_amount, remaining_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            data.invoice_number, data.customer_id || null, data.cashier_id,
            data.payment_status, data.currency, data.exchange_rate,
            data.subtotal, data.discount_amount || 0, data.discount_type || 'fixed',
            data.total_amount, data.paid_amount, data.remaining_amount, data.notes || null
          );

          const invoiceId = invoiceResult.lastInsertRowid;

          // Create invoice items and deduct inventory
          for (const item of data.items) {
            db.prepare(`
              INSERT INTO invoice_items (invoice_id, variant_id, quantity, unit_price, discount_amount, subtotal)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(invoiceId, item.variant_id, item.quantity, item.unit_price, item.discount_amount || 0, item.subtotal);

            // Deduct stock
            const variant = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(item.variant_id) as { stock_quantity: number };
            const newQty = variant.stock_quantity - item.quantity;
            db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newQty, item.variant_id);

            // Log inventory change
            db.prepare(`
              INSERT INTO inventory_logs (variant_id, action_type, quantity_before, quantity_after, quantity_change, reference_type, reference_id, created_by)
              VALUES (?, 'sale', ?, ?, ?, 'invoice', ?, ?)
            `).run(item.variant_id, variant.stock_quantity, newQty, -item.quantity, invoiceId, data.cashier_id);
          }

          // Create payment record
          if (data.paid_amount > 0) {
            db.prepare(`
              INSERT INTO payments (invoice_id, customer_id, amount, payment_method)
              VALUES (?, ?, ?, ?)
            `).run(invoiceId, data.customer_id || null, data.paid_amount, data.payment_method || 'cash');
          }

          // Update customer balance for wholesale
          if (data.customer_id && data.remaining_amount > 0) {
            db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').run(data.remaining_amount, data.customer_id);
          }

          return invoiceId;
        });

        const invoiceId = createInvoice();
        return NextResponse.json({ success: true, id: invoiceId });
      }

      case 'expenses': {
        const result = db.prepare(`
          INSERT INTO expenses (title, amount, category, notes, expense_date, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(data.title, data.amount, data.category, data.notes || null, data.expense_date || new Date().toISOString(), data.created_by || 1);
        return NextResponse.json({ success: true, id: result.lastInsertRowid });
      }

      case 'payments': {
        const createPayment = db.transaction(() => {
          // Create payment
          db.prepare(`
            INSERT INTO payments (invoice_id, customer_id, amount, payment_method, notes)
            VALUES (?, ?, ?, ?, ?)
          `).run(data.invoice_id, data.customer_id || null, data.amount, data.payment_method || 'cash', data.notes || null);

          // Update invoice
          const invoice = db.prepare('SELECT paid_amount, total_amount, customer_id FROM invoices WHERE id = ?').get(data.invoice_id) as { paid_amount: number; total_amount: number; customer_id: number | null };
          const newPaid = invoice.paid_amount + data.amount;
          const remaining = Math.max(0, invoice.total_amount - newPaid);
          const status = remaining <= 0 ? 'paid' : 'partial';

          db.prepare('UPDATE invoices SET paid_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?').run(newPaid, remaining, status, data.invoice_id);

          // Update customer balance
          if (invoice.customer_id) {
            db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?').run(data.amount, invoice.customer_id);
          }
        });

        createPayment();
        return NextResponse.json({ success: true });
      }

      case 'returns': {
        const createReturn = db.transaction(() => {
          const returnResult = db.prepare(`
            INSERT INTO returns (invoice_id, cashier_id, reason, refund_amount, refund_method)
            VALUES (?, ?, ?, ?, ?)
          `).run(data.invoice_id, data.cashier_id, data.reason || null, data.refund_amount, data.refund_method || 'cash');

          const returnId = returnResult.lastInsertRowid;

          for (const item of data.items) {
            db.prepare(`
              INSERT INTO return_items (return_id, invoice_item_id, variant_id, quantity, unit_price, subtotal)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(returnId, item.invoice_item_id, item.variant_id, item.quantity, item.unit_price, item.subtotal);

            // Restore stock
            const variant = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(item.variant_id) as { stock_quantity: number };
            const newQty = variant.stock_quantity + item.quantity;
            db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newQty, item.variant_id);

            // Log inventory
            db.prepare(`
              INSERT INTO inventory_logs (variant_id, action_type, quantity_before, quantity_after, quantity_change, reference_type, reference_id, created_by)
              VALUES (?, 'return', ?, ?, ?, 'return', ?, ?)
            `).run(item.variant_id, variant.stock_quantity, newQty, item.quantity, returnId, data.cashier_id);
          }

          return returnId;
        });

        const returnId = createReturn();
        return NextResponse.json({ success: true, id: returnId });
      }

      case 'purchase_orders': {
        const createPO = db.transaction(() => {
          const poResult = db.prepare(`
            INSERT INTO purchase_orders (supplier_id, total_amount, status, notes)
            VALUES (?, ?, ?, ?)
          `).run(data.supplier_id, data.total_amount, data.status || 'pending', data.notes || null);

          const poId = poResult.lastInsertRowid;

          for (const item of data.items) {
            db.prepare(`
              INSERT INTO purchase_order_items (purchase_order_id, variant_id, quantity, unit_cost, subtotal)
              VALUES (?, ?, ?, ?, ?)
            `).run(poId, item.variant_id, item.quantity, item.unit_cost, item.subtotal);
          }

          // If status is received, update inventory
          if (data.status === 'received') {
            for (const item of data.items) {
              const variant = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(item.variant_id) as { stock_quantity: number };
              const newQty = variant.stock_quantity + item.quantity;
              db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newQty, item.variant_id);

              db.prepare(`
                INSERT INTO inventory_logs (variant_id, action_type, quantity_before, quantity_after, quantity_change, reference_type, reference_id, created_by)
                VALUES (?, 'purchase', ?, ?, ?, 'purchase_order', ?, ?)
              `).run(item.variant_id, variant.stock_quantity, newQty, item.quantity, poId, data.created_by || 1);
            }
          }

          return poId;
        });

        const poId = createPO();
        return NextResponse.json({ success: true, id: poId });
      }

      case 'settings': {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))');
        for (const [key, value] of Object.entries(data)) {
          stmt.run(key, String(value));
        }
        return NextResponse.json({ success: true });
      }

      case 'users': {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync(data.password, 10);
        const result = db.prepare(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
        ).run(data.name, data.email, hash, data.role);
        return NextResponse.json({ success: true, id: result.lastInsertRowid });
      }

      case 'inventory_adjustment': {
        const adjustStock = db.transaction(() => {
          const variant = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(data.variant_id) as { stock_quantity: number };
          const newQty = data.new_quantity;
          const change = newQty - variant.stock_quantity;

          db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newQty, data.variant_id);

          db.prepare(`
            INSERT INTO inventory_logs (variant_id, action_type, quantity_before, quantity_after, quantity_change, reference_type, notes, created_by)
            VALUES (?, 'adjustment', ?, ?, ?, 'manual', ?, ?)
          `).run(data.variant_id, variant.stock_quantity, newQty, change, data.notes || 'Manual adjustment', data.created_by || 1);
        });

        adjustStock();
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }
  } catch (error) {
    console.error('DB POST error:', error);
    return NextResponse.json({ error: 'Database error: ' + (error as Error).message }, { status: 500 });
  }
}

// PUT - update
export async function PUT(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { entity, id, data } = body;

    switch (entity) {
      case 'products': {
        const updateProductTx = db.transaction(() => {
          // 1. Update product table
          db.prepare(`
            UPDATE products SET name_en = ?, name_ar = ?, category_id = ?, description = ?, has_variants = ?
            WHERE id = ?
          `).run(data.name_en, data.name_ar || null, data.category_id || null, data.description || null, data.has_variants ? 1 : 0, id);

          // 2. If has_variants is false, synchronize the default variant
          if (!data.has_variants) {
            const retail = parseFloat(data.retail_price) || 0;
            const wholesale = parseFloat(data.wholesale_price) || retail; // Auto fallback to retail price
            const cost = parseFloat(data.cost_price) || 0;
            const stock = parseFloat(data.stock_quantity) || 0;
            const minStock = parseFloat(data.min_stock) || 0;

            // Check if a variant already exists
            const existingVariant = db.prepare('SELECT id FROM product_variants WHERE product_id = ? LIMIT 1').get(id) as { id: number } | undefined;

            if (existingVariant) {
              db.prepare(`
                UPDATE product_variants 
                SET barcode = ?, sku = ?, cost_price = ?, retail_price = ?, wholesale_price = ?, stock_quantity = ?, min_stock = ?, unit_type = ?
                WHERE id = ?
              `).run(
                data.barcode || null, data.sku || null, cost, retail, wholesale, stock, minStock, data.unit_type || 'piece',
                existingVariant.id
              );
            } else {
              // Create it
              db.prepare(`
                INSERT INTO product_variants (product_id, barcode, sku, variant_name, wattage, color, size, unit_type, cost_price, retail_price, wholesale_price, stock_quantity, min_stock)
                VALUES (?, ?, ?, 'Default', null, null, null, ?, ?, ?, ?, ?, ?)
              `).run(
                id, data.barcode || null, data.sku || null, data.unit_type || 'piece',
                cost, retail, wholesale, stock, minStock
              );
            }
          }
        });

        updateProductTx();
        return NextResponse.json({ success: true });
      }


      case 'variants': {
        const retail = parseFloat(data.retail_price) || 0;
        const wholesale = parseFloat(data.wholesale_price) || retail; // Auto fallback to retail price
        const cost = parseFloat(data.cost_price) || 0;
        const stock = parseFloat(data.stock_quantity) || 0;
        const minStock = parseFloat(data.min_stock) || 0;

        db.prepare(`
          UPDATE product_variants SET barcode = ?, sku = ?, variant_name = ?, wattage = ?, color = ?, size = ?, unit_type = ?, cost_price = ?, retail_price = ?, wholesale_price = ?, stock_quantity = ?, min_stock = ?
          WHERE id = ?
        `).run(
          data.barcode || null, data.sku || null, data.variant_name || null,
          data.wattage || null, data.color || null, data.size || null, data.unit_type || 'piece',
          cost, retail, wholesale, stock, minStock, id
        );
        return NextResponse.json({ success: true });
      }


      case 'categories': {
        db.prepare('UPDATE categories SET name_en = ?, name_ar = ? WHERE id = ?').run(data.name_en, data.name_ar || null, id);
        return NextResponse.json({ success: true });
      }

      case 'customers': {
        db.prepare(`
          UPDATE customers SET type = ?, company_name = ?, name = ?, phone = ?, address = ?, notes = ?, credit_limit = ?
          WHERE id = ?
        `).run(data.type, data.company_name || null, data.name || null, data.phone || null, data.address || null, data.notes || null, data.credit_limit || null, id);
        return NextResponse.json({ success: true });
      }

      case 'suppliers': {
        db.prepare(`
          UPDATE suppliers SET name = ?, phone = ?, address = ?, notes = ?
          WHERE id = ?
        `).run(data.name, data.phone || null, data.address || null, data.notes || null, id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }
  } catch (error) {
    console.error('DB PUT error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const id = searchParams.get('id');

    if (!entity || !id) {
      return NextResponse.json({ error: 'Entity and ID required' }, { status: 400 });
    }

    switch (entity) {
      case 'products':
        db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
        db.prepare('UPDATE product_variants SET is_active = 0 WHERE product_id = ?').run(id);
        break;
      case 'variants':
        db.prepare('UPDATE product_variants SET is_active = 0 WHERE id = ?').run(id);
        break;
      case 'categories':
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        break;
      case 'customers':
        db.prepare('DELETE FROM customers WHERE id = ?').run(id);
        break;
      case 'suppliers':
        db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
        break;
      case 'expenses':
        db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DB DELETE error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
