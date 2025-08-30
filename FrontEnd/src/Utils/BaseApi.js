import React from 'react';

class ApiService {

    constructor() {
        this.baseUrl = 'http://localhost:3001'
    }

    get getBaseUri() {

        return this.baseUrl;

    }

}

export default new ApiService();
