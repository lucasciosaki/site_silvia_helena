const express = require('express')
const router = express.Router()
const Horario = require('../models/Horario')
const Agendamento = require('../models/Agendamento')
const Usuario = require('../models/Usuario')
const autenticar = require('../middlewares/autenticar')
const multer = require('multer')
const nodemailer = require('nodemailer')
const path = require('path')

// configuração do multer (salva os mapas na pasta /uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const nome = Date.now() + path.extname(file.originalname)
        cb(null, nome)
    }
})
const upload = multer({ storage })

// middleware que verifica se é admin
const apenasAdmin = (req, res, next) => {
    if (!req.usuario.isAdmin) {
        return res.status(403).json({ erro: 'Acesso restrito ao administrador.' })
    }
    next()
}

// POST /api/adm/horario — abre um novo horário na agenda
router.post('/horario', autenticar, apenasAdmin, async (req, res) => {
    const { data, hora } = req.body

    try {
        const horario = await Horario.create({ data, hora })
        res.status(201).json({ mensagem: 'Horário criado.', horario })
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao criar horário.', detalhe: err.message })
    }
})

// DELETE /api/adm/horario/:id — remove um horário
router.delete('/horario/:id', autenticar, apenasAdmin, async (req, res) => {
    try {
        const horario = await Horario.findByPk(req.params.id)

        if (!horario) {
            return res.status(404).json({ erro: 'Horário não encontrado.' })
        }

        await horario.destroy()
        res.json({ mensagem: 'Horário removido.' })
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao remover horário.', detalhe: err.message })
    }
})

// GET /api/adm/agendamentos — lista todos os agendamentos
router.get('/agendamentos', autenticar, apenasAdmin, async (req, res) => {
    try {
        const agendamentos = await Agendamento.findAll({
            include: [
                { model: Usuario, attributes: ['nome', 'email'] },
                { model: Horario, attributes: ['data', 'hora'] }
            ]
        })
        res.json(agendamentos)
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar agendamentos.', detalhe: err.message })
    }
})

// POST /api/adm/mapa — envia mapa pitagórico por email ao cliente
router.post('/mapa', autenticar, apenasAdmin, upload.single('mapa'), async (req, res) => {
    const { emailCliente } = req.body

    if (!req.file) {
        return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: emailCliente,
            subject: 'Seu Mapa Numerológico Pitagórico — Silvia Helena',
            text: 'Olá! Segue em anexo o seu Mapa Numerológico Pitagórico. Qualquer dúvida, entre em contato.',
            attachments: [
                {
                    filename: req.file.originalname,
                    path: req.file.path
                }
            ]
        })

        res.json({ mensagem: `Mapa enviado para ${emailCliente} com sucesso.` })

    } catch (err) {
        console.log('ERRO MAPA:', err)
        res.status(500).json({ erro: 'Erro ao enviar email.', detalhe: err.message })
    }
})

// GET /api/adm/usuarios — lista todos os usuários cadastrados (para o select do mapa)
router.get('/usuarios', autenticar, apenasAdmin, async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['nome', 'email'],
            order: [['nome', 'ASC']]
        })
        res.json(usuarios)
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar usuários.', detalhe: err.message })
    }
})

// GET /api/adm/horarios/:data — lista todos os horários de um dia (admin)
router.get('/horarios/:data', autenticar, apenasAdmin, async (req, res) => {
    try {
        const horarios = await Horario.findAll({
            where: { data: req.params.data },
            include: [
                {
                    model: Agendamento,
                    include: [
                        {
                            model: Usuario,
                            attributes: ['nome', 'email']
                        }
                    ]
                }
            ],
            order: [['hora', 'ASC']]
        })
        res.json(horarios)
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar horários.', detalhe: err.message })
    }
})

module.exports = router