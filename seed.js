'use strict';

const dotenv = require('dotenv');
const { Pool } = require('pg');
const { computeLineValues } = require('./compute');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL not found in .env file');
  process.exit(1);
}

const pool = new Pool({ connectionString });

const mockOrders = [
  {
    gtn_no: 12345678,
    customer_code: 'CUST001',
    user_id: 45,
    status: 'P',
    remarks: 'First test order - urgent delivery',
    lines: [
      {
        item_code: 'ITEM001',
        item_name: 'Blue Shirt - Medium',
        pol_code: 'PROMO10',
        policy2: '10% Off Promotion',
        pol_rate: 14.0,
        so_qty: 10,
        so_rate: 15.5,
        approved_qty: 8,
        approved_rate: 15.0
      },
      {
        item_code: 'ITEM002',
        item_name: 'Red Pants - Large',
        pol_code: null,
        policy2: null,
        pol_rate: null,
        so_qty: 5,
        so_rate: 25.0,
        approved_qty: 5,
        approved_rate: 25.0
      },
      {
        item_code: 'ITEM003',
        item_name: 'Black Belt - One Size',
        pol_code: 'ACC15',
        policy2: 'Accessory Discount',
        pol_rate: 12.75,
        so_qty: 3,
        so_rate: 15.0,
        approved_qty: 3,
        approved_rate: 15.0
      }
    ]
  },
  {
    gtn_no: 87654321,
    customer_code: 'CUST002',
    user_id: 50,
    status: 'D',
    remarks: 'Delivered order - customer satisfied',
    lines: [
      {
        item_code: 'ITEM004',
        item_name: 'Green Jacket - XL',
        pol_code: 'BULK20',
        policy2: 'Bulk Discount 20%',
        pol_rate: 36.6,
        so_qty: 20,
        so_rate: 45.75,
        approved_qty: 20,
        approved_rate: 45.75
      },
      {
        item_code: 'ITEM005',
        item_name: 'Winter Boots - Size 10',
        pol_code: 'SEASONAL',
        policy2: 'Seasonal Sale',
        pol_rate: 55.0,
        so_qty: 12,
        so_rate: 65.0,
        approved_qty: 12,
        approved_rate: 65.0
      }
    ]
  },
  {
    gtn_no: 11223344,
    customer_code: 'CUST003',
    user_id: 45,
    status: 'R',
    remarks: 'Rejected order - pricing issue, awaiting approval',
    lines: [
      {
        item_code: 'ITEM006',
        item_name: 'White Sneakers - Size 9',
        pol_code: null,
        policy2: null,
        pol_rate: null,
        so_qty: 15,
        so_rate: 60.0,
        approved_qty: null,
        approved_rate: null
      },
      {
        item_code: 'ITEM007',
        item_name: 'Athletic Socks - Pack of 6',
        pol_code: null,
        policy2: null,
        pol_rate: null,
        so_qty: 8,
        so_rate: 12.5,
        approved_qty: null,
        approved_rate: null
      }
    ]
  },
  {
    gtn_no: 23456789,
    customer_code: 'CUST004',
    user_id: 52,
    status: 'P',
    remarks: 'Large corporate order - multiple items',
    lines: [
      {
        item_code: 'ITEM008',
        item_name: 'Business Suit - Navy Blue',
        pol_code: 'CORP25',
        policy2: 'Corporate Discount 25%',
        pol_rate: 225.0,
        so_qty: 30,
        so_rate: 300.0,
        approved_qty: 30,
        approved_rate: 300.0
      },
      {
        item_code: 'ITEM009',
        item_name: 'Dress Shirt - White',
        pol_code: 'CORP25',
        policy2: 'Corporate Discount 25%',
        pol_rate: 37.5,
        so_qty: 50,
        so_rate: 50.0,
        approved_qty: 50,
        approved_rate: 50.0
      },
      {
        item_code: 'ITEM010',
        item_name: 'Tie - Red Striped',
        pol_code: 'CORP25',
        policy2: 'Corporate Discount 25%',
        pol_rate: 22.5,
        so_qty: 30,
        so_rate: 30.0,
        approved_qty: 30,
        approved_rate: 30.0
      },
      {
        item_code: 'ITEM011',
        item_name: 'Leather Shoes - Black',
        pol_code: 'CORP25',
        policy2: 'Corporate Discount 25%',
        pol_rate: 112.5,
        so_qty: 30,
        so_rate: 150.0,
        approved_qty: 30,
        approved_rate: 150.0
      }
    ]
  },
  {
    gtn_no: 34567890,
    customer_code: 'CUST005',
    user_id: 48,
    status: 'D',
    remarks: 'Retail store order - fashion items',
    lines: [
      {
        item_code: 'ITEM012',
        item_name: 'Summer Dress - Floral',
        pol_code: 'SUMMER2024',
        policy2: 'Summer Collection',
        pol_rate: 42.0,
        so_qty: 25,
        so_rate: 56.0,
        approved_qty: 25,
        approved_rate: 56.0
      },
      {
        item_code: 'ITEM013',
        item_name: 'Sandals - Beige',
        pol_code: 'SUMMER2024',
        policy2: 'Summer Collection',
        pol_rate: 28.0,
        so_qty: 20,
        so_rate: 35.0,
        approved_qty: 20,
        approved_rate: 35.0
      },
      {
        item_code: 'ITEM014',
        item_name: 'Sun Hat - Wide Brim',
        pol_code: 'SUMMER2024',
        policy2: 'Summer Collection',
        pol_rate: 18.0,
        so_qty: 15,
        so_rate: 24.0,
        approved_qty: 15,
        approved_rate: 24.0
      }
    ]
  },
  {
    gtn_no: 45678901,
    customer_code: 'CUST001',
    user_id: 45,
    status: 'P',
    remarks: 'Repeat customer - second order this month',
    lines: [
      {
        item_code: 'ITEM015',
        item_name: 'Jeans - Dark Blue',
        pol_code: 'LOYALTY',
        policy2: 'Loyalty Customer Discount',
        pol_rate: 40.0,
        so_qty: 12,
        so_rate: 50.0,
        approved_qty: 12,
        approved_rate: 50.0
      },
      {
        item_code: 'ITEM016',
        item_name: 'T-Shirt - Cotton White',
        pol_code: 'LOYALTY',
        policy2: 'Loyalty Customer Discount',
        pol_rate: 9.0,
        so_qty: 20,
        so_rate: 12.0,
        approved_qty: 20,
        approved_rate: 12.0
      },
      {
        item_code: 'ITEM017',
        item_name: 'Hoodie - Gray',
        pol_code: 'LOYALTY',
        policy2: 'Loyalty Customer Discount',
        pol_rate: 36.0,
        so_qty: 8,
        so_rate: 45.0,
        approved_qty: 8,
        approved_rate: 45.0
      },
      {
        item_code: 'ITEM018',
        item_name: 'Baseball Cap - Black',
        pol_code: null,
        policy2: null,
        pol_rate: null,
        so_qty: 5,
        so_rate: 18.0,
        approved_qty: 5,
        approved_rate: 18.0
      }
    ]
  },
  {
    gtn_no: 56789012,
    customer_code: 'CUST006',
    user_id: 55,
    status: 'R',
    remarks: 'Rejected - credit limit exceeded',
    lines: [
      {
        item_code: 'ITEM019',
        item_name: 'Designer Handbag - Leather',
        pol_code: null,
        policy2: null,
        pol_rate: null,
        so_qty: 10,
        so_rate: 250.0,
        approved_qty: null,
        approved_rate: null
      },
      {
        item_code: 'ITEM020',
        item_name: 'Wristwatch - Luxury',
        pol_code: null,
        policy2: null,
        pol_rate: null,
        so_qty: 5,
        so_rate: 500.0,
        approved_qty: null,
        approved_rate: null
      }
    ]
  },
  {
    gtn_no: 67890123,
    customer_code: 'CUST007',
    user_id: 46,
    status: 'D',
    remarks: 'Bulk order - wholesale pricing applied',
    lines: [
      {
        item_code: 'ITEM021',
        item_name: 'Polo Shirt - Various Colors',
        pol_code: 'WHOLESALE',
        policy2: 'Wholesale Pricing',
        pol_rate: 18.0,
        so_qty: 100,
        so_rate: 24.0,
        approved_qty: 100,
        approved_rate: 24.0
      },
      {
        item_code: 'ITEM022',
        item_name: 'Cargo Shorts - Khaki',
        pol_code: 'WHOLESALE',
        policy2: 'Wholesale Pricing',
        pol_rate: 28.0,
        so_qty: 75,
        so_rate: 35.0,
        approved_qty: 75,
        approved_rate: 35.0
      },
      {
        item_code: 'ITEM023',
        item_name: 'Backpack - Outdoor',
        pol_code: 'WHOLESALE',
        policy2: 'Wholesale Pricing',
        pol_rate: 40.0,
        so_qty: 50,
        so_rate: 50.0,
        approved_qty: 50,
        approved_rate: 50.0
      },
      {
        item_code: 'ITEM024',
        item_name: 'Water Bottle - Insulated',
        pol_code: 'WHOLESALE',
        policy2: 'Wholesale Pricing',
        pol_rate: 12.0,
        so_qty: 150,
        so_rate: 16.0,
        approved_qty: 150,
        approved_rate: 16.0
      },
      {
        item_code: 'ITEM025',
        item_name: 'Baseball Cap - Various Colors',
        pol_code: 'WHOLESALE',
        policy2: 'Wholesale Pricing',
        pol_rate: 9.0,
        so_qty: 200,
        so_rate: 12.0,
        approved_qty: 200,
        approved_rate: 12.0
      }
    ]
  },
  {
    gtn_no: 78901234,
    customer_code: 'CUST008',
    user_id: 47,
    status: 'P',
    remarks: 'New customer - introductory order',
    lines: [
      {
        item_code: 'ITEM026',
        item_name: 'Running Shoes - Size 11',
        pol_code: 'NEWCUST',
        policy2: 'New Customer Welcome',
        pol_rate: 67.5,
        so_qty: 2,
        so_rate: 75.0,
        approved_qty: 2,
        approved_rate: 75.0
      },
      {
        item_code: 'ITEM027',
        item_name: 'Sports Shorts - Athletic',
        pol_code: 'NEWCUST',
        policy2: 'New Customer Welcome',
        pol_rate: 22.5,
        so_qty: 4,
        so_rate: 25.0,
        approved_qty: 4,
        approved_rate: 25.0
      },
      {
        item_code: 'ITEM028',
        item_name: 'Tank Top - Moisture Wicking',
        pol_code: 'NEWCUST',
        policy2: 'New Customer Welcome',
        pol_rate: 13.5,
        so_qty: 6,
        so_rate: 15.0,
        approved_qty: 6,
        approved_rate: 15.0
      }
    ]
  },
  {
    gtn_no: 89012345,
    customer_code: 'CUST002',
    user_id: 50,
    status: 'D',
    remarks: 'Customer reorder - same items as previous order',
    lines: [
      {
        item_code: 'ITEM004',
        item_name: 'Green Jacket - XL',
        pol_code: 'BULK20',
        policy2: 'Bulk Discount 20%',
        pol_rate: 36.6,
        so_qty: 15,
        so_rate: 45.75,
        approved_qty: 15,
        approved_rate: 45.75
      },
      {
        item_code: 'ITEM029',
        item_name: 'Scarf - Cashmere',
        pol_code: 'BULK20',
        policy2: 'Bulk Discount 20%',
        pol_rate: 48.0,
        so_qty: 10,
        so_rate: 60.0,
        approved_qty: 10,
        approved_rate: 60.0
      },
      {
        item_code: 'ITEM030',
        item_name: 'Gloves - Leather',
        pol_code: 'BULK20',
        policy2: 'Bulk Discount 20%',
        pol_rate: 32.0,
        so_qty: 10,
        so_rate: 40.0,
        approved_qty: 10,
        approved_rate: 40.0
      }
    ]
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('Clearing existing data...');
    await client.query('DELETE FROM so2');
    await client.query('DELETE FROM sol');
    
    console.log('Inserting mock data...');
    
    for (const order of mockOrders) {
      await client.query('BEGIN');
      
      // Insert order header
      const headerResult = await client.query(
        `INSERT INTO sol (gtn_no, customer_code, user_id, status, remarks)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [order.gtn_no, order.customer_code, order.user_id, order.status, order.remarks]
      );
      const orderId = headerResult.rows[0].id;
      
      // Insert order lines
      for (const line of order.lines) {
        const { so_val, approved_val } = computeLineValues(line);
        await client.query(
          `INSERT INTO so2 (
            so_id, gtn_no, item_code, item_name, pol_code, policy2,
            so_qty, pol_rate, so_rate, approved_qty, approved_rate, so_val, approved_val
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            orderId,
            order.gtn_no,
            line.item_code,
            line.item_name,
            line.pol_code,
            line.policy2,
            line.so_qty,
            line.pol_rate || null,
            line.so_rate,
            line.approved_qty,
            line.approved_rate,
            so_val,
            approved_val
          ]
        );
      }
      
      await client.query('COMMIT');
      console.log(`✅ Inserted order ${orderId} (${order.customer_code})`);
    }
    
    console.log('\n✅ Mock data seeded successfully!');
    process.exit(0);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();

