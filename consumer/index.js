const kafka = require('kafka-node')
const redis = require('redis')

const client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' })
const consumer = new kafka.Consumer(client, [{ topic: 'transactions', partition: 0 }], { autoCommit: true })

const redisClient = redis.createClient({ host: 'redis', port: 6379 })

consumer.on('message', (message) => {
    const transaction = JSON.parse(message.value)
    const stockKey = `stock:${transaction.stock}`
    const customerKey = `customer:${transaction.customer}`
    const transactionAmount = Number(transaction.quantity) * Number(transaction.price)

    if (transaction.type === 'buy') {
        redisClient.hIncrBy(stockKey, 'totalBuyAmount', transactionAmount)
        redisClient.hIncrBy(customerKey, 'totalBuyAmount', transactionAmount)
    } else if (transaction.type === 'sell') {
        redisClient.hIncrBy(stockKey, 'totalSellAmount', transactionAmount)
        redisClient.hIncrBy(customerKey, 'totalSellAmount', transactionAmount)
    }

    console.log('Processed transaction: ', transaction)
})

consumer.on('error', (err) => {
    console.error('Error with Kafka consumer: ', err)
})