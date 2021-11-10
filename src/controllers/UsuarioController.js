const { model } = require('mongoose');
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');

const getAll = (req, res) => {
    Usuario.find({}, (err, users) => {
        if (err) {
            return res.status(500).json({
                message: `Error al realizar la petición: ${err}`
            })
        }
        if (!users) {
            return res.status(404).json({
                message: 'No existen usuarios'
            })
        }
        res.status(200).json({
            status: 'success',
            users
        });
    });
}

const getUser = (req, res) => {

    const id = req.params.id;
    Usuario.findById(id, (err, user) => {
        if (err) {
            return res.status(500).json({
                message: `Error al realizar la peticion ${err}`
            })
        }
        if (!user) {
            return res.status(404).json({
                message: 'No existe el usuario'
            })
        }
        res.status(200).json({
            status: 'success',
            user
        });
    });

}

const getUserConductores = async (req, res) => {
    try
    {
        const rol = await Rol.findOne({nombre:"Conductor"});
        const conductores = await Usuario.find({rolID: rol._id});
        res.status(200).json({
            status: 'success',
            conductores
        });
    } catch(err)
    {
        res.status(500).json({
            status: err
        })
    }
}

module.exports = {
    getAll,
    getUser,
    getUserConductores
}