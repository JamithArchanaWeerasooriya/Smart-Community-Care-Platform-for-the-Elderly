import { useEffect, useMemo, useState } from 'react';
import 'material-icons/iconfont/material-icons.css';
import { useSearchParams } from 'react-router-dom';
const BACKEND_API_ENDPOINT = import.meta.env.VITE_BACKEND_API_ENDPOINT;

function FallDetection() {


    return (
        <>
            <div style={{height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                This is fall detection
            </div>
        </>
    );
}

export default FallDetection;