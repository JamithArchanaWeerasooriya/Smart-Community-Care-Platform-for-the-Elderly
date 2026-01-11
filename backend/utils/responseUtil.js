errorResponseUnAuthorize = ()=>{
    return createError("UNAUTHORIZED","You are not authorized to access.");
}

createResponse = (data)=>{

    const response = {
        "status": "success",
        "data": data
    };

    return response;
}

createError = (errorCode,message)=>{

    const errorResponse = {
        "status":"error",
        "error": {
            "code": errorCode,
            "message": message
        }
    };

    return errorResponse;
}

module.exports = {createResponse,createError,errorResponseUnAuthorize};