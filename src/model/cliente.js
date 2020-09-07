const { DataTypes, Model } = require('sequelize');
const Pedido   = require('./pedido');
const sequelize = require('../config/database');

class Cliente extends Model {}

Cliente.init({
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cpf: {
        type: DataTypes.STRING(11),
        allowNull: false
    },
    logradouro: {
        type: DataTypes.STRING,
    },
    numero: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bairro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cidade: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cep: {
        type: DataTypes.STRING(8),
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    desconto_padrao: {
        type: DataTypes.DECIMAL,
        allowNull: false
    }
}, {
    //outras opções do modelo
    sequelize,//instancia da conexao
    modelName: 'Cliente',
    tableName: 'tbcliente',
    timestamps: false
});

Cliente.hasMany(Pedido, {
    onDelete: 'CASCADE'
});
Pedido.belongsTo(Cliente);

module.exports = Cliente;