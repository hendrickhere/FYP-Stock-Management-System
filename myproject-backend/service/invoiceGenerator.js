// src/services/invoiceGenerator.js
const puppeteer = require('puppeteer');
const path = require('path');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const SalesService = require("./salesService");


class InvoiceGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '../templates/invoice.html');
    }

    async generateInvoice(salesOrderUuid) {
        try {
            // 1. Fetch all required data
            const salesOrder = await SalesService.getSalesOrderByUUID(salesOrderUuid);
            const preparedData = {
                invoice: {
                    number: salesOrder.sales_order_uuid,
                    date: this.formatDate(salesOrder.order_date_time),
                    dueDate: this.formatDate(salesOrder.expected_shipment_date),
                    paymentTerms: salesOrder.payment_terms,
                    deliveryMethod: salesOrder.delivery_method
                  },
                  company: {
                    name: salesOrder.Organization.organization_name,
                    address: salesOrder.Organization.organization_address,
                    phone: salesOrder.Organization.organization_contact,
                    email: salesOrder.Organization.organization_email,
                    account_number: salesOrder.Organization.organization_account_number,
                    bank: salesOrder.Organization.organization_bank, 
                  },
                  customer: {
                    name: salesOrder.Customer.customer_name,
                    company: salesOrder.Customer.customer_company,
                    email: salesOrder.Customer.customer_email,
                    phone: salesOrder.Customer.customer_contact,
                    billingAddress: salesOrder.Customer.billing_address,
                    shippingAddress: salesOrder.Customer.shipping_address
                  },
                  items: salesOrder.items.map(item => ({
                    description: item.Product.product_name,
                    quantity: item.quantity,
                    unitPrice: this.formatCurrency(item.price),
                    amount: this.formatCurrency(item.price * item.quantity),
                    discountedPrice: item.discounted_price ?
                      this.formatCurrency(item.discounted_price) : null
                  })),
                  summary: {
                    subtotal: this.formatCurrency(salesOrder.subtotal),
                    discountAmount: this.formatCurrency(salesOrder.discount_amount),
                    totalTax: this.formatCurrency(salesOrder.total_tax),
                    grandTotal: this.formatCurrency(salesOrder.grand_total)
                  }
            } 
            // 2. Prepare template
            const template = await this.prepareTemplate();
            
            // 3. Generate HTML
            const html = await this.generateHTML(template, preparedData);
            
            // 4. Convert to PDF
            const pdf = await this.convertToPDF(html);
            
            return pdf;
        } catch (error) {
            console.error('Error generating invoice:', error);
            throw error;
        }
    }
    
    async prepareTemplate() {
        const templateHtml = await fs.readFile(this.templatePath, 'utf-8');
        return handlebars.compile(templateHtml);
    }

    async generateHTML(template, data) {
        return template(data);
    }

    async convertToPDF(html) {
        let browser;
        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--single-process'
                ],
                executablePath: '/usr/bin/google-chrome'
            });
            const page = await browser.newPage();
            
            // Set viewport size for consistent rendering
            await page.setViewport({
                width: 1200,
                height: 800,
                deviceScaleFactor: 1,
            });
            
            // Set content with proper wait conditions
            await page.setContent(html, { 
                waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
                timeout: 30000
            });
    
            // Ensure all content is properly rendered
            await page.evaluate(() => document.fonts.ready);
            
            // Generate PDF with proper settings
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                },
                preferCSSPageSize: true,
                displayHeaderFooter: false
            });
    
            return pdf;
        } catch (error) {
            console.error('Error converting to PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close().catch(console.error);
            }
        }
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

module.exports = new InvoiceGenerator();

// Example usage in your route handler:
/*
app.get('/generate-invoice/:salesOrderUuid', async (req, res) => {
    try {
        const pdf = await invoiceGenerator.generateInvoice(req.params.salesOrderUuid);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
        res.send(pdf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
*/