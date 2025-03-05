const kafka = require('kafka-node')
const { faker } = require('@faker-js/faker')  // Updated import

const client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' })
const producer = new kafka.Producer(client)

const createRandomTransaction = () => {
    return {
        type: faker.helpers.arrayElement(['buy', 'sell']),
        stock: faker.helpers.arrayElement(['ASII', 'BBCA', 'BBNI', 'BBRI', 'BMRI', 'GOTO', 'TLKM', 'UNTR']),
        customer: faker.helpers.arrayElement(['Andi', 'Budi', 'Chika', 'Derel', 'Elnic', 'Fitra', 'Gilang', 'Hamdan', 'Ilham', 'Jeremy', 'Khresna', 'Lewy', 'Mahmud', 'Nadia', 'Oppenheimer']),
        quantity: faker.number.int({ min: 1, max: 100 }), // Updated method
        price: faker.number.int({ min: 1000, max: 1000000, multipleOf: 1000}),
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
    }, 5000)
})

producer.on('error', (err) => {
    console.error('Error with Kafka producer: ', err)
})