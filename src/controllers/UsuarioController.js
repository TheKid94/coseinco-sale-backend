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

const getLogin = async (req, res) =>{
    try{
        const user = await Usuario.findOne({nombreUsuario: req.usuario, password: req.password});
        if(!user){
            res.status(404).json({
                message: 'No existe el usuario'
            })
        }
        res.status(200).json({
            status: 'success',
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
    try {
        const rol = await Rol.findOne({ nombre: "Cliente" });
        const listaUsers = await Usuario.find({});
        const users = await Promise.all(
            listaUsers.map(async (user) => {
                if (user.rolID.toString() !== rol._id.toString()) { 
                    const rolTemp = await Rol.findById(user.rolID);
                    return {
                        ...user.toObject(), 
                        rol: rolTemp ? rolTemp.nombre : null,
                    };
                }
                return null;
            })
        );
    
        res.status(200).json({
            status: "success",
            users: users.filter(Boolean),
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
}

const createUser = async(req, res) =>{
    try {

        const { usuario, datos } = req.body;
        
        // Validación de entrada
        if (!usuario || Object.keys(usuario).length === 0 || !datos || Object.keys(datos).length === 0) {
          return res.status(400).json({ status: "error", message: "Datos de entrada inválidos" });
        }

        // Inicialización del pedido
        const newUsuario = {
          nombreUsuario: usuario.nombreUsuario,
          rolID: usuario.rolID,
          password: usuario.password,
          estado: "habilitado",
          datos: datos
        };
        
        let usuarioRes = await Usuario.create(newUsuario);
        
        res.status(200).json({
          status: "success",
          usuarioRes
        });

      } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ status: "error", message: error.message });
      }
}

const updateUser = async(req, res) => {
    try {
      
        let usuario = req.body.usuario;
        let id = usuario._id;

        if (usuario.length == 0 || Object.keys(usuario).length == 0) {
            res.status(400).json({
            status: "error",
            });
            return false;
        }

        let usuarioRes = await Usuario.findByIdAndUpdate(id,{
            nombreUsuario: usuario.nombreUsuario,
            password: usuario.password,
            rolID: usuario.rolID,
            datos: usuario.datos
        });
      
        res.status(200).json({
            status: "success",
            usuarioRes
        });
    } catch (error) {
        res.status(500).json({
            error
        });
    }
}

const stateChangeUser = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({
                status: "fail",
                message: "El ID del usuario es requerido.",
            });
        }

        const usuario = await Usuario.findById(id);

        if (!usuario) {
            return res.status(404).json({
                status: "fail",
                message: "Usuario no encontrado.",
            });
        }

        const nuevoEstado = usuario.estado === "habilitado" ? "deshabilitado" : "habilitado";

        await Usuario.findByIdAndUpdate(id, { estado: nuevoEstado });

        res.status(200).json({
            status: "success",
            message: `El estado del usuario ha sido cambiado a ${nuevoEstado}.`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Ocurrió un error al cambiar el estado del usuario.",
            error: error.message,
        });
    }
};

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
    eliminateImage,
    createUser,
    updateUser,
    stateChangeUser
}