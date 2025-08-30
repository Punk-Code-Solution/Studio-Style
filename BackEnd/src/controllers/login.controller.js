const account = require('./Account.controller');
const accountControl = new account();

module.exports = class login {

  async logar( request, response ) {

    try{
      const { email, password } = request.body

      if( !email || !password ){ return response.status( 400 ).json( { "Falha": "Dados invalidos ou inexistentes" } ); }

      const resultado = await accountControl.findAccountLogin(  email, password  )

      if( resultado && resultado != 500 ){

        return response.status( 200 ).json( { 'Sucesso': 'Logado' } );
  
      }else if( resultado == 500 ) {
  
        return response.status( 500 ).json( { "Falha": "Erro interno do servidos" } );
  
      }

      return response.status( 403 ).json( { "Falha": "Email ou Senha Invalido" } );

    }catch (erro){

      return response.status( 500 ).json( { "Falha": "Erro interno do servidos" } );

    }        

  }

}
