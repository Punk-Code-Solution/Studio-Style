import axios from 'axios';
import BaseApi from '../BaseApi.js';

class ApiService {   

  async loginUser(email, password) {
    
    const baseUrl = BaseApi.getBaseUri

    try {
      const response = await axios.post(`${baseUrl}/login`, {
        email,
        password,
      });
      return response.data;

    } catch (error) {

      console.error('Error:', error.response.data.Falha);
      return error.response.data;
    }
  }
}

export default new ApiService();
