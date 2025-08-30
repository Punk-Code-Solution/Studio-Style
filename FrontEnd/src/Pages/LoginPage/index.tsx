import React, { useState, ChangeEvent, FormEvent } from 'react';
import api from '../../utils/loginApi/api.jsx';
import '../../css/Login/Login.css';
import Notifications from '../../../src/pages/notification/index.jsx';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const baseUrl = 'http://localhost:3000/home'

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const responseData = await api.loginUser(email, password);      

      if(responseData.Sucesso){        
        window.location.href = baseUrl
        Notifications.handleSuccess(responseData.Sucesso)
      }else{
        Notifications.handleError(responseData.Falha)
        return false;
      }

    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container">
      <div className='.form-container'>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              placeholder="Usuário"
              type="text"
              name="email"
              value={email}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              placeholder="Senha"
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
            />
          </div>
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
