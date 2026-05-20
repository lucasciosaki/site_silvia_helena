const express = require('express')
const router = express.Router()
const Horario = require('../models/Horario')
const Agendamento = require('../models/Agendamento')
const autenticar = require('../middlewares/autenticar')

// POST /api/agenda/reservar — precisa vir ANTES do /:data
router.post('/reservar', autenticar, async (req, res) => {
    const { horarioId, observacao } = req.body

    try {
        const horario = await Horario.findByPk(horarioId)

        if (!horario || !horario.disponivel) {
            return res.status(400).json({ erro: 'Horário indisponível.' })
        }

        const agendamento = await Agendamento.create({
            usuarioId: req.usuario.id,
            horarioId,
            observacao
        })

        await horario.update({ disponivel: false })

        res.status(201).json({ mensagem: 'Agendamento confirmado.', agendamento })

    } catch (err) {
        res.status(500).json({ erro: 'Erro ao reservar.', detalhe: err.message })
    }
})

// GET /api/agenda/:data — fica depois
router.get('/:data', async (req, res) => {
    try {
        const horarios = await Horario.findAll({
            where: {
                data: req.params.data,
                disponivel: true
            }
        })
        res.json(horarios)
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar horários.', detalhe: err.message })
    }
})

module.exports = router