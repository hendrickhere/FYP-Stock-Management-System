'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      customer_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      customer_uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_designation: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "Mr",
      },
      customer_contact: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_company: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.createTable('appointments', {
      appointment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      appointment_sn: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers', 
          key: 'customer_id',
        },
        onDelete: 'CASCADE', 
        onUpdate: 'CASCADE',
      },
      service_type: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      appointment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      time_slot: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      technician: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    await queryInterface.createTable('vendors', {
      vendor_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      vendor_sn: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      vendor_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      contact_person: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      }
    });
    await queryInterface.createTable('products', {
      product_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        unique: true,
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sku_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dimensions: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dimensions_unit: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      manufacturer: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      weight_unit: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_expiry_goods: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.createTable('sales_orders', {
      sales_order_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      sales_order_uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        unique: true,
        allowNull: false
      },
      order_date_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      expected_shipment_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      payment_terms: {
        type: Sequelize.STRING,
        allowNull: true
      },
      delivery_method: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
    await queryInterface.createTable('sales_order_items', {
      sales_order_item_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      sales_order_item_uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        unique: true,
        allowNull: false
      },
      sales_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sales_orders',
          key: 'sales_order_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      status_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
    await queryInterface.createTable('purchase_orders', {
      purchase_order_id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vendors', // Assuming the vendor table is named 'vendors'
          key: 'vendor_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      order_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      total_amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      delivered_date: {
        type: Sequelize.DATE,
        allowNull: true // Nullable for orders not yet delivered
      },
    });
    await queryInterface.createTable('purchase_order_items', {
      purchase_order_item_id: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      purchase_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'purchase_orders', // Assuming the table name for purchase orders
          key: 'purchase_order_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products', // Assuming the table name for products
          key: 'product_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tax: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      discount: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      total_price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
    });
    await queryInterface.createTable('organizations', {
      organization_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      organization_uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        unique: true,
        allowNull: false,
      },
      organization_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      organization_contact: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.createTable('invoices', {
      invoice_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      sales_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sales_orders',
          key: 'sales_order_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date_issued: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    
    await queryInterface.createTable('receipts', {
      receipt_id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      sales_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sales_orders', // Make sure the table is named 'sales_orders'
          key: 'sales_order_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date_issued: {
        type: Sequelize.DATE,
        allowNull: false
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
   
    await queryInterface.createTable('shipments', {
      shipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      sales_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sales_orders',
          key: 'sales_order_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tracking_number: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: ""
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
    
    await queryInterface.createTable('warranties', {
      warranty_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products', // Table that `product_id` is referencing
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      warranty_type: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      terms: {
        type: Sequelize.STRING(255),
        allowNull: true
      }
    });
    await queryInterface.createTable('warranty_claims', {
      claim_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      warranty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'warranties', // Table that `warranty_id` is referencing
          key: 'warranty_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date_of_claim: {
        type: Sequelize.DATE,
        allowNull: false
      },
      claim_status: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      resolution_details: {
        type: Sequelize.STRING(255),
        allowNull: false
      }
    });
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('appointments');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('organizations');
    await queryInterface.dropTable('purchase_order_items');
    await queryInterface.dropTable('purchase_orders');
    await queryInterface.dropTable('receipts');
    await queryInterface.dropTable('sales_orders');
    await queryInterface.dropTable('sales_order_items');
    await queryInterface.dropTable('shipments');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('vendors');
    await queryInterface.dropTable('warranty_claims');
    await queryInterface.dropTable('warranties');
  }
};
