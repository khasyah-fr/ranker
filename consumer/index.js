const kafka = require('kafka-node');
const redis = require('redis');
const winston = require('winston');

// Configuration for retries
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // in milliseconds (3 seconds)
let retries = 0;

// Setup Kafka and Redis clients
const createKafkaConsumer = () => {
  const client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' });
  const consumer = new kafka.Consumer(client, [{ topic: 'transactions', partition: 0 }], { autoCommit: true });
  
  return { consumer, client };
};

// Redis client configuration for Redis v4
const redisClient = redis.createClient({ url: 'redis://redis:6379' });

redisClient.on('error', (err) => {
    logger.error('redis client error ', err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.error('Redis connection error', { error: err });
  }
};

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/log/consumer.log' }),  // log to file
    new winston.transports.Console()  // also log to console
  ]
});

// Function to process a transaction
const processTransaction = async (message) => {
  const transaction = JSON.parse(message.value);
  const stockKey = `stock:${transaction.stock}`;
  const customerKey = `customer:${transaction.customer}`;
  const transactionAmount = Number(transaction.quantity) * Number(transaction.price);

  try {
    if (transaction.type === 'buy') {
      // Increment customer's total buy amount
      await redisClient.hIncrByFloat(customerKey, 'totalBuyAmount', transactionAmount);

      // Increment leaderboard for buys on this stock
      await redisClient.zIncrBy(`leaderboard:buy:${stockKey}`, transactionAmount, transaction.customer);
    } else if (transaction.type === 'sell') {
      // Increment customer's total sell amount
      await redisClient.hIncrByFloat(customerKey, 'totalSellAmount', transactionAmount);

      // Increment leaderboard for sells on this stock
      await redisClient.zIncrBy(`leaderboard:sell:${stockKey}`, transactionAmount, transaction.customer);
    }

    logger.info(`Processed transaction ${stockKey} by ${customerKey} with amount ${transactionAmount}.`);
  } catch (err) {
    logger.error(`Error processing transaction: ${err}`);
  }
};

// Retry mechanism for connecting to Kafka
const attemptConnection = () => {
  const { consumer } = createKafkaConsumer();

  consumer.on('message', (message) => {
    processTransaction(message);
  });

  consumer.on('error', (err) => {
    logger.error('Error with Kafka consumer', { error: err });

    // Retry only for specific errors, like missing topics or transient Kafka issues
    if (retries < MAX_RETRIES) {
      retries++;
      const delay = RETRY_INTERVAL * retries;
      logger.info(`Retrying connection in ${delay}ms... Attempt ${retries} of ${MAX_RETRIES}`);

      setTimeout(() => {
        attemptConnection();  // Attempt to reconnect
      }, delay);
    } else {
      logger.error('Max retries reached.', { error: err });
      process.exit(1);  // Exit if max retries reached
    }
  });
};

// Connect Redis and start Kafka consumer
connectRedis().then(() => {
  attemptConnection();
});
