const { Sequelize } = require('sequelize')
const pg = require('pg') // Importação explícita para a Vercel
require('dotenv').config()

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectModule: pg, // Força o uso do pacote pg instalado
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASS,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'postgres',
            dialectModule: pg, // Também adicionamos aqui para consistência
            logging: false
        }
    )

module.exports = sequelize