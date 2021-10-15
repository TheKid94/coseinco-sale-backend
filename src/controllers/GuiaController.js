const Guia = require("../models/Guia");

const getGuiabyId = async (req, res) => {

    let id = req.params.id; 
    let guia = await Guia.findById(id);
    let url = guia.url; 

    return url; 
}

module.exports = {

    getGuiabyId
}
