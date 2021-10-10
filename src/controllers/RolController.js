const Rol = require("../models/Rol");

const getAll = (req, res) => {
  Rol.find({}, (err, roles) => {
    if (err) {
      return res.status(500).json({
        message: `Error al realizar la peticion: ${err}`
      });
    }

    if (!roles) {
      return res.status(404).json({
        message: "No existen los roles",
      });
    }

    res.status(200).json({
      status: "success",
      roles,
    });
  });
};

module.exports = {
    getAll
}
