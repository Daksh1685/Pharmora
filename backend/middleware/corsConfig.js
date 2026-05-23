const cors = require('cors');

const getProductionOrigins = () => {
  const raw = process.env.CORS_ORIGIN || '';
  if (!raw || raw === '*') return '*';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
};

const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production') {
      const devOrigins = [
        'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
        'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005',
        'http://127.0.0.1:3000',
      ];
      if (!origin || devOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    }

    const allowed = getProductionOrigins();
    if (allowed === '*' || !origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
