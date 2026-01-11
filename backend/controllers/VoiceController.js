const { createResponse, createError } = require("../utils/responseUtil");
const {
    addReminder,
    deleteReminder
} = require("../voice-controller/VoiceReminderController");

const executeVoiceCommand = (req,res) =>{
    
    const intent = req.body.intent;
    if(!intent){
        return res.status(200).json(createError("VALIDATION_ERROR", "Intent is required."));
    }

    if(intent == 'set_reminder'){
        addReminder(req, res);
    }else if(intent == 'delete_reminder'){
        deleteReminder(req, res);
    }

}

module.exports = { executeVoiceCommand };