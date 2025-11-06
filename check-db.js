'use strict';

const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL not found in .env file');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function checkDatabase() {
  try {
    console.log('📊 Database Contents:\n');
    
    // Check orders
    const ordersResult = await pool.query(
      'SELECT id, gtn_no, customer_code, user_id, status, e_date, remarks FROM sol ORDER BY id'
    );
    
    console.log(`📦 Orders (${ordersResult.rows.length}):`);
    if (ordersResult.rows.length === 0) {
      console.log('   No orders found. Run: npm run seed\n');
    } else {
      ordersResult.rows.forEach(order => {
        console.log(`   ID: ${order.id} | Customer: ${order.customer_code} | Status: ${order.status} | User: ${order.user_id}`);
      });
      console.log('');
    }
    
    // Check order lines
    const linesResult = await pool.query(
      `SELECT so2.id, so2.so_id, so2.item_code, so2.item_name, 
              so2.so_qty, so2.so_rate, so2.so_val,
              so2.approved_qty, so2.approved_rate, so2.approved_val
       FROM so2 ORDER BY so2.so_id, so2.id`
    );
    
    console.log(`📋 Order Lines (${linesResult.rows.length}):`);
    if (linesResult.rows.length === 0) {
      console.log('   No lines found. Run: npm run seed\n');
    } else {
      linesResult.rows.forEach(line => {
        console.log(`   Line ID: ${line.id} | Order ID: ${line.so_id} | Item: ${line.item_code} (${line.item_name})`);
        console.log(`            Qty: ${line.so_qty} @ $${line.so_rate} = $${line.so_val}`);
        if (line.approved_qty) {
          console.log(`            Approved: ${line.approved_qty} @ $${line.approved_rate} = $${line.approved_val}`);
        }
        console.log('');
      });
    }
    
    // Summary
    const summaryResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT sol.id) as total_orders,
        COUNT(so2.id) as total_lines,
        SUM(so2.so_val) as total_so_val,
        SUM(so2.approved_val) as total_approved_val
       FROM sol
       LEFT JOIN so2 ON sol.id = so2.so_id`
    );
    
    const summary = summaryResult.rows[0];
    console.log('📈 Summary:');
    console.log(`   Total Orders: ${summary.total_orders}`);
    console.log(`   Total Lines: ${summary.total_lines}`);
    console.log(`   Total SO Value: $${summary.total_so_val || 0}`);
    console.log(`   Total Approved Value: $${summary.total_approved_val || 0}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking database:', err.message);
    if (err.code === '42P01') {
      console.error('\nTables do not exist. Run: npm run setup-db');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabase();


