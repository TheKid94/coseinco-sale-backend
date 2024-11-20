const MovimientoEntrada = require('../models/MovimientoEntrada');
const MovimientoSalida = require('../models/MovimientoSalida');

const createMovimientoBasico = async (req, res) => {
    try {
      
        let newMovimiento = new Object();
        newMovimiento.archivosAdjuntos = [];
        newMovimiento.nSerie = "";
        newMovimiento.precioCompra = 0.00;
        newMovimiento.fechaCreacion = Date.now();
        newMovimiento.productID = "";

        let movRes = await MovimientoEntrada.create(newMovimiento);
        let movID = movRes._id;
        
        res.status(200).json({
            status: "success",
            movID
        });
    } catch (error) {
        res.status(500).json({
            error
        });
    }
}

const getMovimientoEntrada = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const name = req.query.name || '';
    
        // Calcular el número de documentos a saltar
        const skip = (page - 1) * limit;
    
        // Construir el filtro por estado
        const filtro = {};
        if (name && name.trim() !== '') {
            const regex = new RegExp(name, 'i');
            filtro['productoInfo.nombre'] = { $regex: regex };
        }

        // Consulta con agregación
        const movimientoEntradaRes = await MovimientoEntrada.aggregate([
            {
              $addFields: {
                productID: { $toObjectId: "$productID" }, // Convertir productID a ObjectId si es necesario
              },
            },
            {
              $lookup: {
                from: "Producto",
                localField: "productID",
                foreignField: "_id",
                as: "productoInfo",
              },
            },
            {
              $unwind: "$productoInfo",
            },
            {
                $addFields: {
                  "productoInfo.marcaID": { $toObjectId: "$productoInfo.marcaID" }, // Convertir productID a ObjectId si es necesario
                },
              },
            {
              $lookup: {
                from: "Marca", // Asumiendo que "marcas" es el nombre correcto de la colección
                localField: "productoInfo.marcaID",
                foreignField: "_id",
                as: "marcaInfo",
              },
            },
            {
              $unwind: {
                path: "$marcaInfo",
                preserveNullAndEmptyArrays: true, // Si no hay coincidencias, deja marcaInfo vacío
              },
            },
            {
              $match: filtro, // Aplicar cualquier filtro dinámico
            },
            {
              $project: {
                _id: 1,
                archivosAdjuntos: 1,
                datos: 1,
                fechaCreacion: 1,
                precioCompraTotal: 1,
                "productoInfo.nombre": 1,
                "productoInfo.estado": 1,
                "marcaInfo.nombre": 1,
              },
            },
            {
              $skip: skip, // Saltar documentos para paginación
            },
            {
              $limit: limit, // Limitar el número de documentos para paginación
            },
          ]);


          const totalMovmientos = await MovimientoEntrada.aggregate([
            {
                $addFields: {
                  productID: { $toObjectId: "$productID" }, // Convertir productID a ObjectId si es necesario
                },
              },
            {
              $lookup: {
                from: "Producto",
                localField: "productID",
                foreignField: "_id",
                as: "productoInfo",
              },
            },
            {
              $unwind: "$productoInfo",
            },
            {
                $addFields: {
                  "productoInfo.marcaID": { $toObjectId: "$productoInfo.marcaID" }, // Convertir productID a ObjectId si es necesario
                },
              },
            {
              $lookup: {
                from: "Marca",
                localField: "productoInfo.marcaID",
                foreignField: "_id",
                as: "marcaInfo",
              },
            },
            {
              $unwind: {
                path: "$marcaInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: filtro,
            },
            {
              $count: "total",
            }
          ]);
        
          const totalItems = totalMovmientos.length > 0 ? totalMovmientos[0].total : 0;
          const totalPages = Math.ceil(totalItems / limit);
    
          if (!movimientoEntradaRes.length) {
            return res.status(404).json({
              cod: 1,
              message: "No se encontraron registros para los criterios proporcionados.",
            });
          }
      
          res.status(200).json({
            status: "success",
            movimientoEntradaRes,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                itemsPerPage: limit,
              },
          });
    
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
}

const getMovimientoSalida = async (req, res) => {
  try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const name = req.query.name || '';
  
      // Calcular el número de documentos a saltar
      const skip = (page - 1) * limit;
  
      // Construir el filtro por estado
      const filtro = {};
      if (name && name.trim() !== '') {
          const regex = new RegExp(name, 'i');
          filtro['productoInfo.nombre'] = { $regex: regex };
      }

      // Consulta con agregación
      const movimientoSalidaRes = await MovimientoSalida.aggregate([
          {
            $addFields: {
              productoID: { $toObjectId: "$productoID" }, // Convertir productID a ObjectId si es necesario
            },
          },
          {
            $lookup: {
              from: "Producto",
              localField: "productoID",
              foreignField: "_id",
              as: "productoInfo",
            },
          },
          {
            $unwind: "$productoInfo",
          },
          {
              $addFields: {
                "productoInfo.marcaID": { $toObjectId: "$productoInfo.marcaID" }, // Convertir productID a ObjectId si es necesario
              },
            },
          {
            $lookup: {
              from: "Marca", // Asumiendo que "marcas" es el nombre correcto de la colección
              localField: "productoInfo.marcaID",
              foreignField: "_id",
              as: "marcaInfo",
            },
          },
          {
            $unwind: {
              path: "$marcaInfo",
              preserveNullAndEmptyArrays: true, // Si no hay coincidencias, deja marcaInfo vacío
            },
          },
          {
            $match: filtro, // Aplicar cualquier filtro dinámico
          },
          {
            $project: {
              _id: 1,
              archivosAdjuntos: 1,
              datos: 1,
              fechaCreacion: 1,
              precioUnitario: 1,
              precioVentaTotal: 1,
              productoID: 1,
              pedidoID: 1,
              "productoInfo.nombre": 1,
              "productoInfo.estado": 1,
              "marcaInfo.nombre": 1,
            },
          },
          {
            $skip: skip, // Saltar documentos para paginación
          },
          {
            $limit: limit, // Limitar el número de documentos para paginación
          },
        ]);


        const totalMovmientos = await MovimientoSalida.aggregate([
          {
              $addFields: {
                productoID: { $toObjectId: "$productoID" }, // Convertir productID a ObjectId si es necesario
              },
            },
          {
            $lookup: {
              from: "Producto",
              localField: "productoID",
              foreignField: "_id",
              as: "productoInfo",
            },
          },
          {
            $unwind: "$productoInfo",
          },
          {
              $addFields: {
                "productoInfo.marcaID": { $toObjectId: "$productoInfo.marcaID" }, // Convertir productID a ObjectId si es necesario
              },
            },
          {
            $lookup: {
              from: "Marca",
              localField: "productoInfo.marcaID",
              foreignField: "_id",
              as: "marcaInfo",
            },
          },
          {
            $unwind: {
              path: "$marcaInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: filtro,
          },
          {
            $count: "total",
          }
        ]);
      
        const totalItems = totalMovmientos.length > 0 ? totalMovmientos[0].total : 0;
        const totalPages = Math.ceil(totalItems / limit);
  
        if (!movimientoSalidaRes.length) {
          return res.status(404).json({
            cod: 1,
            message: "No se encontraron registros para los criterios proporcionados.",
          });
        }
    
        res.status(200).json({
          status: "success",
          movimientoSalidaRes,
          pagination: {
              totalItems,
              currentPage: page,
              totalPages,
              itemsPerPage: limit,
            },
        });
  
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
}

module.exports = {
    createMovimientoBasico,
    getMovimientoEntrada,
    getMovimientoSalida
}