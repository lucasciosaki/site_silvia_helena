const sequelize = require('../config/database')
require('../models/Usuario')
require('../models/Horario')
require('../models/Agendamento')

async function sync() {
    try {
        await sequelize.authenticate()
        console.log('Conexão estabelecida com sucesso.')
        
        await sequelize.sync({ alter: true })
        console.log('Tabelas sincronizadas com sucesso.')
        
        process.exit(0)
    } catch (error) {
        console.error('Erro ao sincronizar:', error)
        process.exit(1)
    }
}

sync()
