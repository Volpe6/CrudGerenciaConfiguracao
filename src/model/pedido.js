const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Pedido extends Model{}

Pedido.init({}, 
{
    //outras opções do modelo
    sequelize,//instancia da conexao
    modelName: 'Pedido',
    tableName: 'tbpedido',
    timestamps: false
});

module.exports = Pedido;