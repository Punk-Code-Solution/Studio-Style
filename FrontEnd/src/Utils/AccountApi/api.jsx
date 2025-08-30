import axios from 'axios';
import BaseApi from '../BaseApi.js';

class ApiService {
    
    async findAllAccount() {
        
        const baseUrl = BaseApi.getBaseUri
        try {

        const response = await axios.get(`${baseUrl}/account`);
        return response.data;

        } catch (error) {

        console.error('Error:', error.response.data.Falha);
        return error.response.data;
        }

    }

}

export default new ApiService();
