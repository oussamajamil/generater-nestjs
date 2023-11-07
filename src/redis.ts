import Redis from 'ioredis';

const redisStore = new Redis({
  host: 'localhost',
  port: 6379,
});

export default redisStore;
