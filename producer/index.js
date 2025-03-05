const kafka = require('kafka-node')
const faker = require('faker')

const client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' })
const producer = new kafka.Producer(client)

const createRandomTransaction = () => {
    return {
        type: faker.random.arrayElement(['buy', 'sell']),
        stock: faker.random.arrayElement(['ASII', 'BBCA', 'BBNI', 'BBRI', 'BMRI', 'GOTO', 'TLKM', 'UNTR']),
        customer: faker.random.arrayElement(['Andi', 'Budi', 'Chika', 'Derel', 'Elnic', 'Fitra', 'Gilang', 'Hamdan', 'Ilham', 'Jeremy', 'Khresna', 'Lewy', 'Mahmud', 'Nadia', 'Oppenheimer']),
        quantity: faker.random.number({min: 1, max: 100}),
        price: faker.finance.amount(1, 1000, 2),
        timestamp: new Date().toISOString(),
    }
}

producer.on('ready', () => {
    setInterval(() => {
        const transaction = createRandomTransaction()
        producer.send([{ topic: 'transactions', messages: JSON.stringify(transaction) }], (err, data) => {
            if (err) {
                console.error('Error sending message: ', err)
            } else {
                console.log('Transaction sent: ', transaction)
            }
        })
    }, 1000)
})

producer.on('error', (err) => {
    console.error('Error with Kafka producer: ', err)
})