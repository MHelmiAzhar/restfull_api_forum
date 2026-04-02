/* istanbul ignore file */

/**
 * Rate limiter middleware untuk resource /threads
 * Batasan: 90 request per menit per IP address
 * Mencegah DDoS attack pada endpoint threads
 */

const createRateLimiter = () => {
  // Simple in-memory rate limiter
  // Untuk production, gunakan Redis untuk distributed systems
  const clients = {};
  const REQUESTS_PER_MINUTE = 90;
  const MINUTE_IN_MS = 60 * 1000;

  const rateLimiter = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!clients[clientIp]) {
      clients[clientIp] = [];
    }

    // Hapus request lama (lebih dari 1 menit)
    clients[clientIp] = clients[clientIp].filter(
      (timestamp) => now - timestamp < MINUTE_IN_MS,
    );

    // Cek apakah limit tercapai
    if (clients[clientIp].length >= REQUESTS_PER_MINUTE) {
      return res.status(429).json({
        status: 'fail',
        message: 'Terlalu banyak permintaan. Batasan 90 request per menit.',
      });
    }

    // Tambahkan request timestamp
    clients[clientIp].push(now);
    next();
  };

  return rateLimiter;
};

export default createRateLimiter;
