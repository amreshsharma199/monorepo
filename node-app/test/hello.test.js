const request = require('supertest');
const app = require('../index');

describe('GET /hello', () => {
  it('should return greeting message', async () => {
    const res = await request(app).get('/hello');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Hello from Node App!');
  });
});
