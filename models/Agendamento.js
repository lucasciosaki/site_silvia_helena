const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Agendamento = sequelize.define('Agendamento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    horarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    observacao: {
        type: DataTypes.TEXT,
        allowNull: true
    }
})

module.exports = Agendamento