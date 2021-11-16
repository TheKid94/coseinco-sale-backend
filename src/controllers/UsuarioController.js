const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
        const conductos = await Usuario.find({rolID: rol._id});
        let newDatos = [];
        for(var i =0;i<conductos.length;i++){
            newDatos.push(conductos[i].datos);
        }
        res.status(200).json({
            status: 'success',
            conductores: newDatos
        });
    } catch(err)
    {
        res.status(500).json({
            status: err
        })
    }
}

const getUsersAdmin = async (req, res) => {
    try
    {
        const rol = await Rol.findOne({nombre:"Cliente"});
        const listaUsers = await Usuario.find({});
        const listaUsuario = [];
        for(var i=0;i<listaUsers.length;i++){
            if(listaUsers[i].rolID != rol._id){
                listaUsuario.push(listaUsers[i]);
            }
        }
        res.status(200).json({
            status: 'success',
            listaUsuario
        });
    } catch(err)
    {
        res.status(500).json({
            status: err
        });
    }
}

const eliminateImage = async(req, res) => {
    try
    {
        const nombre = req.body.nombre;
        let result = await cloudinary.v2.uploader.destroy(nombre,{type:"url2png"},function(result) { console.log(result) });
        res.status(200).json({
            status: 'success',
            result
        });
    }catch(err)
    {
        res.status(500).json({
            status: err
        });
    }
}

module.exports = {
    getAll,
    getUser,
    getUserConductores,
    getUsersAdmin,
    eliminateImage
}