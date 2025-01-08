class ExpiredWarrantyError extends Error {
    constructor(warrantyEnd) {
        super('Warranty has expired');
        this.name = 'ExpiredWarrantyError';
        this.code = 'WARRANTY_EXPIRED';
        this.warrantyEnd = warrantyEnd;
    }
}

module.exports = { ExpiredWarrantyError };