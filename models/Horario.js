const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Horario = sequelize.define('Horario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    data: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    disponivel: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
})

module.exports = Horario