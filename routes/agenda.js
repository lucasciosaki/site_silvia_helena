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

// GET /api/agenda/meus-agendamentos — lista os agendamentos do usuário logado
router.get('/meus-agendamentos', autenticar, async (req, res) => {
    try {
        const agendamentos = await Agendamento.findAll({
            where: { usuarioId: req.usuario.id },
            include: [
                { model: Horario, attributes: ['id', 'data', 'hora'] }
            ]
        })

        // Ordena na memória para evitar problemas com dialect e includes no Sequelize
        agendamentos.sort((a, b) => {
            if (a.Horario.data !== b.Horario.data) {
                return a.Horario.data.localeCompare(b.Horario.data)
            }
            return a.Horario.hora.localeCompare(b.Horario.hora)
        })

        res.json(agendamentos)
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar seus agendamentos.', detalhe: err.message })
    }
})

// DELETE /api/agenda/cancelar/:id — cancela um agendamento e libera o horário correspondente
router.delete('/cancelar/:id', autenticar, async (req, res) => {
    try {
        const agendamento = await Agendamento.findByPk(req.params.id)

        if (!agendamento) {
            return res.status(404).json({ erro: 'Agendamento não encontrado.' })
        }

        // Permite o cancelamento se for admin OU se for o próprio cliente dono do agendamento
        if (!req.usuario.isAdmin && agendamento.usuarioId !== req.usuario.id) {
            return res.status(403).json({ erro: 'Acesso negado. Você só pode cancelar seus próprios agendamentos.' })
        }

        const horarioId = agendamento.horarioId

        await agendamento.destroy()

        await Horario.update(
            { disponivel: true },
            { where: { id: horarioId } }
        )

        res.json({ mensagem: 'Agendamento cancelado com sucesso.' })
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao cancelar agendamento.', detalhe: err.message })
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