const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const sequelize = require('./config/database')

// importa os models pra o Sequelize registrar as tabelas
require('./models/Usuario')
require('./models/Horario')
require('./models/Agendamento')
const Usuario = require('./models/Usuario')
const Horario = require('./models/Horario')
const Agendamento = require('./models/Agendamento')

// associações
Usuario.hasMany(Agendamento, { foreignKey: 'usuarioId' })
Agendamento.belongsTo(Usuario, { foreignKey: 'usuarioId' })

Horario.hasMany(Agendamento, { foreignKey: 'horarioId' })
Agendamento.belongsTo(Horario, { foreignKey: 'horarioId' })

// importa as rotas
const authRoutes   = require('./routes/auth')
const agendaRoutes = require('./routes/agenda')
const admRoutes    = require('./routes/adm')

const app = express()

app.use(cors())
app.use(express.json())

// serve os arquivos estáticos (seus HTMLs, CSS, JS)
app.use(express.static(path.join(__dirname)))

// rotas da API
app.use('/api/auth',   authRoutes)
app.use('/api/agenda', agendaRoutes)
app.use('/api/adm',    admRoutes)

// sincroniza os models com o banco e sobe o servidor
const PORT = process.env.PORT || 3000

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Banco conectado e tabelas sincronizadas.')
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`)
        })
    })
    .catch(err => {
        console.error('Erro ao conectar no banco:', err)
    })