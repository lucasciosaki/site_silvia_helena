const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Usuario = require('../models/Usuario')

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body

    try {
        const jaExiste = await Usuario.findOne({ where: { email } })
        if (jaExiste) {
            return res.status(400).json({ erro: 'E-mail já cadastrado.' })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const usuario = await Usuario.create({
            nome,
            email,
            senha: senhaCriptografada
        })

        res.status(201).json({ mensagem: 'Cadastro realizado com sucesso.', id: usuario.id })

    } catch (err) {
        console.error('ERRO NO CADASTRO:', err)
        res.status(500).json({ erro: 'Erro ao cadastrar.', detalhe: err.message })
    }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body

    try {
        const usuario = await Usuario.findOne({ where: { email } })
        if (!usuario) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
        }

        const token = jwt.sign(
            { id: usuario.id, isAdmin: usuario.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                isAdmin: usuario.isAdmin
            }
        })

    } catch (err) {
        console.error('ERRO NO LOGIN:', err)
        res.status(500).json({ erro: 'Erro ao fazer login.', detalhe: err.message })
    }
})

module.exports = router