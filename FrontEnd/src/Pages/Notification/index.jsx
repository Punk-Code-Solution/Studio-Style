import React from 'react';
import { toast } from 'react-toastify';

class Notifications {

    static handleDefault(){
        toast('Mensagem default');
    }


    static handleError( mensage ) {
        toast.error( mensage );
    }


    static handleSuccess( mensage ) {
        console.log("mensage: ", mensage)
        toast.success( mensage );
    }


    static handleInfo() {
        toast.info('Mensagem info');
    }


    static handleWarn() {
        toast.warn('Mensagem warn');
    }


    static handleCustom() {
        toast('Mensagem customizada', {
        position: toast.POSITION.TOP_LEFT,
        className: 'sua-classe',
    });
    }
}
export default Notifications;
