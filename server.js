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

// Middleware
app.use(cors())
app.use(express.json())

// Log de depuração básico (aparecerá nos logs da Vercel)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

// serve os arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)))

// rotas da API
app.use('/api/auth',   authRoutes)
app.use('/api/agenda', agendaRoutes)
app.use('/api/adm',    admRoutes)

// Rota de health-check para testar se a API está respondendo
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' })
})

// Exporta o app para a Vercel
module.exports = app

// Se for execução local, sobe o servidor normalmente
if (require.main === module) {
    const PORT = process.env.PORT || 3000
    sequelize.authenticate()
        .then(() => {
            console.log('--- CONECTADO AO BANCO ---')
            app.listen(PORT, () => {
                console.log(`Servidor local rodando em http://localhost:${PORT}`)
            })
        })
        .catch(err => {
            console.error('Erro ao conectar no banco localmente:', err)
        })
}