const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const JWT_SECRET = 'jwt_secret_key'
const JWT_VALIDITY = '7 days'

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

const getLogin = async (req, res) =>{
    try{
        const user = await Usuario.findOne({nombreUsuario: req.body.usuario, password: req.body.password});
        if(!user){
            return res.status(404).json({
                message: 'Usuario o constraseña inválidos'
            })
        }

        const rol  = await Rol.findById(user.rolID);

        console.log("rol",rol);
        const allowedRoles = ["Administrador", "Jefe Almacen", "Gerente"];

        // Verifica si al menos uno de los roles del usuario está permitido
        const hasAllowedRole = allowedRoles.some(
            allowedRole => allowedRole.toLowerCase() === rol.nombre.toLowerCase()
        );
        console.log(hasAllowedRole);

        if (!hasAllowedRole) {
            return res.status(403).json({
                message: 'No tiene permisos para acceder'
            });
        }

        const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: JWT_VALIDITY,
        })

        res.status(200).json({
            status: 'success',
            accessToken,
            user
        });
    }catch(err){
        res.status(500).json({
            status: err
        })
    }
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

const createUser = async(req, res) =>{
    
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
    getLogin,
    getUserConductores,
    getUsersAdmin,
    eliminateImage
}