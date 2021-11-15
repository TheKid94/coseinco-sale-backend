const Proveedor = require("../models/Proveedor");

const getAll = (req, res) => {
  Proveedor.find({}, (err, proveedores) => {
    if (err) {
      return res.status(500).json({
        message: `Error al realizar la peticion: ${err}`,
      });
    }

    if (!proveedores) {
      return res.status(404).json({
        message: "No existen los proveedores",
      });
    }
    res.status(200).json({
      status: "success",
      proveedores,
    });
  });
};

const getOne = (req, res) => {
  const id = req.params.id;
  Proveedor.findById(id, (err, proveedor) => {
    if (err) {
      return res.status(500).json({
        message: `Error al realizar la peticion ${err}`,
      });
    }
    if (!proveedor) {
      return res.status(404).json({
        message: "No existe la proveedor",
      });
    }
    res.status(200).json({
      status: "success",
      proveedor,
    });
  });
};

const deshabilitarProveedor = async (req, res) => {
  let id = req.body.id;
  try {
    await Proveedor.updateOne({ _id: id }, { estado: "deshabilitado" });
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
};

const habilitarProveedor = async (req, res) => {
  let id = req.body.id;
  try {
    await Proveedor.updateOne({ _id: id }, { estado: "habilitado" });
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
};

const createProveedor = async (req, res) => {
  try {
    const proveedor = req.body.proveedor;
    if (Object.keys(proveedor).length == 0) {
      return res.status(400).json({
        status: "warning",
        status: "Debe ingresar un proveedor correcto",
      });
    }
    const proveres = await Proveedor.create(proveedor);
    res.status(200).json({
      status: "success",
      proveres,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

const modifyProveedor = async (req, res) => {
  try {
    const proveedor = req.body.proveedor;
    const id = req.body._id;
    await Proveedor.findOneAndUpdate(
      { _id : id},
      {
        razonSocial:proveedor.razonSocial,
        ruc: proveedor.ruc,
        correo: proveedor.correo,
        contacto: proveedor.contacto,
        telefono: proveedor.telefono,
        descuento: proveedor.descuento,
      }
    );
    res.json({ msg: "Proveedor actualizado" });
  } catch (error) {
   res.status(500).json({error});
  }
};

module.exports = {
  getAll,
  getOne,
  createProveedor,
  modifyProveedor,
  deshabilitarProveedor,
  habilitarProveedor,
};
