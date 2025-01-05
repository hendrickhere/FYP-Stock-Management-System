describe('Setup Tests', () => {
  it('should have proper test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});